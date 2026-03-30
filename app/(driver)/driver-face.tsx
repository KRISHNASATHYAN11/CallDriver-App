import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function DriverFace() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const takePhoto = async () => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    
    // Play flash animation
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync();
      console.log(photo);
      
      setTimeout(() => {
        router.push("/(driver)/driver-license");
      }, 500);
    } catch (e) {
      console.error(e);
      setIsCapturing(false);
    }
  };

  if (!permission) return <LoadingScreen />;

  if (!permission.granted) {
    return (
      <PermissionScreen requestPermission={requestPermission} />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      {/* Flash Overlay - FIX APPLIED HERE */}
      <Animated.View 
        style={[
          styles.flashOverlay, 
          { opacity: flashAnim }
        ]} 
        pointerEvents="none" // <--- This allows clicks to pass through
      />

      {/* Top Instruction Bar */}
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <Ionicons name="scan-outline" size={18} color="#4F46E5" />
          <Text style={styles.badgeText}>Face Verification</Text>
        </View>
        <Text style={styles.instructionText}>Position your face in the circle</Text>
      </View>

      {/* Face Guide Overlay */}
      <View style={styles.overlayContainer}>
        <View style={styles.faceGuide}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          onPress={takePhoto} 
          style={styles.captureButton}
          disabled={isCapturing}
          activeOpacity={0.8}
        >
          <View style={styles.captureInner}>
             <Ionicons name="camera" size={32} color="white" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.hintText}>Tap to capture</Text>
      </View>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.centered}>
      <Text>Loading Camera...</Text>
    </View>
  );
}

function PermissionScreen({ requestPermission }: { requestPermission: () => void }) {
  return (
    <View style={styles.centered}>
      <View style={styles.permissionCard}>
        <Ionicons name="camera-outline" size={60} color="#fff" />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to verify your identity.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  
  // Flash Effect
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    zIndex: 10,
  },

  // Top Bar Styles
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#000',
    fontSize: 14,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },

  // Overlay & Face Guide
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 280,
    height: 350,
    borderRadius: 180,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff', 
    borderWidth: 4,
  },
  topLeft: { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 140 },
  topRight: { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 140 },
  bottomLeft: { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 140 },
  bottomRight: { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 140 },

  // Bottom Controls
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 10,
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },

  // Permission Screen Styles
  permissionCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#1F2937',
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 22,
  },
  grantBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginTop: 10,
  },
  grantBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});