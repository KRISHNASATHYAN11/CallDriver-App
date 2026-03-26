import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();

  // State
  const [userType, setUserType] = useState<"user" | "driver">("user");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const otpInputs = useRef<(TextInput | null)[]>([]);

  // --- Logic Functions ---

  const handleUserTypeChange = (type: "user" | "driver") => {
    if (type === "driver") {
      Alert.alert("Driver Mode", "Please enter your Driver ID to continue.");
    }
    setUserType(type);
    setStage("phone");
    setOtp(["", "", "", ""]);
  };

  const handleContinue = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert("Oops!", "Please enter a valid 10-digit phone number.");
      return;
    }

    if (userType === "driver" && stage === "phone") {
      if (driverId.length < 4) {
        Alert.alert("Validation Error", "Please enter a valid Driver ID.");
        return;
      }
    }

    setLoading(true);

    if (stage === "phone") {
      setTimeout(() => {
        setLoading(false);
        Alert.alert("Success", `OTP sent to +91${phoneNumber}`);
        setStage("otp");
      }, 1500);
    } else {
      const otpCode = otp.join("");
      if (otpCode.length < 4) {
        setLoading(false);
        Alert.alert("Error", "Please enter the complete OTP.");
        return;
      }

      setTimeout(() => {
        setLoading(false);
        if (userType === "user") {
          Alert.alert("Welcome!", "Navigating to User Dashboard...");
          // router.replace('/(user)/dashboard');
        } else {
          Alert.alert("Welcome Driver!", "Navigating to Driver Dashboard...");
          router.replace("/driver-onboarding");
        }
      }, 1500);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 3) otpInputs.current[index + 1]?.focus();
    if (!text && index > 0) otpInputs.current[index - 1]?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

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
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={6000}
        delay={500}
        style={[
          styles.bgCircle,
          {
            top: 200,
            right: 20,
            width: 100,
            height: 100,
            backgroundColor: "#E1F5FE",
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Logo Section */}
        <Animatable.View
          animation="bounceInDown"
          delay={200}
          style={styles.logoContainer}
        >
          {/* FIX: Moved resizeMode to prop, removed from style */}
          <Image
            source={require("../../assets/images/CDlogo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Animatable.Text
            animation="fadeIn"
            delay={800}
            style={styles.appName}
          >
            CallDriver
          </Animatable.Text>
          <Animatable.Text
            animation="fadeIn"
            delay={1000}
            style={styles.tagline}
          >
            Your Ride, Your Way
          </Animatable.Text>
        </Animatable.View>

        {/* Role Switcher */}
        <Animatable.View
          animation="bounceIn"
          delay={600}
          style={styles.roleContainer}
        >
          <View style={styles.roleRow}>
            {/* User Button */}
            <TouchableOpacity
              onPress={() => handleUserTypeChange("user")}
              style={styles.roleTouch}
              activeOpacity={0.7}
            >
              <Animatable.View
                style={[
                  styles.roleBtn,
                  userType === "user" && styles.roleBtnActive,
                ]}
                animation={userType === "user" ? "pulse" : undefined}
                iterationCount={userType === "user" ? "infinite" : 1}
              >
                <Ionicons
                  name="person-circle"
                  size={26}
                  color={userType === "user" ? "#fff" : "#1E88E5"}
                />
                <Text
                  style={[
                    styles.roleText,
                    userType === "user" && styles.roleTextActive,
                  ]}
                >
                  User
                </Text>
              </Animatable.View>
            </TouchableOpacity>

            {/* Driver Button */}
            <TouchableOpacity
              onPress={() => handleUserTypeChange("driver")}
              style={styles.roleTouch}
              activeOpacity={0.7}
            >
              <Animatable.View
                style={[
                  styles.roleBtn,
                  userType === "driver" && styles.roleBtnActive,
                ]}
                animation={userType === "driver" ? "pulse" : undefined}
                iterationCount={userType === "driver" ? "infinite" : 1}
              >
                <Ionicons
                  name="car-sport"
                  size={26}
                  color={userType === "driver" ? "#fff" : "#1E88E5"}
                />
                <Text
                  style={[
                    styles.roleText,
                    userType === "driver" && styles.roleTextActive,
                  ]}
                >
                  Driver
                </Text>
              </Animatable.View>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Main Card */}
        <Animatable.View
          animation="slideInUp"
          duration={800}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="enter-outline" size={24} color="#1E88E5" />
            <Text style={styles.cardTitle}>
              {stage === "phone" ? "  Login / Register" : "  Verify OTP"}
            </Text>
          </View>

          <Text style={styles.cardSubtitle}>
            {stage === "phone"
              ? "Enter your details to continue"
              : `Enter code sent to +91${phoneNumber}`}
          </Text>

          {stage === "phone" ? (
            <>
              {/* Phone Input */}
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={22}
                  color="#1E88E5"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone Number"
                  placeholderTextColor="#B0BEC5"
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={setPhoneNumber}
                  value={phoneNumber}
                />
              </View>

              {/* DRIVER VALIDATION INPUT */}
              {userType === "driver" && (
                <Animatable.View animation="fadeInDown" duration={300}>
                  <View
                    style={[styles.inputWrapper, { borderColor: "#1E88E5" }]}
                  >
                    <Ionicons
                      name="id-card-outline"
                      size={22}
                      color="#1E88E5"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter Driver ID / License"
                      placeholderTextColor="#B0BEC5"
                      onChangeText={setDriverId}
                      value={driverId}
                    />
                  </View>
                  <Text style={styles.driverNote}>
                    * Verification required for Drivers
                  </Text>
                </Animatable.View>
              )}
            </>
          ) : (
            /* OTP Input */
            <View style={styles.otpContainer}>
              {[0, 1, 2, 3].map((_, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    otpInputs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  value={otp[index]}
                  selectionColor="#1E88E5"
                  onKeyPress={(e) =>
                    e.nativeEvent.key === "Backspace" &&
                    handleOtpChange("", index)
                  }
                />
              ))}
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading}
            style={styles.loginBtn}
          >
            <LinearGradient
              colors={["#42A5F5", "#1E88E5"]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>
                    {stage === "phone" ? "CONTINUE" : "VERIFY"}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 10 }}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {stage === "otp" && (
            <TouchableOpacity
              onPress={() => setStage("phone")}
              style={styles.backLink}
            >
              <Ionicons name="arrow-back" size={14} color="#1E88E5" />
              <Text style={styles.backText}> Change Number</Text>
            </TouchableOpacity>
          )}
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

  // Background Decorations
  bgCircle: {
    position: "absolute",
    borderRadius: 200,
    opacity: 0.6,
  },

  // Logo Section
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  logoImage: {
    width: 130,
    height: 130,
    // REMOVED: resizeMode from style
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1565C0",
    letterSpacing: 1,
  },
  tagline: {
    color: "#90CAF9",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
    letterSpacing: 1,
  },

  // Role Switcher
  roleContainer: {
    marginBottom: 15,
    paddingHorizontal: 30,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 40,
    padding: 5,
  },
  roleTouch: {
    flex: 1,
  },
  roleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
  },
  roleBtnActive: {
    backgroundColor: "#1E88E5",
    // FIX: Replaced shadow* props with boxShadow string
    boxShadow: "0px 4px 8px rgba(30, 136, 229, 0.3)",
    elevation: 5, // Keep elevation for Android
  },
  roleText: {
    marginLeft: 8,
    color: "#1E88E5",
    fontWeight: "bold",
    fontSize: 15,
  },
  roleTextActive: {
    color: "#fff",
  },

  // Card Styles
  card: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    // FIX: Replaced shadow* props with boxShadow string
    boxShadow: "0px -5px 15px rgba(0, 0, 0, 0.05)",
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  cardHeader: {
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

  // Inputs
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
  driverNote: {
    color: "#1E88E5",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
    fontWeight: "600",
  },

  // OTP
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  otpInput: {
    width: 60,
    height: 65,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#E3F2FD",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#1565C0",
    backgroundColor: "#F5F9FF",
  },

  // Button
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
  backLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    alignItems: "center",
  },
  backText: {
    color: "#1E88E5",
    fontSize: 14,
    fontWeight: "600",
  },
});
