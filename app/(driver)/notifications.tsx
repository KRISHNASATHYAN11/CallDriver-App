import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


// Dummy Data for Notifications
const DUMMY_NOTIFICATIONS = [
  {
    id: "1",
    title: "Ride Completed",
    message: "Your ride with Sarah M. has been completed. You earned $15.40.",
    time: "10 mins ago",
    type: "success",
  },
  {
    id: "2",
    title: "Weekly Payout",
    message: "Your weekly payout of $1,250 has been processed.",
    time: "2 hours ago",
    type: "money",
  },
  {
    id: "3",
    title: "New Message",
    message: "Support: 'Please update your vehicle documents.'",
    time: "Yesterday",
    type: "alert",
  },
  {
    id: "4",
    title: "Ride Cancelled",
    message: "Passenger cancelled the ride request.",
    time: "Yesterday",
    type: "cancel",
  },
];

export default function NotificationScreen() {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle", color: "#4CAF50" };
      case "money":
        return { name: "wallet", color: "#2196F3" };
      case "alert":
        return { name: "alert-circle", color: "#FF9800" };
      case "cancel":
        return { name: "close-circle", color: "#F44336" };
      default:
        return { name: "notifications", color: "#666" };
    }
  };

  const renderItem = ({ item }: { item: typeof DUMMY_NOTIFICATIONS[0] }) => {
    const icon = getIcon(item.type);
    return (
      <TouchableOpacity style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: icon.color + "20" }]}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={DUMMY_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  listContent: {
    padding: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#282525",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    textAlign: "right",
  },
});