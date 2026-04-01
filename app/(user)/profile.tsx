import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  Pressable,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  // --- Profile Data ---
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [bio, setBio] = useState("Live to ride 🚗");

  // --- Image State ---
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  // --- Edit Mode ---
  const [isEditing, setIsEditing] = useState(false);

  // --- Image Functions ---
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

  const handleSave = () => {
    setIsEditing(false);
    Toast.show({
      type: "success",
      text1: "Profile Updated",
      text2: "Your changes have been saved ✨",
      position: "top",
      topOffset: 60,
    });
  };

  // --- Editable Fields ---
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [editBio, setEditBio] = useState(bio);

  const startEditing = () => {
    setEditName(name);
    setEditEmail(email);
    setEditPhone(phone);
    setEditBio(bio);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = () => {
    setName(editName);
    setEmail(editEmail);
    setEditPhone(editPhone);
    setPhone(editPhone);
    setBio(editBio);
    setIsEditing(false);
    Toast.show({
      type: "success",
      text1: "Profile Updated",
      text2: "Your changes have been saved ✨",
      position: "top",
      topOffset: 60,
    });
  };

  // --- Stats ---
  const stats = [
    { label: "Rides", value: "24" },
    { label: "Reviews", value: "4.8★" },
    { label: "Member", value: "2024" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* ===== BLACK HEADER ===== */}
        <LinearGradient
          colors={["#0a0a0a", "#1a1a1a"]}
          style={styles.headerGradient}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={startEditing} style={styles.iconBtn}>
                <Ionicons name="create-outline" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={cancelEditing} style={styles.iconBtn}>
                <Ionicons name="close" size={22} color="#ff4757" />
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Pressable
              onPress={handleAvatarPress}
              style={styles.avatarPressable}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={50} color="#555" />
                </View>
              )}
            </Pressable>
           
            {/* WITH THIS */}
            {!isEditing && !profileImage && (
              <TouchableOpacity style={styles.cameraBadge} onPress={pickImage}>
                <Ionicons name="camera" size={14} color="#000" />
              </TouchableOpacity>
            )}
          </View>

          {/* Name & Bio */}
          {!isEditing ? (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileBio}>{bio}</Text>
            </View>
          ) : (
            <View style={styles.editProfileInfo}>
              <TextInput
                style={styles.editNameInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#555"
                maxLength={30}
              />
              <TextInput
                style={styles.editBioInput}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Write a short bio..."
                placeholderTextColor="#555"
                maxLength={100}
                multiline
              />
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {stats.map((item, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Save Button in Edit Mode */}
          {isEditing && (
            <TouchableOpacity
              style={styles.saveBtnWrapper}
              onPress={saveEditing}
            >
              <LinearGradient
                colors={["#ffffff", "#cccccc"]}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ===== EDIT SECTION (Only in Edit Mode) ===== */}
        {isEditing && (
          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconRow}>
                <Ionicons name="mail-outline" size={16} color="#888" />
                <Text style={styles.fieldLabel}>Email</Text>
              </View>
              <TextInput
                style={styles.editField}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email address"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconRow}>
                <Ionicons name="call-outline" size={16} color="#888" />
                <Text style={styles.fieldLabel}>Phone</Text>
              </View>
              <TextInput
                style={styles.editField}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone number"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: "#1a1a2e" }]}
                >
                  <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                </View>
                <Text style={styles.actionText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: "#1a1a2e" }]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#fff"
                  />
                </View>
                <Text style={styles.actionText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: "#2d1a1a" }]}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ff4757" />
                </View>
                <Text style={[styles.actionText, { color: "#ff4757" }]}>
                  Log Out
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        )}

        {/* ===== NORMAL MODE: Menu Section ===== */}
        {!isEditing && (
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="car-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.menuTitle}>My Rides</Text>
                  <Text style={styles.menuSubtitle}>View ride history</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Payments</Text>
                  <Text style={styles.menuSubtitle}>
                    Manage payment methods
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="help-circle-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Help & Support</Text>
                  <Text style={styles.menuSubtitle}>FAQs and contact us</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: "#2d1a1a" }]}>
                  <Ionicons name="log-out-outline" size={20} color="#ff4757" />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: "#ff4757" }]}>
                    Log Out
                  </Text>
                  <Text style={styles.menuSubtitle}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        )}

        {/* Version */}
        {!isEditing && (
          <Text style={styles.versionText}>CallDriver v1.0.0</Text>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ===== CONFIRM IMAGE MODAL ===== */}
      <Modal
        visible={isConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelImage}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Use this photo?</Text>
            {pendingImage && (
              <Image
                source={{ uri: pendingImage }}
                style={styles.previewImage}
              />
            )}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={cancelImage}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={confirmImage}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== VIEW IMAGE MODAL ===== */}
      <Modal
        visible={isViewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.viewCloseBtn}
            onPress={() => setIsViewModalVisible(false)}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
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
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* ---------- HEADER GRADIENT ---------- */
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---------- AVATAR ---------- */
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  avatarPressable: {
    borderRadius: 70,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#333",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: Platform.OS === "web" ? width * 0.38 : width * 0.35,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },

  /* ---------- PROFILE INFO ---------- */
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  editProfileInfo: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  editNameInput: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#333",
    width: "80%",
    marginBottom: 10,
  },
  editBioInput: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    width: "90%",
    minHeight: 40,
    backgroundColor: "#0a0a0a",
  },

  /* ---------- STATS ---------- */
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#111",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222",
    minWidth: 90,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* ---------- SAVE BUTTON ---------- */
  saveBtnWrapper: {
    marginTop: 5,
    marginBottom: 5,
    width: "60%",
    alignSelf: "center",
  },
  saveBtn: {
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  /* ---------- EDIT SECTION ---------- */
  editSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 15,
    marginTop: 5,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editField: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#222",
    marginVertical: 20,
  },

  /* ---------- QUICK ACTIONS ---------- */
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#1a1a1a",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },

  /* ---------- MENU SECTION (Normal Mode) ---------- */
  menuSection: {
    padding: 20,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#1a1a1a",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  /* ---------- VERSION ---------- */
  versionText: {
    textAlign: "center",
    color: "#333",
    fontSize: 12,
    marginTop: 20,
  },

  /* ---------- MODALS ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModal: {
    width: "85%",
    backgroundColor: "#111",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  previewImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#333",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#222",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#aaa",
    fontWeight: "600",
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#000",
    fontWeight: "700",
  },
  viewCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  fullImage: {
    width: "88%",
    height: "65%",
    borderRadius: 20,
    resizeMode: "contain",
  },
  changePhotoBtn: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 30,
    alignItems: "center",
    gap: 8,
  },
  changePhotoText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
});
