import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";

const { width, height } = Dimensions.get("window");
const SOCKET_URL = "http://localhost:5000";

// --- DARK THEME MAP STYLE (JSON) ---
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#313131" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1f1f1f" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

// --- CONFIGURATION FOR NOTIFICATIONS ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function DriverDashboard() {
  // --- STATE MANAGEMENT ---
  const [isOnline, setIsOnline] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // --- NEW STATE FOR MAP & TRACKING ---
  const [isRideActive, setIsRideActive] = useState(false);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  // --- NEW: RIDE FLOW STATE ---
  // 'en_route' -> 'arrived' -> 'ongoing'
  const [rideStatus, setRideStatus] = useState<
    "en_route" | "arrived" | "ongoing"
  >("en_route");
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const otpInputs = useRef<(TextInput | null)[]>([]);

  // --- IMAGE MODAL STATES ---
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  // --- RIDE REQUEST STATES ---
  const [hasRequest, setHasRequest] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Push Token State
  const [expoPushToken, setExpoPushToken] = useState<string>("");

  // --- REFS ---
  const socketRef = useRef<Socket | null>(null);
  const soundObject = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef<number>(30);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const DRIVER_ID = "driver_123";

  // --- 1. PUSH NOTIFICATION SETUP ---
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token || "");
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {});
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data && data.bookingData) {
          handleIncomingRide(data.bookingData);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // --- 2. SOCKET SETUP ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join-driver", DRIVER_ID);
    });

    socketRef.current.on("new-booking", (data) => {
      handleIncomingRide(data);
    });

    return () => {
      socketRef.current?.disconnect();
      stopAlerts();
    };
  }, []);

  // --- 3. ALERT LOGIC ---
  const handleIncomingRide = (data: any) => {
    setBookingData(data);
    setHasRequest(true);
    timeLeftRef.current = 30;
    setTimeLeft(30);

    Vibration.vibrate([0, 500, 1000, 500], true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    playNotificationSound();
    startTimer();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/notification.mp3"),
        { shouldPlay: true, isLooping: true },
      );
      soundObject.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.log("Sound failed");
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      if (timeLeftRef.current <= 0) {
        declineRide();
      } else {
        setTimeLeft(timeLeftRef.current);
      }
    }, 1000);
  };

  const stopAlerts = async () => {
    Vibration.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      if (soundObject.current) {
        await soundObject.current.stopAsync();
        await soundObject.current.unloadAsync();
        soundObject.current = null;
      }
    } catch (e) {}
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required to access gallery");
      return false;
    }
    return true;
  };

  // --- 4. PROFILE IMAGE LOGIC ---
  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      console.log(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    if (profileImage) {
      setIsViewModalVisible(true);
    } else {
      pickImage();
    }
  };

  const toggleSwitch = () => setIsOnline((previousState) => !previousState);

  // --- 5. ACCEPT RIDE ---
  const acceptRide = async () => {
    stopAlerts();
    setIsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location is required.");
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setDriverLocation({ latitude, longitude });
      setHasRequest(false);
      setIsRideActive(true);
      setRideStatus("en_route"); // Reset status
      setOtp(["", "", "", ""]); // Clear old OTP

      startLiveTracking();

      if (socketRef.current) {
        socketRef.current.emit("update-location", {
          driverId: DRIVER_ID,
          bookingId: bookingData?.id || "unknown",
          location: { latitude, longitude },
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to get location.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LIVE TRACKING FUNCTION ---
  const startLiveTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 10,
      },
      (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        setDriverLocation({ latitude, longitude });

        if (socketRef.current) {
          socketRef.current.emit("update-location", {
            driverId: DRIVER_ID,
            bookingId: bookingData?.id,
            location: { latitude, longitude },
          });
        }
      },
    );
  };

  // --- NEW: OTP LOGIC ---
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-verify when full
    if (newOtp.join("").length === 4) {
      Keyboard.dismiss();
    }
  };

  const verifyOtpAndStartRide = () => {
    const enteredOtp = otp.join("");
    const actualOtp = bookingData?.otp || "1234"; // Fallback for simulation

    if (enteredOtp === actualOtp) {
      Alert.alert("Success", "Ride Started!");
      setRideStatus("ongoing");
      // Here you would typically emit to socket that ride started
    } else {
      Alert.alert(
        "Error",
        "Incorrect PIN. Please ask the user for the correct PIN.",
      );
      Vibration.vibrate(100);
      setOtp(["", "", "", ""]);
      otpInputs.current[0]?.focus();
    }
  };

  const handleArrived = () => {
    setRideStatus("arrived");
    Alert.alert(
      "Arrived",
      "You have arrived. Please ask the user for their PIN.",
    );
  };

  const endRide = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    setIsRideActive(false);
    setBookingData(null);
    setDriverLocation(null);
    setRideStatus("en_route");
  };

  // --- 6. DECLINE RIDE ---
  const declineRide = () => {
    stopAlerts();
    setHasRequest(false);
    setBookingData(null);
    fadeAnim.setValue(0);
    if (socketRef.current) {
      socketRef.current.emit("decline-ride", {
        driverId: DRIVER_ID,
        bookingId: bookingData?.id,
      });
    }
  };

  // --- SIMULATE PUSH NOTIFICATION (WITH OTP) ---
  const simulateRide = async () => {
    const fakeData = {
      id: "sim_123",
      userName: "Sarah Mathew",
      pickup: "456 Kowdiar Ave",
      dropoff: "Technopark Campus",
      fare: "15.40",
      rating: "4.9",
      distance: "2 min away",
      otp: "1234", // <--- ADDED OTP for simulation
      pickupCoords: { latitude: 8.5241, longitude: 76.9366 },
      dropCoords: { latitude: 8.5108, longitude: 76.965 },
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚕 New Ride Request!",
        body: `${fakeData.userName} wants to go to ${fakeData.dropoff}`,
        data: { bookingData: fakeData },
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  };

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      {/* CASE 1: ACTIVE RIDE MAP VIEW */}
      {isRideActive && driverLocation ? (
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            customMapStyle={darkMapStyle}
            initialRegion={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={driverLocation} title="You" identifier="driver">
              <Ionicons name="car-sport" size={28} color="#fff" />
            </Marker>

            {bookingData?.pickupCoords && (
              <Marker
                coordinate={bookingData.pickupCoords}
                title="Pickup"
                identifier="pickup"
                pinColor="#00ff00"
              />
            )}
          </MapView>

          {/* Overlay UI on Map */}
          <View style={styles.mapOverlay}>
            <TouchableOpacity style={styles.backButtonMap} onPress={endRide}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.rideInfoCard}>
              {/* STATUS: EN ROUTE */}
              {rideStatus === "en_route" && (
                <>
                  <Text style={styles.rideInfoText}>Navigating to Pickup</Text>
                  <Text style={styles.rideInfoSub}>
                    {bookingData?.pickup || "Location"}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.navigateBtn,
                        { flex: 1, marginRight: 10, backgroundColor: "#333" },
                      ]}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                      <Text style={styles.navigateBtnText}> Navigate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.navigateBtn,
                        { flex: 1, backgroundColor: "#4CAF50" },
                      ]}
                      onPress={handleArrived}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.navigateBtnText}> Arrived</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* STATUS: ARRIVED (OTP ENTRY) */}
              {rideStatus === "arrived" && (
                <>
                  <Text style={styles.rideInfoText}>Verify Passenger PIN</Text>
                  <Text style={styles.rideInfoSub}>
                    Ask the user for their 4-digit PIN
                  </Text>

                  <View style={styles.otpContainer}>
                    {[0, 1, 2, 3].map((_, index) => (
                      <TextInput
                        key={index}
                        ref={(ref: TextInput | null) => {
                          otpInputs.current[index] = ref;
                        }}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        value={otp[index]}
                        selectionColor="#000"
                        placeholder="-"
                        placeholderTextColor="#888"
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.navigateBtn,
                      { backgroundColor: "#000", marginTop: 15 },
                    ]}
                    onPress={verifyOtpAndStartRide}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={[styles.navigateBtnText, { color: "#fff" }]}>
                      {" "}
                      Start Ride
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STATUS: ONGOING */}
              {rideStatus === "ongoing" && (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4CAF50"
                    />
                    <Text
                      style={[
                        styles.rideInfoText,
                        { marginLeft: 10, color: "#4CAF50" },
                      ]}
                    >
                      Ride Started
                    </Text>
                  </View>
                  <Text style={styles.rideInfoSub}>
                    Driving to: {bookingData?.dropoff || "Destination"}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.navigateBtn,
                      { backgroundColor: "#D32F2F", marginTop: 15 },
                    ]}
                    onPress={endRide}
                  >
                    <Ionicons name="flag" size={20} color="#fff" />
                    <Text style={styles.navigateBtnText}> End Ride</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      ) : (
        // CASE 2: DEFAULT DASHBOARD VIEW
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Animatable.View animation="fadeInDown" style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                style={styles.profileContainer}
              >
                <View style={styles.profileImage}>
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <Ionicons name="person" size={30} color="#000" />
                  )}
                </View>
                <View>
                  <Text style={styles.greeting}>Good Morning</Text>
                  <Text style={styles.driverName}>Anand</Text>
                </View>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={styles.bellButton}
                  onPress={() => router.push("/(driver)/wallet")}
                >
                  <Ionicons name="wallet-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bellButton}
                  onPress={() => router.push("/(driver)/notifications")}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color="#fff"
                  />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
              </View>
            </View>
          </Animatable.View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(driver)/wallet")}
          >
            <Animatable.View
              animation="slideInUp"
              delay={400}
              style={styles.earningsWrapper}
            >
              <LinearGradient
                colors={["#000", "#aaa"]}
                style={styles.earningsCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
                <Text style={styles.earningsAmount}>$ 245.50</Text>
                <View style={styles.earningsFooter}>
                  <View style={styles.earningsStat}>
                    <Ionicons name="car-sport" size={16} color="#fff" />
                    <Text style={styles.earningsStatText}> 8 Rides</Text>
                  </View>
                  <View style={styles.earningsStat}>
                    <Ionicons name="time" size={16} color="#fff" />
                    <Text style={styles.earningsStatText}> 6.5 Hrs</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animatable.View>
          </TouchableOpacity>

          <Animatable.View
            animation="zoomIn"
            delay={300}
            style={styles.statusCard}
          >
            <LinearGradient
              colors={isOnline ? ["#fff", "#fff"] : ["#FFEBEE", "#FFCDD2"]}
              style={[styles.statusGradient]}
            >
              <View style={styles.statusRow}>
                <View>
                  <Text
                    style={[
                      styles.statusText,
                      { color: isOnline ? "#000" : "#C62828" },
                    ]}
                  >
                    {isOnline ? "You are Online" : "You are Offline"}
                  </Text>
                  <Text style={styles.statusSubtext}>
                    {isOnline
                      ? "Waiting for ride requests..."
                      : "Go online to accept rides"}
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: "#aaa", true: "#aaa" }}
                  thumbColor={isOnline ? "#000" : "#f4f3f4"}
                  onValueChange={toggleSwitch}
                  value={isOnline}
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </LinearGradient>
          </Animatable.View>

          <View style={styles.statsContainer}>
            <Animatable.View
              animation="fadeInLeft"
              delay={600}
              style={styles.statCard}
            >
              <Ionicons name="star-half" size={28} color="#111" />
              <Text style={styles.statNumber}>4.85</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Animatable.View>

            <Animatable.View
              animation="fadeInRight"
              delay={600}
              style={styles.statCard}
            >
              <Ionicons name="map-outline" size={28} color="#111" />
              <Text style={styles.statNumber}>2,450</Text>
              <Text style={styles.statLabel}>Km Driven</Text>
            </Animatable.View>
          </View>

          <TouchableOpacity style={styles.testBtn} onPress={simulateRide}>
            <Text style={styles.testBtnText}>Simulate System Notification</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ----------------- INCOMING RIDE MODAL ----------------- */}
      <Modal
        animationType="none"
        transparent={true}
        visible={hasRequest}
        onRequestClose={declineRide}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.popupCard,
              { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
            ]}
          >
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>

            <Text style={styles.rideTitle}>New Ride Request!</Text>

            <View style={styles.passengerRow}>
              <View style={styles.passengerAvatar}>
                <Text style={styles.avatarText}>
                  {bookingData?.userName?.charAt(0) || "S"}
                </Text>
              </View>
              <View>
                <Text style={styles.passengerName}>
                  {bookingData?.userName || "Sarah Johnson"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {" "}
                    {bookingData?.rating || "4.9"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoints}>
                <View
                  style={[styles.routeDot, { backgroundColor: "#4CAF50" }]}
                />
                <View style={styles.routeLine} />
                <View
                  style={[styles.routeDot, { backgroundColor: "#F44336" }]}
                />
              </View>
              <View style={styles.routeTexts}>
                <View style={styles.locationBox}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.locationText}>
                    {bookingData?.pickup || "456 Kowdiar Ave"}
                  </Text>
                </View>
                <View style={[styles.locationBox, { marginTop: 15 }]}>
                  <Text style={styles.locationLabel}>DROP OFF</Text>
                  <Text style={styles.locationText}>
                    {bookingData?.dropoff || "Technopark"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.declineBtn} onPress={declineRide}>
                <Ionicons name="close" size={24} color="#d32f2f" />
              </TouchableOpacity>

              <TouchableOpacity onPress={acceptRide} disabled={isLoading}>
                <LinearGradient
                  colors={["#000", "#000"]}
                  style={styles.acceptBtn}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.acceptBtnText}>Accept Ride</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Permission not granted!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Use real device");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  return token;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Map Styles
  map: { width: "100%", height: "100%" },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "space-between",
    paddingTop: 50,
  },
  backButtonMap: {
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 20,
    marginTop: 10,
  },
  rideInfoCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 5,
  },
  rideInfoText: { color: "#000", fontSize: 18, fontWeight: "bold" },
  rideInfoSub: { color: "#666", marginTop: 5, marginBottom: 15 },
  navigateBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  navigateBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 5 },

  // OTP Styles
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15,
  },
  otpInput: {
    width: 50,
    height: 55,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    backgroundColor: "#f9f9f9",
    marginHorizontal: 5,
  },

  // Existing Styles
  header: { paddingHorizontal: 20, marginBottom: 10, marginTop: 10 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileContainer: { flexDirection: "row", alignItems: "center" },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarImg: { width: "100%", height: "100%" },
  greeting: { fontSize: 14, color: "#fff" },
  driverName: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  bellButton: { position: "relative", padding: 5, marginLeft: 10 },
  notificationDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22ff52",
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
  },
  statusGradient: { padding: 20 },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: { fontSize: 18, fontWeight: "bold" },
  statusSubtext: { fontSize: 13, color: "#666", marginTop: 4 },
  earningsWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  earningsCard: { borderRadius: 20, padding: 20, elevation: 8 },
  earningsLabel: { color: "#E3F2FD", fontSize: 14, letterSpacing: 1 },
  earningsAmount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 15,
  },
  earningsFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 15,
  },
  earningsStat: { flexDirection: "row", alignItems: "center", marginRight: 20 },
  earningsStatText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    justifyContent: "space-between",
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E3F2FD",
    marginBottom: 20,
  },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 5 },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  testBtn: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  testBtnText: { color: "#000", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupCard: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#1E88E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  timerText: { fontSize: 20, fontWeight: "bold", color: "#1E88E5" },
  rideTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  passengerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { fontSize: 18, fontWeight: "bold", color: "#1E88E5" },
  passengerName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  ratingText: { fontSize: 12, color: "#888" },
  routeContainer: { flexDirection: "row", marginBottom: 20, width: "100%" },
  routePoints: { width: 20, alignItems: "center", marginRight: 15 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginVertical: 5,
  },
  routeTexts: { flex: 1 },
  locationBox: { marginBottom: 5 },
  locationLabel: { fontSize: 11, color: "#aaa", marginBottom: 2 },
  locationText: { fontSize: 15, color: "#333", fontWeight: "500" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  declineBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  acceptBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
