import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
// @ts-ignore - Razorpay types might sometimes conflict with TS strict mode
import RazorpayCheckout from "react-native-razorpay";

// ================= TYPES =================
type RideData = {
  driverName: string;
  startTime: string;
  endTime: string;
  distance: string;
  fare: number;
};

export default function RideDetails() {
  // 1. Get params passed from UserDashboard (if any)
  const params = useLocalSearchParams();
  const pickupLocation = params.pickup as string;
  const vehicleType = params.vehicleType as string || "Sedan";

  // 2. State Management
  const [ratingModal, setRatingModal] = useState<boolean>(false);
  const [rating, setRating] = useState<string>("");
  const [review, setReview] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // 3. Mock Data (In a real app, this comes from an API based on booking ID)
  const rideData: RideData = {
    driverName: "Anand Kumar",
    startTime: "10:30 AM",
    endTime: "11:15 AM",
    distance: "12.5 km",
    fare: vehicleType === "SUV" ? 350 : 250, // Dynamic fare based on car type
  };

  // ================= FUNCTIONS =================

  const handlePayment = (): void => {
    setIsProcessingPayment(true);

    const options = {
      description: "Payment for Ride",
      currency: "INR",
      key: "YOUR_RAZORPAY_KEY", // 🔥 REPLACE THIS WITH YOUR ACTUAL KEY
      amount: rideData.fare * 100, // Amount in paise
      name: "Call Driver App",
      prefill: {
        email: "user@example.com",
        contact: "9999999999",
        name: "User Name",
      },
      theme: { color: "#22c55e" },
    };

    RazorpayCheckout.open(options)
      .then((data: any) => {
        setIsProcessingPayment(false);
        console.log(`Success: ${data.razorpay_payment_id}`);
        // Show Rating Modal immediately after success
        setRatingModal(true);
      })
      .catch((error: any) => {
        setIsProcessingPayment(false);
        Alert.alert("Payment Failed", error.description || "Something went wrong");
      });
  };

  const submitReview = (): void => {
    if (!rating) {
      Alert.alert("Rating Required", "Please enter a rating between 1 and 5.");
      return;
    }

    console.log("Submitting Review:", { rating, review });
    
    // Close modal
    setRatingModal(false);
    
    // Show success alert
    Alert.alert("Thank you!", "Your feedback has been submitted.", [
      {
        text: "OK",
        onPress: () => router.replace("/"), // Go back to home/dashboard
      },
    ]);
    
    // Reset form
    setRating("");
    setReview("");
  };

  // ================= RENDER =================

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={{ width: 40 }} /> {/* Spacer for center alignment */}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* TRIP INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Information</Text>
          
          {pickupLocation && (
            <View style={styles.row}>
              <Text style={styles.label}>Pickup:</Text>
              <Text style={styles.value} numberOfLines={2}>
                {pickupLocation}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Vehicle:</Text>
            <Text style={styles.value}>{vehicleType}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Distance:</Text>
            <Text style={styles.value}>{rideData.distance}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>45 mins</Text>
          </View>
        </View>

        {/* DRIVER CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Details</Text>
          <View style={styles.driverInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AK</Text>
            </View>
            <View>
              <Text style={styles.driverName}>{rideData.driverName}</Text>
              <Text style={styles.carModel}>Toyota Innova • KL 01 AB 1234</Text>
            </View>
          </View>
        </View>

        {/* FARE CARD */}
        <View style={styles.fareCard}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmount}>₹ {rideData.fare}</Text>
          <Text style={styles.fareSub}>Includes taxes & tolls</Text>
        </View>

        {/* PAY BUTTON */}
        <TouchableOpacity 
          style={[styles.payBtn, isProcessingPayment && styles.payBtnDisabled]} 
          onPress={handlePayment}
          disabled={isProcessingPayment}
        >
          {isProcessingPayment ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.payText}>Proceed to Pay</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
           <Text style={styles.cancelBtnText}>Cancel / Dispute</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ================= RATING MODAL ================= */}
      <Modal transparent visible={ratingModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate your Ride ⭐</Text>
            </View>

            <Text style={styles.modalSubText}>
              How was your trip with {rideData.driverName}?
            </Text>

            <TextInput
              placeholder="Rating (1-5)"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={rating}
              onChangeText={setRating}
              keyboardType="number-pad"
              maxLength={1}
            />

            <TextInput
              placeholder="Write a review (optional)..."
              placeholderTextColor="#64748b"
              style={[styles.input, styles.textArea]}
              value={review}
              onChangeText={setReview}
              multiline
            />

            <TouchableOpacity style={styles.submitBtn} onPress={submitReview}>
              <Text style={styles.submitText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617", // Dark Slate
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50, // Status bar padding
    backgroundColor: "#020617",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Common Card Style
  card: {
    backgroundColor: "#0f172a", // Slightly lighter dark
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    color: "#cbd5f1",
    fontSize: 15,
  },
  value: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 10,
  },

  // Driver Specifics
  driverInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e5efe9", // Green accent
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  driverName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  carModel: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 2,
  },

  // Fare Card
  fareCard: {
    backgroundColor: "#0f172a",
    padding: 25,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#22c55e", // Green border for emphasis
  },
  fareLabel: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 5,
  },
  fareAmount: {
    color: "#e1e6e2",
    fontSize: 36,
    fontWeight: "800",
  },
  fareSub: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },

  // Buttons
  payBtn: {
    backgroundColor: "#d5dcd8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
  payBtnDisabled: {
    backgroundColor: "#1e293b",
    shadowOpacity: 0,
    elevation: 0,
  },
  payText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  modalHeader: {
    marginBottom: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubText: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#020617",
    color: "#fff",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});