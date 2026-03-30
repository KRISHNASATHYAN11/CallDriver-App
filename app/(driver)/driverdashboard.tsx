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
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";

const { width, height } = Dimensions.get("window");
const SOCKET_URL = "http://localhost:5000";

// --- CONFIGURATION FOR NOTIFICATIONS ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // ✅ NEW
    shouldShowList: true,     // ✅ NEW (for notification tray)
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
  // const soundObject = useRef(new Audio.Sound());
  const soundObject = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef<number>(30);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const notificationListener = useRef<Notifications.Subscription | null>(null);
const responseListener = useRef<Notifications.Subscription | null>(null);

  const DRIVER_ID = "driver_123";

  // --- 1. PUSH NOTIFICATION SETUP ---
 useEffect(() => {
  // Get push token
  registerForPushNotificationsAsync().then((token) => {
    setExpoPushToken(token || "");
    console.log("Push Token:", token);
  });

  // LISTENER 1: Foreground notification
  notificationListener.current =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification Received:", notification);
    });

  // LISTENER 2: When user taps notification
  responseListener.current =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification Tapped:", response);

      const data = response.notification.request.content.data;

      if (data && data.bookingData) {
        handleIncomingRide(data.bookingData);
      } else {
        router.push("/(driver)/notifications");
      }
    });

  // ✅ CLEANUP (UPDATED - NO ERROR)
  return () => {
    notificationListener.current?.remove();
    responseListener.current?.remove();
  };
}, []);

  // --- 2. SOCKET SETUP (Still useful for foreground updates) ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      console.log("Connected to Socket Server");
      socketRef.current?.emit("join-driver", DRIVER_ID);
    });

    socketRef.current.on("new-booking", (data) => {
      console.log("New Ride via Socket:", data);
      // If app is open, handle directly
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
      { shouldPlay: true, isLooping: true }
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

  // --- 4. PROFILE IMAGE LOGIC ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPendingImage(result.assets[0].uri);
      setIsConfirmModalVisible(true);
    }
  };

  const confirmImage = () => {
    setProfileImage(pendingImage);
    setIsConfirmModalVisible(false);
    setPendingImage(null);
  };

  const cancelImage = () => {
    setIsConfirmModalVisible(false);
    setPendingImage(null);
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

      if (socketRef.current) {
        socketRef.current.emit("update-location", {
          driverId: DRIVER_ID,
          bookingId: bookingData?.id || "unknown",
          location: { latitude, longitude },
        });
      }

      Alert.alert(
        "Ride Accepted!",
        "You can now navigate to the pickup point.",
      );
      setHasRequest(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to get location.");
    } finally {
      setIsLoading(false);
    }
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

  // --- SIMULATE PUSH NOTIFICATION (TEST FUNCTION) ---
  const simulateRide = async () => {
    const fakeData = {
      id: "sim_123",
      userName: "Sarah Mathew",
      pickup: "456 Kowdiar Ave",
      dropoff: "123 Main Street Mall",
      fare: "15.40",
      rating: "4.9",
      distance: "2 min away",
    };

    // Send a LOCAL PUSH NOTIFICATION
    // This simulates what your backend would send via FCM/APNs
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚕 New Ride Request!",
        body: `${fakeData.userName} wants to go to ${fakeData.dropoff}`,
        data: { bookingData: fakeData }, // Pass data to handle on tap
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Immediately
    });

    // Also handle it locally for the in-app modal if app is open
    // handleIncomingRide(fakeData); // Comment this out to test pure background notification
  };

  return (
    <SafeAreaView style={styles.container}>
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
                  <Ionicons name="person" size={30} color="#1E88E5" />
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
                <Ionicons name="wallet-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellButton}
                onPress={() => router.push("/(driver)/notifications")}
              >
                <Ionicons name="notifications-outline" size={24} color="#333" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
        </Animatable.View>

        {/* EARNINGS CARD */}
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
              colors={["#1565C0", "#42A5F5"]}
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

        {/* STATUS TOGGLE CARD */}
        <Animatable.View
          animation="zoomIn"
          delay={300}
          style={styles.statusCard}
        >
          <LinearGradient
            colors={isOnline ? ["#E3F2FD", "#BBDEFB"] : ["#FFEBEE", "#FFCDD2"]}
            style={styles.statusGradient}
          >
            <View style={styles.statusRow}>
              <View>
                <Text
                  style={[
                    styles.statusText,
                    { color: isOnline ? "#1565C0" : "#C62828" },
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
                trackColor={{ false: "#ef9a9a", true: "#90CAF9" }}
                thumbColor={isOnline ? "#1E88E5" : "#f4f3f4"}
                onValueChange={toggleSwitch}
                value={isOnline}
                style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
              />
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* QUICK STATS */}
        <View style={styles.statsContainer}>
          <Animatable.View
            animation="fadeInLeft"
            delay={600}
            style={styles.statCard}
          >
            <Ionicons name="star-half" size={28} color="#1E88E5" />
            <Text style={styles.statNumber}>4.85</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </Animatable.View>

          <Animatable.View
            animation="fadeInRight"
            delay={600}
            style={styles.statCard}
          >
            <Ionicons name="map-outline" size={28} color="#1E88E5" />
            <Text style={styles.statNumber}>2,450</Text>
            <Text style={styles.statLabel}>Km Driven</Text>
          </Animatable.View>
        </View>

        {/* TEST BUTTON */}
        <TouchableOpacity style={styles.testBtn} onPress={simulateRide}>
          <Text style={styles.testBtnText}>Simulate System Notification</Text>
        </TouchableOpacity>
      </ScrollView>

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
                    {bookingData?.dropoff || "123 Main Street Mall"}
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
                  colors={["#28a745", "#5cb85c"]}
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

      {/* OTHER MODALS (Confirm & View Image) - Keep your existing modal code here */}
      {/* ... */}
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

    // ✅ NEW WAY (important for production)
    token = (await Notifications.getExpoPushTokenAsync()).data;

  } else {
    alert("Use real device");
  }

  // ✅ MUST USE await here
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
  // ... (Keep your existing styles)
  container: { flex: 1, backgroundColor: "#FFFFFF" },
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
  greeting: { fontSize: 14, color: "#90A4AE" },
  driverName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  bellButton: { position: "relative", padding: 5, marginLeft: 10 },
  notificationDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF5722",
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
    backgroundColor: "#1E88E5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  testBtnText: { color: "#fff", fontWeight: "bold" },
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
