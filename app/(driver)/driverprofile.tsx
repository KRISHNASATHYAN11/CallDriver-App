import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Mock Data ---
const DRIVER_PROFILE = {
  name: "Anand Kumar",
  email: "anand.kumar@email.com",
  phone: "+91 98765 43210",
  age: "28",
  gender: "Male",
  licenseNumber: "KL-05-20230012345",
  profileImage: null,
  licensePhoto: null,
};

export default function DriverProfile() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          // 👉 Add your logout logic here (clear token etc.)
          router.replace("/login");
        },
      },
    ]);
  };

  const renderInfoRow = ({
    icon,
    label,
    value,
    isLast,
    isBadge,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    isLast?: boolean;
    isBadge?: boolean;
  }) => (
    <View style={[styles.infoRowWrapper, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={18} color="#64748b" />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        {isBadge ? (
          <View style={styles.genderBadge}>
            <Text style={styles.genderBadgeText}>{value}</Text>
          </View>
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Profile</Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/(driver)/edit-profile")}
          >
            <Ionicons name="create-outline" size={18} color="#34d399" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* PROFILE HEADER */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarOuter}>
              <LinearGradient
                colors={
                  DRIVER_PROFILE.profileImage
                    ? ["#34d399", "#059669"]
                    : ["#1e293b", "#0f172a"]
                }
                style={styles.avatarGradient}
              >
                {DRIVER_PROFILE.profileImage ? (
                  <Image
                    source={{ uri: DRIVER_PROFILE.profileImage }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Ionicons name="person" size={44} color="#334155" />
                )}
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.profileName}>{DRIVER_PROFILE.name}</Text>
            <Text style={styles.profileEmail}>{DRIVER_PROFILE.email}</Text>
          </View>

          {/* PERSONAL INFO */}
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>PERSONAL INFORMATION</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.card}>
            {renderInfoRow({
              icon: "person-outline",
              label: "Full Name",
              value: DRIVER_PROFILE.name,
            })}
            {renderInfoRow({
              icon: "mail-outline",
              label: "Email Address",
              value: DRIVER_PROFILE.email,
            })}
            {renderInfoRow({
              icon: "call-outline",
              label: "Phone Number",
              value: DRIVER_PROFILE.phone,
            })}
            {renderInfoRow({
              icon: "calendar-outline",
              label: "Age",
              value: DRIVER_PROFILE.age,
            })}
            {renderInfoRow({
              icon: "male-female-outline",
              label: "Gender",
              value: DRIVER_PROFILE.gender,
              isLast: true,
              isBadge: true,
            })}
          </View>

          {/* DRIVER DETAILS */}
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DRIVER DETAILS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.card}>
            {renderInfoRow({
              icon: "card-outline",
              label: "License Number",
              value: DRIVER_PROFILE.licenseNumber,
            })}

            <View style={styles.licenseVerifiedRow}>
              <Ionicons name="shield-checkmark" size={16} color="#34d399" />
              <Text style={styles.licenseVerifiedText}>
                License Verified & Valid until Dec 2028
              </Text>
            </View>
          </View>

          {/* LICENSE PHOTO */}
          <View style={[styles.card, { padding: 0, overflow: "hidden" }]}>
            <View style={styles.licensePhotoHeader}>
              <View style={styles.infoIconBox}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color="#64748b"
                />
              </View>
              <Text style={styles.infoLabel}>License Photo</Text>
            </View>

            {DRIVER_PROFILE.licensePhoto ? (
              <Image
                source={{ uri: DRIVER_PROFILE.licensePhoto }}
                style={styles.licensePhotoImg}
              />
            ) : (
              <View style={styles.licensePhotoPlaceholder}>
                <Ionicons name="image-outline" size={40} color="#1e293b" />
                <Text style={styles.placeholderText}>
                  No License Photo Uploaded
                </Text>
              </View>
            )}
          </View>

          {/* 🔴 LOGOUT BUTTON */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "#000" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editBtnText: { color: "#34d399", fontWeight: "700" },

  scrollContent: { paddingHorizontal: 20 },

  profileHeader: { alignItems: "center", paddingVertical: 28 },
  avatarOuter: { position: "relative", marginBottom: 16 },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#34d399",
  },

  profileName: { fontSize: 24, fontWeight: "800", color: "#fff" },
  profileEmail: { color: "#64748b" },

  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#222" },
  dividerText: { fontSize: 10, color: "#555", marginHorizontal: 10 },

  card: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
  },

  infoRowWrapper: { flexDirection: "row", paddingVertical: 10 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#222" },
  infoIconBox: { width: 36, justifyContent: "center", alignItems: "center" },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#64748b" },
  infoValue: { color: "#e2e8f0" },

  genderBadge: {
    backgroundColor: "rgba(52,211,153,0.15)",
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  genderBadgeText: { color: "#34d399" },

  licenseVerifiedRow: { flexDirection: "row", marginTop: 10 },
  licenseVerifiedText: { color: "#64748b", marginLeft: 6 },

  licensePhotoHeader: { flexDirection: "row", padding: 20 },
  licensePhotoImg: { width: "100%", height: 180 },
  licensePhotoPlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#555" },

  // 🔴 Logout Styles
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "700",
  },
});