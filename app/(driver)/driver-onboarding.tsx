import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

export default function DriverOnboarding() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [license, setLicense] = useState("");

  // --- NEW: Auto-formatting logic for DD/MM/YYYY ---
  const formatDOB = (text: string) => {
    // Remove any non-numeric characters
    let cleaned = text.replace(/\D/g, "");

    // Limit to 8 digits (DDMMYYYY)
    if (cleaned.length > 8) return;

    // Format with slashes
    let formatted = cleaned;
    if (cleaned.length > 4) {
      // Add slash after year part (DD/MM/YYYY)
      formatted =
        cleaned.substring(0, 2) +
        "/" +
        cleaned.substring(2, 4) +
        "/" +
        cleaned.substring(4);
    } else if (cleaned.length > 2) {
      // Add slash after month part (DD/MM)
      formatted = cleaned.substring(0, 2) + "/" + cleaned.substring(2);
    }

    setDob(formatted);
  };

  // Helper function to calculate age
  const calculateAge = (dateString: string) => {
    const parts = dateString.split("/");
    if (parts.length !== 3) return 0;

    // Note: months are 0-indexed in JS
    const birthDate = new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = () => {
    if (!name || !dob || !license) {
      Toast.show({
        type: "error",
        text1: "Missing Info",
        text2: "Please fill all fields to continue.",
        position: "top",
        topOffset: 100,
      });

      return;
    }

    const age = calculateAge(dob);

    // Check valid date format
    if (isNaN(age)) {
       Toast.show({
        type: "error",
        text1: "Invalid Date",
        text2: "Please enter a valid date (DD/MM/YYYY).",
        position: "top",
        topOffset: 100,
      });


      return;
    }

    if (age < 18) {
   
        Toast.show({
        type: "error",
        text1: "Not Eligible",
        text2: `You are ${age} years old. Drivers must be at least 18.` ,
        position: "top",
        topOffset: 100,
      });

      return;
    }

    router.push("/(driver)/driver-face");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cute Floating Background Elements */}
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={4000}
        style={[
          styles.bgCircle,
          {
            top: -50,
            left: -50,
            width: 200,
            height: 200,
            backgroundColor: "#E3F2FD",
          },
        ]}
      />
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={5000}
        delay={1000}
        style={[
          styles.bgCircle,
          {
            bottom: 100,
            right: -80,
            width: 250,
            height: 250,
            backgroundColor: "#aed5f6",
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header Section */}
        <Animatable.View animation="fadeInDown" style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#1E88E5" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Driver Verification</Text>
            <Text style={styles.headerSubtitle}>
              Step 1 of 3 - Personal Details
            </Text>
          </View>
        </Animatable.View>

        {/* Main Card */}
        <Animatable.View
          animation="slideInUp"
          duration={800}
          style={styles.card}
        >
          <View style={styles.iconHeader}>
            <Ionicons name="document-text-outline" size={28} color="#1E88E5" />
            <Text style={styles.cardTitle}> Basic Information</Text>
          </View>

          <Text style={styles.cardSubtitle}>
            Please ensure your name matches your ID proof.
          </Text>

          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={22}
              color="#1E88E5"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Full Name"
              placeholderTextColor="#B0BEC5"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Date of Birth Input - UPDATED */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#1E88E5"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Date of Birth (DD/MM/YYYY)"
              placeholderTextColor="#B0BEC5"
              keyboardType="numeric"
              maxLength={10} // 8 digits + 2 slashes
              value={dob}
              onChangeText={formatDOB} // Hooked up to auto-format function
            />
          </View>

          {/* License Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="card-outline"
              size={22}
              color="#1E88E5"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Driving License Number"
              placeholderTextColor="#B0BEC5"
              autoCapitalize="characters"
              value={license}
              onChangeText={setLicense}
            />
          </View>

          {/* Info Note */}
          <View style={styles.noteContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#90A4AE"
            />
            <Text style={styles.noteText}>
              Your data is securely encrypted and used only for verification.
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity onPress={handleNext} style={styles.loginBtn}>
            <LinearGradient
              colors={["#42A5F5", "#1E88E5"]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.loginBtnText}>CONTINUE</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#fff"
                style={{ marginLeft: 10 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bgCircle: {
    position: "absolute",
    borderRadius: 200,
    opacity: 0.6,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#90A4AE",
    marginTop: 2,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  iconHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#90A4AE",
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F9FF",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 58,
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: "#E3F2FD",
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 5,
  },
  noteText: {
    fontSize: 12,
    color: "#90A4AE",
    marginLeft: 5,
    flex: 1,
  },
  loginBtn: {
    marginTop: 10,
    borderRadius: 15,
    overflow: "hidden",
  },
  btnGradient: {
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  loginBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
});
