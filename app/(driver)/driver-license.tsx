import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from "react-native";
import { useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

export default function DriverLicense() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  // State for the instruction popup
  const [showInstructions, setShowInstructions] = useState(true);
  
  // State for the captured image
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  if (!permission) return <Text style={styles.loadingText}>Loading...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need access to your camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 1. Take Photo
  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedImage(photo.uri);
    }
  };

  // 2. Retake Photo
  const handleRetake = () => {
    setCapturedImage(null);
  };

  // 3. Confirm and Navigate
  const handleConfirm = () => {
    console.log("Image confirmed:", capturedImage);
    router.replace("/(driver)/driverdashboard");
  };

  // --- RENDER: INSTRUCTION POPUP ---
  if (showInstructions) {
    return (
      <View style={styles.instructionContainer}>
        <View style={styles.instructionCard}>
          {/* Icon */}
          <Text style={styles.iconStyle}>🪪</Text>
          
          {/* Title */}
          <Text style={styles.instructionTitle}>Verify Your License</Text>
          
          {/* Description */}
          <Text style={styles.instructionDesc}>
            Please take a clear photo of your driving license. 
            Make sure all details are visible and there is no blur.
          </Text>

          {/* Start Button */}
          <TouchableOpacity onPress={() => setShowInstructions(false)}>
            <LinearGradient
              colors={["#007bff", "#00c6ff"]}
              style={styles.startBtn}
            >
              <Text style={styles.startBtnText}>Start Scanning</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- RENDER: PREVIEW MODE ---
  if (capturedImage) {
    return (
      <View style={{ flex: 1 }}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        
        {/* Top Bar during preview */}
        <View style={styles.previewTopBar}>
          <Text style={styles.previewTopText}>Is this clear enough?</Text>
        </View>

        <View style={styles.previewButtonsContainer}>
          <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn}>
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleConfirm}>
            <LinearGradient
              colors={["#28a745", "#5cb85c"]}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>Looks Good ✓</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- RENDER: CAMERA MODE ---
  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

      {/* Top Instruction Overlay */}
      <View style={styles.cameraTopOverlay}>
        <Text style={styles.cameraTopText}>Align your license within the frame</Text>
      </View>

      {/* Capture Button */}
      <TouchableOpacity
        onPress={takePhoto}
        activeOpacity={0.8}
        style={styles.captureBtnOuter}
      >
        <View style={styles.captureBtnInner} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Generic
  loadingText: { textAlign: "center", marginTop: 50, color: "#555" },

  // Permission Screen
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  permissionText: { fontSize: 18, marginBottom: 20, color: "#333" },
  grantBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  grantBtnText: { color: "#fff", fontWeight: "bold" },

  // Instruction Popup Styles
  instructionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f4f8", // Light background
    padding: 20,
  },
  instructionCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconStyle: {
    fontSize: 60,
    marginBottom: 15,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  instructionDesc: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  startBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  startBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Camera Styles
  cameraTopOverlay: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
    borderRadius: 10,
  },
  cameraTopText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  captureBtnOuter: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },

  // Preview Styles
  previewImage: {
    flex: 1,
    resizeMode: "cover",
  },
  previewTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    paddingTop: 50,
  },
  previewTopText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  previewButtonsContainer: {
    position: "absolute",
    bottom:40,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  retakeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "#fff",
  },
  retakeBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmBtn: {
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});