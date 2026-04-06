import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import api from "../../src/api/index";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import {
  sendDriverOtp,
  sendUserOtp,
  updateDriver,
  updateUser,
  verifyDriverOtp,
  verifyUserOtp,
} from "../../src/api/authApi";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();

  // --- State ---
  const [userType, setUserType] = useState<"user" | "driver">("user");
  const [stage, setStage] = useState<
    "phone" | "otp" | "newUser" | "existingDriver" | "newDriver"
  >("phone");

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // New User Fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState("");
  const [driverGender, setDriverGender] = useState<
    "male" | "female" | "other" | ""
  >("");

  // Driver Fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);

  const otpInputs = useRef<(TextInput | null)[]>([]);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // --- Image Picker Logic ---

  const takeLivePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Camera access is required.",
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      cameraType: ImagePicker.CameraType.front, // Selfie mode
    });

    if (!result.canceled) {
      setLivePhoto(result.assets[0].uri);
    }
  };

  const pickLicensePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLicensePhoto(result.assets[0].uri);
    }
  };

  // --- Logic Functions ---

  const handleUserTypeChange = (type: "user" | "driver") => {
    if (type === "driver") {
      setModalVisible(true);
    } else {
      setUserType(type);
      resetForms();
    }
  };

  const handleDriverConfirm = () => {
    setModalVisible(false);
    setUserType("driver");
    resetForms();
  };

  const resetForms = () => {
    setStage("phone");
    setOtp(["", "", "", "", "", ""]);
    setName("");
    setGender("");
    setLicenseNumber("");
    setLicensePhoto(null);
    setLivePhoto(null);
  };

  const handleContinue = async () => {
    if (phoneNumber.length < 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone",
        text2: "Enter 10 digits.",
      });
      return;
    }

    setLoading(true);

    // PHONE STAGE -> Send OTP

    if (stage === "phone") {
      try {
        const res =
          userType === "user"
            ? await sendUserOtp(phoneNumber)
            : await sendDriverOtp(phoneNumber);

        setLoading(false);

        if (res.message === "OTP sent successfully") {
          setIsExistingUser(res.existingUser);
          Toast.show({
            type: "success",
            text1: "OTP Sent",
            text2: `Code sent to +91${phoneNumber}`,
          });

          setStage("otp");
        } else {
          Toast.show({
            type: "error",
            text1: "Failed",
            text2: "Something went wrong",
          });
        }
      } catch (err: any) {
        setLoading(false);

        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Server error",
        });
      }
    }
    // OTP STAGE -> Verify & Redirect based on logic
    else if (stage === "otp") {
      const otpCode = otp.join("");

      if (otpCode.length !== 6) {
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Invalid OTP",
          text2: "Enter 6-digit code",
        });
        return;
      }

      try {
        const res =
          userType === "user"
            ? await verifyUserOtp(phoneNumber, otpCode)
            : await verifyDriverOtp(phoneNumber, otpCode);

        setLoading(false);

        if (res.token) {
          setUserId(res.user.id);
          await AsyncStorage.setItem("token", res.token);
          api.defaults.headers.common["Authorization"] = `Bearer ${res.token}`;
          Toast.show({
            type: "success",
            text1: "OTP Verified",
            text2: `Welcome +91${phoneNumber}`,
          });

          // ✅ USE BACKEND RESPONSE (IMPORTANT)
          if (isExistingUser) {
            // Existing → go dashboard
            if (userType === "user") {
              router.replace("/(user)/userdashboard");
            } else {
              router.replace("/(driver)/driverdashboard");
            }
          } else {
            // New user → ask details
            if (userType === "user") {
              setStage("newUser");
            } else {
              setStage("newDriver");
            }
          }
        } else {
          Toast.show({
            type: "error",
            text1: "Invalid OTP",
            text2: "Try again",
          });
        }
      } catch (err: any) {
        setLoading(false);

        Toast.show({
          type: "error",
          text1: "Error",
          text2: err?.response?.data?.message || "Verification failed",
        });
      }
    }
  };

  // FINAL SUBMISSION FOR NEW/EXISTING PROFILES
  const handleFinalSubmit = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      // ================= USER =================
      if (stage === "newUser") {
        if (!name || !gender) {
          Toast.show({
            type: "error",
            text1: "Incomplete",
            text2: "Name & Gender required.",
          });
          setLoading(false);
          return;
        }

        await updateUser(userId, name, gender);

        Toast.show({
          type: "success",
          text1: "Profile Updated",
        });

        router.replace("/(user)/userdashboard");
      }

      // ================= DRIVER =================
      else if (stage === "newDriver") {
        if (
          !name ||
          // !driverGender ||
          // !age ||
          !licenseNumber ||
          !licensePhoto ||
          !livePhoto
        ) {
          Toast.show({
            type: "error",
            text1: "Incomplete",
            text2: "Fill all driver details",
          });
          setLoading(false);
          return;
        }

        const formData = new FormData();

        formData.append("name", name);
        formData.append("gender", driverGender);
        formData.append("age", age);
        formData.append("licenseNumber", licenseNumber);

        formData.append("licenseImage", {
          uri: licensePhoto,
          name: "license.jpg",
          type: "image/jpeg",
        } as any);

        formData.append("livePhoto", {
          uri: livePhoto,
          name: "live.jpg",
          type: "image/jpeg",
        } as any);

        await updateDriver(userId, formData);

        Toast.show({
          type: "success",
          text1: "Driver Registered",
        });

        router.replace("/(driver)/driverdashboard");
      }

      setLoading(false);
    } catch (err: any) {
      setLoading(false);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.response?.data?.message || "Something went wrong",
      });
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) otpInputs.current[index + 1]?.focus();
    if (!text && index > 0) otpInputs.current[index - 1]?.focus();
  };

  // --- RENDER HELPERS ---

  const renderBackButton = () => (
    <TouchableOpacity onPress={() => setStage("phone")} style={styles.backLink}>
      <Ionicons name="arrow-back" size={20} color="#aaa" />
      <Text style={styles.backText}> Back</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Background Circles */}
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
            backgroundColor: "#111",
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
            backgroundColor: "#111",
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animatable.View
            animation="bounceInDown"
            delay={200}
            style={styles.logoContainer}
          >
            <Image
              source={require("../../assets/images/calldriverapplogo.png")}
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
              <TouchableOpacity
                onPress={() => handleUserTypeChange("user")}
                style={styles.roleTouch}
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
                    color={userType === "user" ? "#fff" : "#000"}
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

              <TouchableOpacity
                onPress={() => handleUserTypeChange("driver")}
                style={styles.roleTouch}
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
                    color={userType === "driver" ? "#fff" : "#000"}
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
            {/* STAGE: PHONE */}
            {stage === "phone" && (
              <>
                <View style={styles.cardHeader}>
                  <Ionicons name="enter-outline" size={24} color="#fff" />
                  <Text style={styles.cardTitle}> Login / Register</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Enter your phone number to continue
                </Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color="#fff"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Phone Number"
                    placeholderTextColor="#777"
                    keyboardType="phone-pad"
                    maxLength={10}
                    onChangeText={setPhoneNumber}
                    value={phoneNumber}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={loading}
                  style={styles.loginBtn}
                >
                  <LinearGradient
                    colors={["#000", "#aaa"]}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>CONTINUE</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE: OTP */}
            {stage === "otp" && (
              <>
                {renderBackButton()}
                <View style={styles.cardHeader}>
                  <Ionicons name="key-outline" size={24} color="#fff" />
                  <Text style={styles.cardTitle}> Verify OTP</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Code sent to +91{phoneNumber}
                </Text>

                <View style={styles.otpContainer}>
                  {[0, 1, 2, 3, 4, 5].map((_, index) => (
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
                      selectionColor="#fff"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={loading}
                  style={styles.loginBtn}
                >
                  <LinearGradient
                    colors={["#000", "#aaa"]}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>VERIFY</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE: NEW USER (Registration) */}
            {stage === "newUser" && (
              <>
                {renderBackButton()}
                <View style={styles.cardHeader}>
                  <Ionicons name="person-add-outline" size={24} color="#fff" />
                  <Text style={styles.cardTitle}> Complete Profile</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  We need a few more details
                </Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color="#fff"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor="#777"
                    onChangeText={setName}
                    value={name}
                  />
                </View>

                <Text style={styles.labelText}>Select Gender</Text>
                <View style={styles.genderRow}>
                  {["male", "female", "other"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        gender === g && styles.genderActive,
                      ]}
                      onPress={() => setGender(g as any)}
                    >
                      <Ionicons
                        name={
                          g === "male"
                            ? "male"
                            : g === "female"
                              ? "female"
                              : "transgender"
                        }
                        size={20}
                        color={gender === g ? "#fff" : "#aaa"}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          gender === g && { color: "#fff" },
                        ]}
                      >
                        {g.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleFinalSubmit}
                  disabled={loading}
                  style={styles.loginBtn}
                >
                  <LinearGradient
                    colors={["#000", "#aaa"]}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>SAVE & CONTINUE</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE: EXISTING DRIVER (Verification) */}
            {stage === "existingDriver" && (
              <>
                {renderBackButton()}
                <View style={styles.cardHeader}>
                  <Ionicons name="camera-outline" size={24} color="#fff" />
                  <Text style={styles.cardTitle}> Quick Verification</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Please take a live photo to verify identity
                </Text>

                <TouchableOpacity
                  style={styles.photoUploadBox}
                  onPress={takeLivePhoto}
                >
                  {livePhoto ? (
                    <Image
                      source={{ uri: livePhoto }}
                      style={styles.previewImg}
                    />
                  ) : (
                    <View style={styles.placeholderBox}>
                      <Ionicons name="camera" size={40} color="#555" />
                      <Text style={{ color: "#555", marginTop: 10 }}>
                        Tap to take Live Photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFinalSubmit}
                  disabled={loading}
                  style={styles.loginBtn}
                >
                  <LinearGradient
                    colors={["#000", "#aaa"]}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>VERIFY & START</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE: NEW DRIVER (Full Onboarding) */}
            {stage === "newDriver" && (
              <>
                {renderBackButton()}
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.cardTitle}> Driver Onboarding</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Complete your profile to start earning
                </Text>

                {/* Removed Nested ScrollView - content flows naturally now */}

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color="#fff"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor="#777"
                    onChangeText={setName}
                    value={name}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="card-outline"
                    size={22}
                    color="#fff"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="License Number"
                    placeholderTextColor="#777"
                    onChangeText={setLicenseNumber}
                    value={licenseNumber}
                  />
                </View>

                {/* License Photo */}
                <Text style={styles.labelText}>License Photo</Text>
                <TouchableOpacity
                  style={styles.docUploadBox}
                  onPress={pickLicensePhoto}
                >
                  {licensePhoto ? (
                    <Image
                      source={{ uri: licensePhoto }}
                      style={styles.docPreview}
                    />
                  ) : (
                    <View style={styles.placeholderDoc}>
                      <Ionicons name="image-outline" size={30} color="#555" />
                      <Text style={{ color: "#555" }}>Upload License</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Live Photo */}
                <Text style={styles.labelText}>Live Verification Photo</Text>
                <TouchableOpacity
                  style={styles.docUploadBox}
                  onPress={takeLivePhoto}
                >
                  {livePhoto ? (
                    <Image
                      source={{ uri: livePhoto }}
                      style={styles.docPreview}
                    />
                  ) : (
                    <View style={styles.placeholderDoc}>
                      <Ionicons name="camera-outline" size={30} color="#555" />
                      <Text style={{ color: "#555" }}>Take Selfie</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFinalSubmit}
                  disabled={loading}
                  style={styles.loginBtn}
                >
                  <LinearGradient
                    colors={["#000", "#aaa"]}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>SUBMIT FOR REVIEW</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Driver Mode Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View
            animation="bounceIn"
            duration={600}
            style={styles.modalCard}
          >
            <LinearGradient
              colors={["#000", "#111"]}
              style={styles.modalIconCircle}
            >
              <Ionicons name="car-sport" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Driver Mode</Text>
            <Text style={styles.modalText}>
              You are switching to Driver Mode. Ensure you have your documents
              ready.
            </Text>
            <TouchableOpacity
              onPress={handleDriverConfirm}
              style={styles.modalBtnWrapper}
            >
              <LinearGradient colors={["#000", "#aaa"]} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  bgCircle: { position: "absolute", borderRadius: 200, opacity: 0.6 },
  logoContainer: { alignItems: "center", marginTop: 20, marginBottom: 10 },
  logoImage: { width: 130, height: 130 },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  tagline: { color: "#ece0e0", fontSize: 14, marginTop: 2, fontWeight: "600" },

  roleContainer: { marginBottom: 15, paddingHorizontal: 30 },
  roleRow: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 40,
    padding: 5,
  },
  roleTouch: { flex: 1 },
  roleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
  },
  roleBtnActive: { backgroundColor: "#111", elevation: 5 },
  roleText: { marginLeft: 8, color: "#000", fontWeight: "bold", fontSize: 15 },
  roleTextActive: { color: "#fff" },

  card: {
    flex: 1,
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  cardTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  cardSubtitle: { fontSize: 14, color: "#aaa", marginBottom: 25 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 58,
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: "#333",
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, color: "#fff", fontWeight: "500" },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },

  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#1a1a1a",
  },

  loginBtn: { marginTop: 25, borderRadius: 15, overflow: "hidden" },
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

  backLink: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backText: { color: "#aaa", fontSize: 14 },

  // New Styles
  labelText: {
    color: "#aaa",
    marginBottom: 10,
    marginTop: 5, // Fixed negative margin issue
    fontWeight: "600",
  },
  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  genderBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  genderActive: { backgroundColor: "#333", borderColor: "#fff" },
  genderText: { marginLeft: 5, color: "#aaa", fontWeight: "bold" },

  photoUploadBox: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
    marginBottom: 15,
  },
  previewImg: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholderBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },

  docUploadBox: {
    width: "100%",
    height: 140,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#1a1a1a",
  },
  docPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholderDoc: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: width * 0.85,
    backgroundColor: "#111",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    elevation: 20,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    marginTop: -50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  modalBtnWrapper: { width: "100%", borderRadius: 15, overflow: "hidden" },
  modalBtn: {
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  modalBtnText: { fontSize: 17, fontWeight: "bold", color: "#fff" },
  modalCancelBtn: { marginTop: 15 },
  modalCancelText: { color: "#90A4AE", fontWeight: "600" },
});
