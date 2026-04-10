import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator, // Import for loading spinner
} from "react-native";

export default function EditDriverProfile() {
  const router = useRouter();

  const [name, setName] = useState("Anand Kumar");
  const [phone, setPhone] = useState("+91 9876543210");
  const [licenseNumber, setLicenseNumber] = useState("KL-123456");

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (type: "profile" | "license") => {
    // 1. Request Permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera roll permissions to upload images.");
      return;
    }

    // 2. Launch Image Library (FIXED DEPRECATION WARNING)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // <--- Fixed: Use array instead of MediaTypeOptions
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === "profile") setProfileImage(result.assets[0].uri);
      else setLicenseImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !phone || !licenseNumber) {
      Alert.alert("Missing Info", "Please fill in all text fields.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("licenseNumber", licenseNumber);

      // Helper to create a file object for FormData
      const createFileFromUri = (uri: string | null, fieldName: string) => {
        if (uri) {
          const uriParts = uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append(fieldName, {
            uri: uri,
            name: `${fieldName}.${fileType}`,
            type: `image/${fileType}`, 
          } as any);
        }
      };

      createFileFromUri(profileImage, "profileImage");
      createFileFromUri(licenseImage, "licenseImage");

      // -----------------------------------------------------------------
      // REAL API CALL EXAMPLE
      // -----------------------------------------------------------------
      // const response = await fetch('https://your-backend.com/api/update-profile', {
      //   method: 'POST',
      //   body: formData,
      //   // Note: Do NOT manually set 'Content-Type': 'multipart/form-data' header
      //   // React Native/Fetch will set the boundary automatically.
      // });
      // 
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message);
      // -----------------------------------------------------------------

      // SIMULATING NETWORK REQUEST
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Saving Data:", { name, phone, licenseNumber });
      console.log("Profile Image:", profileImage ? "Uploaded" : "None");
      console.log("License Image:", licenseImage ? "Uploaded" : "None");

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save profile. Check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#020617", "#0f172a"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => pickImage("profile")}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={40} color="#94a3b8" />
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>License Number</Text>
          <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>License Photo</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("license")}>
            {licenseImage ? (
              <Image source={{ uri: licenseImage }} style={styles.uploadImg} />
            ) : (
              <>
                <Ionicons name="card-outline" size={28} color="#64748b" />
                <Text style={styles.uploadText}>Upload License</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  avatarWrapper: {
    alignSelf: "center",
    height: 100,
    width: 100,
    borderRadius: 50,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  card: {
    backgroundColor: "rgba(30,41,59,0.6)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  uploadBox: {
    height: 120,
    borderRadius: 16,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1e293b",
    borderStyle: "dashed",
  },
  uploadImg: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  uploadText: {
    color: "#64748b",
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#000",
    fontWeight: "700",
  },
});