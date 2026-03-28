import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, TextInput, ScrollView, Alert, 
  Modal, Dimensions, ActivityIndicator, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Toast from "react-native-toast-message";


const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  // --- State for Form ---
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+91 9876543210");

  // --- State for Image Logic (Exactly like DriverDashboard) ---
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  // --- 1. Pick Image Logic ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPendingImage(result.assets[0].uri);
      setIsConfirmModalVisible(true); // Open confirmation modal
    }
  };

  // --- 2. Confirm/Cancel Logic ---
  const confirmImage = () => {
    setProfileImage(pendingImage);
    setIsConfirmModalVisible(false);
    setPendingImage(null);
  };

  const cancelImage = () => {
    setIsConfirmModalVisible(false);
    setPendingImage(null);
  };

  // --- 3. Avatar Tap Logic ---
  const handleAvatarPress = () => {
    if (profileImage) {
      setIsViewModalVisible(true); // View full image
    } else {
      pickImage(); // Pick new image
    }
  };

  const handleSave = () => {
      Toast.show({
            type: "success",
            text1: "Success",
            text2: "Profile updated successfully!",
            position: "top",
            topOffset: 100,
          });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Image - Updated Logic */}
        <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color="#1E88E5" />
            </View>
          )}
          <View style={styles.editIcon}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.subtitleText}>Tap photo to update</Text>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} style={{ marginTop: 20 }}>
          <LinearGradient colors={['#007bff', '#00c6ff']} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* ----------------- MODALS (From DriverDashboard) ----------------- */}

      {/* 1. CONFIRMATION MODAL */}
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

      {/* 2. VIEW IMAGE MODAL */}
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  
  // Avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: '#007bff'
  },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#E3F2FD', // Light Blue
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#007bff'
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: (Platform.OS === 'web') ? '40%' : '35%',
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff'
  },
  subtitleText: {
    textAlign: 'center', 
    color: '#888', 
    fontSize: 12, 
    marginBottom: 30
  },

  // Form
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#F5F7FA',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
  },
  
  // Save Button
  saveBtn: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff', fontWeight: 'bold', fontSize: 16
  },

  // --- MODAL STYLES (Exactly from DriverDashboard) ---
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },

  confirmModalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20 },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#007bff' }, // Blue Theme
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },

  viewModalView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
    borderRadius: 20,
  },
  closeBtn: { position: 'absolute', top: 50, right: 20 },
  changePhotoBtn: {
    flexDirection: 'row',
    backgroundColor: '#007bff', // Blue Theme
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginTop: 30,
    alignItems: 'center',
  },
  changePhotoText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
});