import React from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Dimensions, 
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function DriverWalletScreen() {
  const router = useRouter(); 

 
  const weeklyData = {
    totalRides: 42,
    totalFare: "$ 1,250.00",
    yourEarnings: "$ 950.00",
    hoursOnline: "32 Hrs",
    chartData: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [ { data: [120, 150, 80, 200, 180, 250, 270] } ]
    }
  };
  
  const recentRides = [
    { id: '1', userName: "Sarah Johnson", distance: "5.2 km", fare: "$35.00" },
    { id: '2', userName: "Mike Ross", distance: "12 km", fare: "$60.00" },
    { id: '3', userName: "Rachel Zane", distance: "8 km", fare: "$45.50" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <View style={{ width: 30 }} />
        </View>

       
        <LinearGradient
          colors={['#0D47A1', '#1976D2']}
          style={styles.balanceCard}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        >
          <Text style={styles.balanceLabel}>This Week's Earnings</Text>
          <Text style={styles.balanceAmount}>{weeklyData.yourEarnings}</Text>
          
          <View style={styles.balanceFooter}>
            <View style={styles.balanceItem}>
              <Ionicons name="car-sport-outline" size={18} color="#E3F2FD" />
              <Text style={styles.balanceItemText}> {weeklyData.totalRides} Rides</Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="time-outline" size={18} color="#E3F2FD" />
              <Text style={styles.balanceItemText}> {weeklyData.hoursOnline}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="cash-outline" size={28} color="#1565C0" />
            <Text style={styles.statValue}>{weeklyData.totalFare}</Text>
            <Text style={styles.statLabel}>Total Fare Collected</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="wallet-outline" size={28} color="#2E7D32" />
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>{weeklyData.yourEarnings}</Text>
            <Text style={styles.statLabel}>Your Earnings</Text>
          </View>
        </View>

        {/* WEEKLY GRAPH */}
        <View style={styles.graphContainer}>
          <Text style={styles.sectionTitle}>Weekly Performance</Text>
          
          <LineChart
            data={weeklyData.chartData}
            width={width - 40}
            height={220}
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: "#1E88E5",
              backgroundGradientFrom: "#1E88E5",
              backgroundGradientTo: "#42A5F5",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "6", strokeWidth: "2", stroke: "#fff" }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        {/* RECENT RIDES LIST */}
        <View style={styles.ridesSection}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          
          {recentRides.map((item) => (
            <View key={item.id} style={styles.rideItem}>
              <View style={styles.rideIcon}>
                <Ionicons name="car-sport" size={20} color="#fff" />
              </View>
              <View style={styles.rideDetails}>
                <Text style={styles.rideUser}>{item.userName}</Text>
                <Text style={styles.rideMeta}>User's Car • {item.distance}</Text>
              </View>
              <Text style={styles.rideFare}>{item.fare}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  balanceCard: { marginHorizontal: 20, borderRadius: 20, padding: 25, marginBottom: 20, elevation: 5 },
  balanceLabel: { color: '#E3F2FD', fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 42, fontWeight: 'bold', marginVertical: 10 },
  balanceFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 15, marginTop: 10 },
  balanceItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  balanceItemText: { color: '#fff', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', marginHorizontal: 20, justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, marginHorizontal: 5, padding: 15, borderRadius: 15, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1565C0', marginVertical: 5 },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  graphContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  ridesSection: { marginHorizontal: 20, paddingBottom: 40 },
  rideItem: { backgroundColor: '#fff', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1 },
  rideIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E88E5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rideDetails: { flex: 1 },
  rideUser: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  rideMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  rideFare: { fontWeight: 'bold', fontSize: 16, color: '#2E7D32' },
});