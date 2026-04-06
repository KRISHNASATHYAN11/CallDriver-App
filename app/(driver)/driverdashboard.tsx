import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";

// ✅ Import API client & selfie verification component
import { driverApi, bookingApi } from "../../src/api/driverApi";
import SelfieVerification from "../../components/FaceVerification";

const { width, height } = Dimensions.get("window");
const SOCKET_URL =
  process.env.EXPO_PUBLIC_API_URL_DEV || "http://192.168.29.15:3000";

// ⚠️ Replace with real driver ID from auth context / AsyncStorage
const DRIVER_ID = "driver_123";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#868686" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3a4a5c" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7f8c8d" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c3e50" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#34495e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1a252f" }],
  },
];

export default function DriverDashboard() {
  const router = useRouter();

  // =========================================================================
  // STATE
  // =========================================================================
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Selfie verified this session
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRideActive, setIsRideActive] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  const [rideStatus, setRideStatus] = useState<
    "en_route" | "arrived" | "ongoing"
  >("en_route");
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const otpInputs = useRef<(TextInput | null)[]>([]);

  // Profile image modals
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  // Ride request
  const [hasRequest, setHasRequest] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showTuningEffect, setShowTuningEffect] = useState(false);

  // Selfie verification modal
  const [showSelfieVerification, setShowSelfieVerification] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const soundObject = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef<number>(30);
  const isMountedRef = useRef<boolean>(true);
  const debounceLocationRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Animations
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const onlinePulse = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const edgeGlow = useRef(new Animated.Value(0)).current;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 18) return "Good Afternoon,";
    return "Good Evening,";
  };

  // =========================================================================
  // 1. FETCH DRIVER PROFILE ON MOUNT (optional — to pre-fill name, image, etc.)
  // =========================================================================
  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    try {
      const res = await driverApi.getDriver(DRIVER_ID);
      if (res.success && res.data) {
        if (res.data.imgUrl) setProfileImage(res.data.imgUrl);
        // If driver was online when app closed, ask for re-verification
        if (res.data.isOnline && !res.data.isOnTrip) {
          // Optionally go straight to online if verified recently
        }
      }
    } catch (e: any) {
      console.log("Failed to fetch profile:", e.message);
    }
  };

  // =========================================================================
  // 2. SOCKET CONNECTION (LISTEN ONLY — all actions via REST API)
  // =========================================================================
  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      auth: { userId: DRIVER_ID, role: "driver" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("join-driver", DRIVER_ID);
    });

    socket.on("disconnect", (reason) =>
      console.log("❌ Socket disconnected:", reason),
    );
    socket.on("connect_error", (error) =>
      console.log("🔴 Socket error:", error.message),
    );

    // New booking notification (from server when customer books)
    socket.on("new-booking", (data) => {
      if (!isMountedRef.current || isRideActive) return;
      handleIncomingRide(data);
    });

    // Booking cancelled by customer
    socket.on("booking-cancelled", (data) => {
      const cancelledId =
        data.bookingId || data.booking?._id || data.booking?.bookingId;
      if (
        bookingData?.id === cancelledId ||
        bookingData?.bookingId === cancelledId
      ) {
        stopAlerts();
        setHasRequest(false);
        setBookingData(null);
        modalScale.setValue(0);
        modalOpacity.setValue(0);
        Alert.alert("Ride Cancelled", "Passenger has cancelled this ride.");
      }
    });

    // Booking accepted by another driver (race condition)
    socket.on("booking-taken", (data) => {
      const takenId =
        data.bookingId || data.booking?._id || data.booking?.bookingId;
      if (
        hasRequest &&
        (bookingData?.id === takenId || bookingData?.bookingId === takenId)
      ) {
        stopAlerts();
        setHasRequest(false);
        setBookingData(null);
        modalScale.setValue(0);
        modalOpacity.setValue(0);
        Alert.alert(
          "Ride Taken",
          "This ride has been accepted by another driver.",
        );
      }
    });

    socket.on("error", (data) => {
      console.log("Socket error:", data.message);
    });
  }, [bookingData?.id, bookingData?.bookingId, isRideActive, hasRequest]);

  useEffect(() => {
    isMountedRef.current = true;
    initializeSocket();
    return () => {
      isMountedRef.current = false;
      stopAlerts();
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, []);

  // =========================================================================
  // ANIMATIONS
  // =========================================================================
  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(onlinePulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(onlinePulse, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      onlinePulse.stopAnimation();
      onlinePulse.setValue(0);
    }
  }, [isOnline]);

  useEffect(() => {
    let rings: Animated.CompositeAnimation | null = null;
    let edges: Animated.CompositeAnimation | null = null;

    if (showTuningEffect) {
      [ring1, ring2, ring3].forEach((r) => r.setValue(0));
      edgeGlow.setValue(0);

      rings = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(ring2, {
              toValue: 1,
              duration: 2000,
              delay: 300,
              useNativeDriver: true,
            }),
            Animated.timing(ring3, {
              toValue: 1,
              duration: 2000,
              delay: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(500),
        ]),
      );

      edges = Animated.loop(
        Animated.sequence([
          Animated.timing(edgeGlow, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(edgeGlow, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );

      rings.start();
      edges.start();
    } else {
      [ring1, ring2, ring3].forEach((r) => {
        r.stopAnimation();
        r.setValue(0);
      });
      edgeGlow.stopAnimation();
      edgeGlow.setValue(0);
    }

    return () => {
      rings?.stop();
      edges?.stop();
    };
  }, [showTuningEffect]);

  // =========================================================================
  // ALERT HANDLERS
  // =========================================================================
  const handleIncomingRide = (data: any) => {
    if (!isMountedRef.current) return;
    setBookingData(data);
    setHasRequest(true);
    setShowTuningEffect(true);
    timeLeftRef.current = 30;
    setTimeLeft(30);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    playNotificationSound();
    startTimer();

    Animated.timing(modalScale, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true,
    }).start();
  };

  const playNotificationSound = async () => {
    try {
      if (soundObject.current) {
        await soundObject.current.stopAsync();
        await soundObject.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/images/mixkit-happy-bells-notification-937.mp3"),
        { shouldPlay: true, isLooping: true },
      );
      soundObject.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.log("Sound error:", e);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) return clearInterval(timerRef.current!);
      timeLeftRef.current -= 1;
      if (timeLeftRef.current <= 0) {
        declineRide();
      } else {
        setTimeLeft(timeLeftRef.current);
      }
    }, 1000);
  };

  const stopAlerts = async () => {
    setShowTuningEffect(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      if (soundObject.current) {
        await soundObject.current.stopAsync();
        await soundObject.current.unloadAsync();
        soundObject.current = null;
      }
    } catch (e) {}
  };

  // =========================================================================
  // PROFILE PICTURE LOGIC
  // =========================================================================
  const handleAvatarPress = () => {
    if (profileImage) {
      Alert.alert("Profile Photo", "Choose an action", [
        { text: "View Photo", onPress: () => setIsViewModalVisible(true) },
        { text: "Update Photo", onPress: () => pickImage("gallery") },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      Alert.alert(
        "Set Profile Picture",
        "Choose how you want to add your photo",
        [
          { text: "Take Photo", onPress: () => pickImage("camera") },
          { text: "Choose from Gallery", onPress: () => pickImage("gallery") },
          { text: "Cancel", style: "cancel" },
        ],
      );
    }
  };

  const pickImage = async (type: "camera" | "gallery") => {
    let result;
    if (type === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted")
        return Alert.alert("Permission Required", "Camera access is needed.");
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted")
        return Alert.alert("Permission Required", "Gallery access is needed.");
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }
    if (!result.canceled && result.assets[0].uri) {
      setPendingImage(result.assets[0].uri);
      setIsConfirmModalVisible(true);
    }
  };

  const confirmProfilePic = async () => {
    setIsConfirmModalVisible(false);
    const imageUri = pendingImage;
    setProfileImage(imageUri);
    setPendingImage(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await driverApi.updateDriver(DRIVER_ID, { imgUrl: imageUri });
      console.log("✅ Profile image saved to backend");
    } catch (e: any) {
      console.log("❌ Failed to save image:", e.message);
      Alert.alert("Error", "Failed to save image to server.");
    }
  };

  // =========================================================================
  // ★★★ GO ONLINE / OFFLINE — WITH SELFIE VERIFICATION ★★★
  // =========================================================================

  /**
   * Flow when driver taps "GO ONLINE":
   *  1. If NOT verified this session → show selfie camera
   *  2. After verification succeeds → actually go online via REST API
   *  3. If already verified this session → go online directly (skip selfie)
   */
  const handleGoOnlineTap = () => {
    if (isToggling) return;

    if (!isOnline) {
      // Going ONLINE — check if selfie verification is needed
      if (!isVerified) {
        // Show selfie verification camera
        setShowSelfieVerification(true);
      } else {
        // Already verified this session — go online directly
        goOnline();
      }
    } else {
      // Going OFFLINE
      goOffline();
    }
  };

  /** Called after selfie verification succeeds */
  const onSelfieVerified = () => {
    setShowSelfieVerification(false);
    setIsVerified(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Now actually go online
    goOnline();
  };

  /** Called if driver cancels selfie verification */
  const onSelfieCancelled = () => {
    setShowSelfieVerification(false);
  };

  /**
   * Actually go online via REST API + update location + start socket
   */
  const goOnline = async () => {
    setIsToggling(true);
    try {
      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "Please enable location services to go online.",
        );
        setIsToggling(false);
        return;
      }

      // 2. Get current location (fast, low accuracy for initial fix)
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const { latitude, longitude } = loc.coords;

      // 3. ✅ REST API: Toggle online status
      await driverApi.toggleOnlineStatus(DRIVER_ID, true);

      // 4. ✅ REST API: Update location in DB
      await driverApi.updateLocation(DRIVER_ID, longitude, latitude);

      // 5. Update local state
      setDriverLocation({ latitude, longitude });
      setIsOnline(true);

      // 6. Socket: notify server (for room joining / push notification routing)
      socketRef.current?.emit("driver-online", {
        driverId: DRIVER_ID,
        location: { lat: latitude, lng: longitude },
      });

      console.log("✅ Went online via REST API (verified)");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.message || "Failed to go online. Please try again.",
      );
    } finally {
      setIsToggling(false);
    }
  };

  /**
   * Go offline via REST API
   */
  const goOffline = async () => {
    setIsToggling(true);
    try {
      // 1. ✅ REST API: Set offline
      await driverApi.toggleOnlineStatus(DRIVER_ID, false);

      // 2. Update local state
      setIsOnline(false);
      setIsVerified(false); // Reset — require re-verification next time

      // 3. Stop location tracking
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      // 4. Socket: notify
      socketRef.current?.emit("driver-offline", { driverId: DRIVER_ID });

      console.log("✅ Went offline via REST API");
    } catch (e: any) {
      Alert.alert("Error", "Failed to go offline.");
    } finally {
      setIsToggling(false);
    }
  };

  // =========================================================================
  // ACCEPT RIDE (REST API)
  // =========================================================================
  const acceptRide = async () => {
    stopAlerts();
    setIsLoading(true);

    try {
      // 1. Get current location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      const bookingId = bookingData?.id || bookingData?._id;

      // 2. ✅ REST API: Accept booking
      const response = await bookingApi.acceptBooking(bookingId, DRIVER_ID, {
        lat: latitude,
        lng: longitude,
      });

      // 3. Update local state
      setDriverLocation({ latitude, longitude });
      setHasRequest(false);
      setIsRideActive(true);
      setRideStatus("en_route");
      setOtp(["", "", "", ""]);

      // Merge server response
      if (response?.data?.booking) {
        setBookingData((prev: any) => ({ ...prev, ...response.data.booking }));
      } else if (response?.data) {
        setBookingData((prev: any) => ({ ...prev, ...response.data }));
      }

      // 4. Socket: Join booking room for real-time updates
      socketRef.current?.emit("join-booking", bookingId);

      // 5. Start live tracking
      startLiveTracking(bookingId);

      console.log("✅ Accepted ride via REST API");
    } catch (e: any) {
      console.log("❌ Accept failed:", e.response?.data || e.message);
      Alert.alert(
        "Error",
        e.message || "Failed to accept ride. It may have been taken.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // DECLINE RIDE (REST API)
  // =========================================================================
  const declineRide = async () => {
    stopAlerts();
    setHasRequest(false);

    try {
      const bookingId = bookingData?.id || bookingData?._id;

      // ✅ REST API: Reject booking
      await bookingApi.rejectBooking(bookingId, DRIVER_ID);

      // Socket: Notify (optional — API already handles it)
      socketRef.current?.emit("decline-ride", {
        driverId: DRIVER_ID,
        bookingId,
      });

      console.log("✅ Declined ride via REST API");
    } catch (e: any) {
      console.log("❌ Decline failed:", e.message);
    } finally {
      setBookingData(null);
      modalScale.setValue(0);
      modalOpacity.setValue(0);
    }
  };

  // =========================================================================
  // LIVE LOCATION TRACKING (REST API + Socket)
  // =========================================================================
  const debouncedApiLocationUpdate = (lng: number, lat: number) => {
    if (debounceLocationRef.current) clearTimeout(debounceLocationRef.current);
    debounceLocationRef.current = setTimeout(() => {
      driverApi
        .updateLocation(DRIVER_ID, lng, lat)
        .catch((e: any) =>
          console.log("Location DB update failed:", e.message),
        );
    }, 10000); // Persist to DB every 10s
  };

  const startLiveTracking = async (bookingId: string) => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 10,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        setDriverLocation({ latitude, longitude });

        // Socket: Real-time location to customer (instant, no DB)
        socketRef.current?.emit("driver-location", {
          bookingId,
          driverId: DRIVER_ID,
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
        });

        // REST API: Persist to DB (debounced, every 10s)
        debouncedApiLocationUpdate(longitude, latitude);
      },
    );
  };

  // =========================================================================
  // DRIVER ARRIVED (REST API)
  // =========================================================================
  const handleArrived = async () => {
    try {
      const bookingId = bookingData?.id || bookingData?._id;

      // ✅ REST API: Mark arrived
      await bookingApi.markArrived(bookingId, DRIVER_ID);

      // Update local state
      setRideStatus("arrived");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Socket: Notify customer
      socketRef.current?.emit("driver-arrived", {
        bookingId,
        driverId: DRIVER_ID,
      });

      console.log("✅ Marked arrived via REST API");
    } catch (e: any) {
      console.log("❌ Arrived error:", e.message);
      Alert.alert("Error", e.message || "Failed to update arrival status.");
    }
  };

  // =========================================================================
  // OTP CHANGE HANDLER
  // =========================================================================
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
    if (newOtp.join("").length === 4) {
      Keyboard.dismiss();
    }
  };

  // =========================================================================
  // VERIFY OTP & START RIDE (REST API)
  // =========================================================================
  const verifyOtpAndStart = async () => {
    const enteredOtp = otp.join("");
    const bookingId = bookingData?.id || bookingData?._id;

    try {
      setIsLoading(true);

      // ✅ REST API: Start trip (server verifies OTP)
      await bookingApi.startTrip(bookingId, enteredOtp);

      // Update local state
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRideStatus("ongoing");

      // Socket: Notify customer (optional, API already handles)
      socketRef.current?.emit("start-ride", {
        bookingId,
        driverId: DRIVER_ID,
        otp: enteredOtp,
      });

      console.log("✅ Started ride via REST API");
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setOtp(["", "", "", ""]);
      otpInputs.current[0]?.focus();
      Alert.alert("Error", e.message || "OTP verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // END RIDE (REST API)
  // =========================================================================
  const endRide = async () => {
    const bookingId = bookingData?.id || bookingData?._id;

    try {
      setIsLoading(true);

      // ✅ REST API: End trip
      await bookingApi.endTrip(bookingId, DRIVER_ID, Date.now());

      // Socket: Notify (optional)
      socketRef.current?.emit("complete-ride", {
        bookingId,
        driverId: DRIVER_ID,
        endTime: Date.now(),
      });

      socketRef.current?.emit("leave-booking", bookingId);

      // Cleanup
      if (debounceLocationRef.current)
        clearTimeout(debounceLocationRef.current);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      // Reset state
      setIsRideActive(false);
      setBookingData(null);
      setDriverLocation(null);
      setRideStatus("en_route");
      setOtp(["", "", "", ""]);

      console.log("✅ Ended ride via REST API");
    } catch (e: any) {
      console.log("❌ End ride error:", e.message);
      Alert.alert("Error", "Failed to complete ride.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // SIMULATE RIDE (For Testing)
  // =========================================================================
  const simulateRide = () => {
    const fakeData = {
      id: "sim_" + Date.now(),
      _id: "sim_" + Date.now(),
      bookingId: "BK" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      userName: "Sarah Mathew",
      pickup: "456 Kowdiar Ave",
      dropoff: "Technopark",
      fare: "₹245",
      rating: "4.9",
      otp: "1234",
      pickupCoords: { latitude: 8.5241, longitude: 76.9366 },
      dropCoords: { latitude: 8.5108, longitude: 76.965 },
    };
    handleIncomingRide(fakeData);
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <View style={styles.container}>
      {/* Selfie Verification Modal */}
      <SelfieVerification
        visible={showSelfieVerification}
        driverId={DRIVER_ID}
        onSuccess={onSelfieVerified} // ✅ FIXED
        onCancel={onSelfieCancelled}
      />

      {/* Tuning Effect (ride request rings) */}
      {showTuningEffect && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {[ring1, ring2, ring3].map((anim, i) => (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 100,
                height: 100,
                marginLeft: -50,
                marginTop: -50,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: "rgba(52, 211, 153, 0.6)",
                opacity: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 0.3, 0],
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 8],
                    }),
                  },
                ],
              }}
            />
          ))}
          <Animated.View style={[styles.edgeGlowTop, { opacity: edgeGlow }]}>
            <LinearGradient
              colors={["rgba(52, 211, 153, 0.3)", "transparent"]}
              style={{ flex: 1 }}
            />
          </Animated.View>
          <Animated.View style={[styles.edgeGlowBottom, { opacity: edgeGlow }]}>
            <LinearGradient
              colors={["transparent", "rgba(52, 211, 153, 0.3)"]}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      )}

      {/* ===== TOP BAR ===== */}
      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/(driver)/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          <View style={styles.notifDot} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleGoOnlineTap}
          disabled={isToggling}
          style={styles.toggleWrapper}
        >
          <Animated.View
            style={[styles.toggleGlow, { opacity: onlinePulse }]}
          />
          <LinearGradient
            colors={
              isOnline
                ? ["rgba(52,211,153,0.2)", "rgba(52,211,153,0.05)"]
                : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.02)"]
            }
            style={styles.toggleBtn}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color="#34d399" />
            ) : (
              <View
                style={[
                  styles.toggleDot,
                  { backgroundColor: isOnline ? "#34d399" : "#666" },
                ]}
              />
            )}
            <Text
              style={[
                styles.toggleText,
                { color: isOnline ? "#34d399" : "#999" },
              ]}
            >
              {isToggling ? "LOADING..." : isOnline ? "ONLINE" : "GO ONLINE"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/(driver)/wallet")}
        >
          <Ionicons name="wallet-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ===== MAP ===== */}
      {(isOnline || isRideActive) && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={darkMapStyle}
          initialRegion={{
            latitude: 8.5241,
            longitude: 76.9366,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          region={
            driverLocation
              ? {
                  ...driverLocation,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : undefined
          }
        >
          {driverLocation && (
            <Marker coordinate={driverLocation} title="You">
              <View style={styles.markerOuter}>
                <View style={styles.driverMarker}>
                  <Ionicons name="car-sport" size={18} color="#34d399" />
                </View>
              </View>
            </Marker>
          )}
          {isRideActive && bookingData?.pickupCoords && (
            <Marker coordinate={bookingData.pickupCoords} title="Pickup">
              <View style={styles.pickupMarker}>
                <View style={styles.pickupDot} />
              </View>
            </Marker>
          )}
          {isRideActive &&
            rideStatus === "ongoing" &&
            bookingData?.dropCoords && (
              <Marker coordinate={bookingData.dropCoords} title="Drop">
                <View style={styles.dropMarker}>
                  <View style={styles.dropDot} />
                </View>
              </Marker>
            )}
        </MapView>
      )}

      {/* ===== ACTIVE RIDE UI ===== */}
      {isRideActive && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableOpacity style={styles.closeRideBtn} onPress={endRide}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.rideCard} pointerEvents="auto">
            {/* EN ROUTE */}
            {rideStatus === "en_route" && (
              <>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: "rgba(59,130,246,0.15)" },
                  ]}
                >
                  <Ionicons name="navigate" size={14} color="#3b82f6" />
                  <Text style={[styles.pillText, { color: "#3b82f6" }]}>
                    En Route
                  </Text>
                </View>
                <Text style={styles.destLabel}>PICKUP</Text>
                <Text style={styles.destText}>{bookingData?.pickup}</Text>
                <View style={styles.rideBtnRow}>
                  <TouchableOpacity
                    style={[styles.rideBtn, { backgroundColor: "#1e293b" }]}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.rideBtnText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.rideBtn,
                      { flex: 2, backgroundColor: "#34d399" },
                    ]}
                    onPress={handleArrived}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#000" />
                    <Text style={[styles.rideBtnText, { color: "#000" }]}>
                      Arrived
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ARRIVED — OTP VERIFICATION */}
            {rideStatus === "arrived" && (
              <>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: "rgba(250,204,21,0.15)" },
                  ]}
                >
                  <Ionicons name="key" size={14} color="#facc15" />
                  <Text style={[styles.pillText, { color: "#facc15" }]}>
                    Verify PIN
                  </Text>
                </View>
                <Text style={styles.subText}>
                  Ask passenger for their 4-digit PIN
                </Text>
                <View style={styles.otpRow}>
                  {[0, 1, 2, 3].map((i) => (
                    <TextInput
                      key={i}
                      ref={(r) => {
                        otpInputs.current[i] = r;
                      }}
                      style={styles.otpBox}
                      keyboardType="number-pad"
                      maxLength={1}
                      onChangeText={(t) => handleOtpChange(t, i)}
                      value={otp[i]}
                      selectionColor="#fff"
                      placeholder="·"
                      placeholderTextColor="#555"
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.rideBtn,
                    {
                      backgroundColor: "#000",
                      borderWidth: 1,
                      borderColor: "#34d399",
                    },
                  ]}
                  onPress={verifyOtpAndStart}
                  disabled={isLoading || otp.join("").length !== 4}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#34d399" />
                  ) : (
                    <>
                      <Ionicons name="play" size={18} color="#34d399" />
                      <Text style={[styles.rideBtnText, { color: "#34d399" }]}>
                        Start Ride
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* ONGOING */}
            {rideStatus === "ongoing" && (
              <>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: "rgba(52,211,153,0.15)" },
                  ]}
                >
                  <Ionicons name="car" size={14} color="#34d399" />
                  <Text style={[styles.pillText, { color: "#34d399" }]}>
                    Ride Active
                  </Text>
                </View>
                <Text style={styles.destLabel}>DROPOFF</Text>
                <Text style={styles.destText}>{bookingData?.dropoff}</Text>
                <TouchableOpacity
                  style={[styles.rideBtn, { backgroundColor: "#ef4444" }]}
                  onPress={endRide}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flag" size={18} color="#fff" />
                      <Text style={styles.rideBtnText}>Complete Ride</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* ===== IDLE ONLINE UI ===== */}
      {isOnline && !isRideActive && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <SafeAreaView style={styles.bottomSheetWrapper} edges={["bottom"]}>
            <ScrollView
              style={styles.bottomSheet}
              pointerEvents="auto"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.profileRow}>
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  style={styles.avatarContainer}
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <Ionicons name="person-add" size={24} color="#64748b" />
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.welcomeText}>{getGreeting()}</Text>
                  <Text style={styles.driverNameText}>Anand</Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push("/(driver)/wallet")}
              >
                <View style={styles.earningsCard}>
                  <Text style={styles.earnLabel}>Today's Earnings</Text>
                  <Text style={styles.earnAmount}>$ 245.50</Text>
                  <View style={styles.earnFooter}>
                    <View style={styles.earnStat}>
                      <Ionicons name="car-sport" size={16} color="#94a3b8" />
                      <Text style={styles.earnStatText}>8 Rides</Text>
                    </View>
                    <View style={styles.earnStat}>
                      <Ionicons name="time" size={16} color="#94a3b8" />
                      <Text style={styles.earnStatText}>6.5 Hrs</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={simulateRide}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: "rgba(139,92,246,0.15)" },
                    ]}
                  >
                    <Ionicons name="bug-outline" size={20} color="#8b5cf6" />
                  </View>
                  <Text style={styles.actionText}>Test Ride</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* ===== OFFLINE STATE ===== */}
      {!isOnline && !isRideActive && (
        <SafeAreaView style={styles.offlineWrapper} edges={["top", "bottom"]}>
          <ScrollView
            style={styles.offlineContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={styles.profileRow}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                style={styles.avatarContainer}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Ionicons name="person-add" size={24} color="#64748b" />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.welcomeText}>{getGreeting()}</Text>
                <Text style={styles.driverNameText}>Anand</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/(driver)/wallet")}
            >
              <View style={styles.earningsCard}>
                <Text style={styles.earnLabel}>Today's Earnings</Text>
                <Text style={styles.earnAmount}>$ 245.50</Text>
                <View style={styles.earnFooter}>
                  <View style={styles.earnStat}>
                    <Ionicons name="car-sport" size={16} color="#94a3b8" />
                    <Text style={styles.earnStatText}>8 Rides</Text>
                  </View>
                  <View style={styles.earnStat}>
                    <Ionicons name="time" size={16} color="#94a3b8" />
                    <Text style={styles.earnStatText}>6.5 Hrs</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="star" size={24} color="#facc15" />
                <Text style={styles.statNumber}>4.85</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#34d399" />
                <Text style={styles.statNumber}>1,250</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>
            </View>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={simulateRide}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: "rgba(139,92,246,0.15)" },
                  ]}
                >
                  <Ionicons name="bug-outline" size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.actionText}>Test Ride</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* ===== RIDE REQUEST MODAL ===== */}
      <Modal
        animationType="none"
        transparent
        visible={hasRequest}
        onRequestClose={declineRide}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.rideModal,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            <View style={styles.timerCircle}>
              <Text
                style={[
                  styles.timerNum,
                  { color: timeLeft <= 10 ? "#ef4444" : "#fff" },
                ]}
              >
                {timeLeft}
              </Text>
            </View>
            <Text style={styles.modalTitle}>New Ride Request</Text>
            <View style={styles.passengerRow}>
              <View style={styles.passAvatar}>
                <Text style={styles.passChar}>
                  {bookingData?.userName?.charAt(0) || "S"}
                </Text>
              </View>
              <View>
                <Text style={styles.passName}>
                  {bookingData?.userName || "Sarah"}
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <Ionicons name="star" size={12} color="#facc15" />
                  <Text style={styles.passRating}>
                    {" "}
                    {bookingData?.rating || "4.9"}
                  </Text>
                </View>
              </View>
              <View style={styles.fareBadge}>
                <Text style={styles.fareText}>
                  {bookingData?.fare || "₹245"}
                </Text>
              </View>
            </View>
            <View style={styles.routeBox}>
              <View style={styles.routeDots}>
                <View style={[styles.rDot, { backgroundColor: "#34d399" }]} />
                <View style={styles.rLine} />
                <View style={[styles.rDot, { backgroundColor: "#ef4444" }]} />
              </View>
              <View style={styles.routeDetails}>
                <View>
                  <Text style={styles.rLabel}>PICKUP</Text>
                  <Text style={styles.rText}>{bookingData?.pickup}</Text>
                </View>
                <View style={{ marginTop: 15 }}>
                  <Text style={styles.rLabel}>DROP</Text>
                  <Text style={styles.rText}>{bookingData?.dropoff}</Text>
                </View>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.declineBtn} onPress={declineRide}>
                <Ionicons name="close" size={24} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={acceptRide}
                disabled={isLoading}
                style={styles.acceptWrapper}
              >
                <LinearGradient
                  colors={["#34d399", "#059669"]}
                  style={styles.acceptBtn}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.acceptText}>Accept Ride</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ===== VIEW IMAGE MODAL ===== */}
      <Modal visible={isViewModalVisible} transparent animationType="fade">
        <View style={styles.imgModalOverlay}>
          <TouchableOpacity
            style={styles.imgCloseBtn}
            onPress={() => setIsViewModalVisible(false)}
          >
            <Ionicons name="close-circle" size={32} color="#fff" />
          </TouchableOpacity>
          {profileImage && (
            <Image source={{ uri: profileImage }} style={styles.fullImg} />
          )}
        </View>
      </Modal>

      {/* ===== CONFIRM IMAGE MODAL ===== */}
      <Modal visible={isConfirmModalVisible} transparent animationType="slide">
        <View style={styles.imgModalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {profileImage
                ? "Update Profile Picture?"
                : "Set as Profile Picture?"}
            </Text>
            {pendingImage && (
              <Image source={{ uri: pendingImage }} style={styles.previewImg} />
            )}
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsConfirmModalVisible(false);
                  setPendingImage(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={confirmProfilePic}
              >
                <Text style={styles.saveText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================================================
// STYLES
// =========================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  map: { ...StyleSheet.absoluteFillObject },
  edgeGlowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  edgeGlowBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  notifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34d399",
  },
  toggleWrapper: { position: "relative", borderRadius: 30, overflow: "hidden" },
  toggleGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 34,
    backgroundColor: "#34d399",
    opacity: 0,
    zIndex: -1,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  toggleDot: { width: 10, height: 10, borderRadius: 5 },
  toggleText: { fontSize: 13, fontWeight: "700", letterSpacing: 1.5 },
  markerOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#34d399",
    justifyContent: "center",
    alignItems: "center",
  },
  driverMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  pickupMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(52,211,153,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34d399",
  },
  dropMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(239,68,68,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  closeRideBtn: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  rideCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  pillText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  destLabel: {
    fontSize: 11,
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 4,
  },
  destText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 20,
  },
  subText: { fontSize: 14, color: "#94a3b8", marginBottom: 16 },
  rideBtnRow: { flexDirection: "row", gap: 12 },
  rideBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  rideBtnText: { fontSize: 14, fontWeight: "600" },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    width: 56,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "#334155",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  offlineWrapper: { flex: 1, backgroundColor: "#000" },
  offlineContainer: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bottomSheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.05)",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#334155",
    alignSelf: "center",
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 30,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  welcomeText: { fontSize: 13, color: "#64748b" },
  driverNameText: { fontSize: 20, fontWeight: "700", color: "#fff" },
  earningsCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  earnLabel: { fontSize: 13, color: "#64748b", letterSpacing: 0.5 },
  earnAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
    marginBottom: 16,
  },
  earnFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 14,
  },
  earnStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    gap: 6,
  },
  earnStatText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 8 },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  actionItem: { alignItems: "center", gap: 8 },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  rideModal: {
    width: "90%",
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  timerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  timerNum: { fontSize: 24, fontWeight: "800" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  passAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  passChar: { fontSize: 18, fontWeight: "700", color: "#fff" },
  passName: { fontSize: 16, fontWeight: "600", color: "#fff" },
  passRating: { fontSize: 12, color: "#94a3b8" },
  fareBadge: {
    marginLeft: "auto",
    backgroundColor: "rgba(52,211,153,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fareText: { fontSize: 15, fontWeight: "700", color: "#34d399" },
  routeBox: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
  },
  routeDots: { width: 16, alignItems: "center", marginRight: 14 },
  rDot: { width: 10, height: 10, borderRadius: 5 },
  rLine: {
    width: 2,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  routeDetails: { flex: 1 },
  rLabel: { fontSize: 10, color: "#64748b", letterSpacing: 1, marginBottom: 2 },
  rText: { fontSize: 14, color: "#e2e8f0", fontWeight: "500" },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  declineBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptWrapper: {
    flex: 1,
    marginLeft: 16,
    borderRadius: 28,
    overflow: "hidden",
  },
  acceptBtn: { paddingVertical: 16, alignItems: "center" },
  acceptText: { color: "#000", fontSize: 16, fontWeight: "700" },
  imgModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imgCloseBtn: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  fullImg: { width: "80%", aspectRatio: 1, borderRadius: 24 },
  confirmCard: {
    width: "85%",
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  previewImg: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 24,
  },
  confirmBtns: { flexDirection: "row", width: "100%", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  cancelText: { color: "#94a3b8", fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#34d399",
    alignItems: "center",
  },
  saveText: { color: "#000", fontSize: 15, fontWeight: "700" },
});
