// src/components/FaceVerification.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  Vibration,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface FaceVerificationProps {
  visible: boolean;
  driverId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FaceVerification({
  visible,
  driverId,
  onSuccess,
  onCancel,
}: FaceVerificationProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [step, setStep] = useState<'guide' | 'scanning' | 'captured' | 'success' | 'failed'>('guide');
  
  const cameraRef = useRef<any>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep('guide');
      setCapturedImage(null);
      setIsCapturing(false);
      setIsVerifying(false);
      successScale.setValue(0);
    }
  }, [visible]);

  // Scanning animation
  useEffect(() => {
    if (step === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
      scanAnim.setValue(0);
    }
  }, [step]);

  // Pulse animation for guide
  useEffect(() => {
    if (step === 'guide') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [step]);

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is required for verification.');
        onCancel();
        return;
      }
    }
    setStep('scanning');
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Vibration.vibrate(100);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });

      setCapturedImage(photo.uri);
      setStep('captured');
      
      // Auto-verify after capture
      setTimeout(() => verifyFace(photo.uri), 500);
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setStep('scanning');
    } finally {
      setIsCapturing(false);
    }
  };

  const verifyFace = async (imageUri: string) => {
    setIsVerifying(true);
    
    try {
      // ============================================
      // OPTION 1: Send to backend for face matching
      // ============================================
      // const response = await driverApi.verifyFace(driverId, imageUri);
      // if (response.success) { ... }

      // ============================================
      // OPTION 2: Client-side basic check (for demo)
      // In production, use a proper face verification API
      // ============================================
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // For demo: 95% success rate
      const isSuccess = Math.random() > 0.05;
      
      if (isSuccess) {
        setStep('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Animated.spring(successScale, {
          toValue: 1,
          delay: 200,
          useNativeDriver: true,
        }).start();

        // Auto-close and call success
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setStep('failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate([100, 100, 100]);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStep('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setStep('scanning');
  };

  const handleClose = () => {
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Guide Step */}
        {step === 'guide' && (
          <View style={styles.guideContainer}>
            <Animated.View style={[styles.guideIcon, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="scan-outline" size={80} color="#34d399" />
            </Animated.View>
            <Text style={styles.guideTitle}>Face Verification Required</Text>
            <Text style={styles.guideSubtitle}>
              For safety and security, please verify your identity before going online.
            </Text>
            
            <View style={styles.tipsContainer}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                <Text style={styles.tipText}>Ensure good lighting</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                <Text style={styles.tipText}>Remove sunglasses/mask</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                <Text style={styles.tipText}>Face the camera directly</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                <Text style={styles.tipText}>Keep a neutral expression</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={handleStartScan}>
              <LinearGradient colors={['#34d399', '#059669']} style={styles.startBtnGradient}>
                <Ionicons name="camera" size={22} color="#000" />
                <Text style={styles.startBtnText}>Start Verification</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && permission?.granted && (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              enableTorch={false}
            >
              {/* Face Guide Overlay */}
              <View style={styles.faceGuideOverlay}>
                <View style={styles.faceGuideContainer}>
                  <View style={styles.faceGuideOval} />
                  
                  {/* Scanning line */}
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-80, 80],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Bottom controls */}
              <View style={styles.cameraControls}>
                <Text style={styles.cameraInstruction}>
                  Position your face within the oval
                </Text>
                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={handleCapture}
                  disabled={isCapturing}
                >
                  <View style={[styles.captureBtnInner, isCapturing && styles.capturing]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
                  <Ionicons name="camera-reverse" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        )}

        {/* Captured Step (Preview) */}
        {step === 'captured' && capturedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            <View style={styles.verifyingOverlay}>
              {isVerifying ? (
                <View style={styles.verifyingContent}>
                  <ActivityIndicator size="large" color="#34d399" />
                  <Text style={styles.verifyingText}>Verifying your identity...</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <View style={styles.resultContainer}>
            <Animated.View style={[styles.successIcon, { transform: [{ scale: successScale }] }]}>
              <LinearGradient
                colors={['#34d399', '#059669']}
                style={styles.successIconBg}
              >
                <Ionicons name="checkmark" size={60} color="#000" />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.successTitle}>Verification Successful</Text>
            <Text style={styles.successSubtitle}>You are now going online</Text>
          </View>
        )}

        {/* Failed Step */}
        {step === 'failed' && (
          <View style={styles.resultContainer}>
            <View style={styles.failedIcon}>
              <Ionicons name="close" size={60} color="#ef4444" />
            </View>
            <Text style={styles.failedTitle}>Verification Failed</Text>
            <Text style={styles.failedSubtitle}>
              We couldn't verify your identity. Please try again with better lighting.
            </Text>
            <View style={styles.failedActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Ionicons name="refresh" size={20} color="#34d399" />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  guideContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(52,211,153,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  guideSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 15,
    color: '#e2e8f0',
  },
  startBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  faceGuideOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  faceGuideContainer: {
    width: 240,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  faceGuideOval: {
    width: 200,
    height: 260,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#34d399',
    backgroundColor: 'rgba(52,211,153,0.05)',
  },
  scanLine: {
    position: 'absolute',
    width: 180,
    height: 2,
    backgroundColor: '#34d399',
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 60,
    alignItems: 'center',
    gap: 20,
  },
  cameraInstruction: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  capturing: {
    backgroundColor: '#34d399',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  capturedImage: {
    flex: 1,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingContent: {
    alignItems: 'center',
    gap: 16,
  },
  verifyingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  successIcon: {
    marginBottom: 24,
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
  },
  failedIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239,68,68,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
  },
  failedSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  failedActions: {
    width: '100%',
    gap: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#34d399',
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34d399',
  },
  cancelBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
});