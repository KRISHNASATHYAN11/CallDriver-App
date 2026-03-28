import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Vibration,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
// NOTE: Use your machine's local IP address (e.g., 192.168.1.5) instead of 'localhost' if testing on a real device
const SOCKET_URL = "http://localhost:5000";

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

  // --- REFS ---
  const socketRef = useRef<Socket | null>(null);
  const soundObject = useRef(new Audio.Sound());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef<number>(30);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const DRIVER_ID = "driver_123";

  // --- 1. SOCKET & NOTIFICATION SETUP ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      console.log("Connected to Socket Server");
      socketRef.current?.emit("join-driver", DRIVER_ID);
    });

    socketRef.current.on("new-booking", (data) => {
      console.log("New Ride Request:", data);
      handleIncomingRide(data);
    });

    return () => {
      socketRef.current?.disconnect();
      stopAlerts();
    };
  }, []);

  // --- 2. ALERT LOGIC (Sound, Vibration, Timer) ---

  const handleIncomingRide = (data: any) => {
    setBookingData(data);
    setHasRequest(true);

    // Reset Timer
    timeLeftRef.current = 30;
    setTimeLeft(30);

    // 1. Vibration Pattern
    Vibration.vibrate([0, 500, 1000, 500], true);

    // 2. Haptic Feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // 3. Play Sound
    playNotificationSound();

    // 4. Start Countdown
    startTimer();

    // 5. Animate Popup
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const playNotificationSound = async () => {
    try {
      // IMPORTANT: Ensure you have a file named 'notification.mp3' in your 'assets' folder.
      // If you don't have the file, comment out the next 4 lines to prevent crashes.
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/notification.mp3"),
        { shouldPlay: true, isLooping: true },
      );
      soundObject.current = sound;
      await soundObject.current.playAsync();
    } catch (error) {
      console.log("Sound file not found or failed to play, skipping sound.");
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
      }
    } catch (e) {}
  };

  // --- 3. PROFILE IMAGE LOGIC ---

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

  // --- 4. TOGGLE ONLINE STATUS ---
  const toggleSwitch = () => setIsOnline((previousState) => !previousState);

  // --- 5. ACCEPT RIDE & SHARE LOCATION ---
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
        console.log("Location sent to backend:", latitude, longitude);
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

  // --- SIMULATE FUNCTION (For Testing) ---
  const simulateRide = () => {
    const fakeData = {
      id: "sim_123",
      userName: "Sarah Mathew",
      pickup: "456 Kowdiar Ave",
      dropoff: "123 Main Street Mall",
      fare: "15.40",
      rating: "4.9",
      distance: "2 min away",
    };
    handleIncomingRide(fakeData);
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
              <TouchableOpacity style={styles.bellButton}>
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
          <Text style={styles.testBtnText}>Simulate Incoming Ride</Text>
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
            {/* Timer Circle */}
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>

            <Text style={styles.rideTitle}>New Ride Request!</Text>

            {/* Passenger Info */}
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

            {/* Route Info - UNCOMMENTED FOR BETTER UX */}
            <View style={styles.routeContainer}>
              <View style={styles.routePoints}>
                <View
                  style={[styles.routeDot, { backgroundColor: "#4CAF50" }]}
                />
              
              </View>

              <View style={styles.routeTexts}>
                <View style={styles.locationBox}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.locationText}>
                    {bookingData?.pickup || "456 Kowdiar Ave"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
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

      {/* ----------------- OTHER MODALS ----------------- */}

      {/* CONFIRMATION MODAL (Profile Picture) */}
      <Modal
        visible={isConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelImage}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.confirmModalView}>
            <Text style={styles.modalTitle}>Set Profile Picture?</Text>
            {pendingImage && (
              <Image
                source={{ uri: pendingImage }}
                style={styles.previewImage}
              />
            )}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={cancelImage}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={confirmImage}
              >
                <Text style={styles.confirmBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW IMAGE MODAL */}
      <Modal
        visible={isViewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.viewModalView}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsViewModalVisible(false)}
            >
              <Ionicons name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
            {profileImage && (
              <Image source={{ uri: profileImage }} style={styles.fullImage} />
            )}
            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={() => {
                setIsViewModalVisible(false);
                pickImage();
              }}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header
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

  // Status
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

  // Earnings
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

  // Stats
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

  // Test Button
  testBtn: {
    marginHorizontal: 20,
    backgroundColor: "#1E88E5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  testBtnText: { color: "#fff", fontWeight: "bold" },

  // --- INCOMING RIDE MODAL STYLES ---
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

  // Passenger inside Modal
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

  // Route inside Modal
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

  // Fare inside Modal
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 25,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  fareLabel: { fontSize: 16, color: "#666" },
  fareValue: { fontSize: 22, fontWeight: "bold", color: "#28a745" },

  // Buttons inside Modal
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

  // --- OTHER MODALS ---
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },

  confirmModalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20 },
  cancelBtn: { backgroundColor: "#f0f0f0" },
  cancelBtnText: { color: "#666", fontWeight: "bold" },
  confirmBtn: { backgroundColor: "#1E88E5" },
  confirmBtnText: { color: "#fff", fontWeight: "bold" },

  viewModalView: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 20,
  },
  closeBtn: { position: "absolute", top: 50, right: 20 },
  changePhotoBtn: {
    flexDirection: "row",
    backgroundColor: "#1E88E5",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginTop: 30,
    alignItems: "center",
  },
  changePhotoText: { color: "#fff", fontWeight: "bold", marginLeft: 10 },
});
