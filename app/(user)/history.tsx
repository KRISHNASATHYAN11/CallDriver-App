import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Dummy Data
const historyData = [
  { id: '1', from: 'Technopark', to: 'Kovalam', fare: '₹350', date: 'Oct 20, 2023', status: 'Completed' },
  { id: '2', from: 'Airport', to: 'City Center', fare: '₹500', date: 'Oct 18, 2023', status: 'Completed' },
  { id: '3', from: 'Railway Station', to: 'Kazhakootam', fare: '₹200', date: 'Oct 15, 2023', status: 'Cancelled' },
  { id: '4', from: 'Museum', to: 'Lighthouse', fare: '₹150', date: 'Oct 10, 2023', status: 'Completed' },
];

export default function HistoryScreen() {
  
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={[
          styles.statusText, 
          { color: item.status === 'Completed' ? '#28a745' : '#dc3545' }
        ]}>
          {item.status}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Ionicons name="ellipse" size={8} color="#28a745" />
          <Text style={styles.routeText}>{item.from}</Text>
        </View>
        <View style={styles.dottedLine} />
        <View style={styles.routeRow}>
          <Ionicons name="location" size={12} color="#dc3545" />
          <Text style={styles.routeText}>{item.to}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.fareText}>{item.fare}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rides</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },

  // List
  listContent: { padding: 20 },
  
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateText: { color: '#666', fontSize: 12 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  
  routeContainer: { marginLeft: 5 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  routeText: { marginLeft: 10, fontSize: 15, fontWeight: '500', color: '#333' },
  dottedLine: {
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    borderStyle: 'dashed',
    height: 15,
    marginLeft: 3.5,
    marginBottom: 2
  },

  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end'
  },
  fareText: { fontSize: 18, fontWeight: 'bold', color: '#007bff' }
});