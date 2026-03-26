import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  Dimensions, Image, ScrollView, Switch, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasRequest, setHasRequest] = useState(true); 
  const toggleSwitch = () => setIsOnline(previousState => !previousState);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        
        {/* --- HEADER SECTION --- */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.profileContainer}>
              {/* Dummy Profile Image */}
              <View style={styles.profileImage}>
                <Ionicons name="person" size={30} color="#1E88E5" />
              </View>
              <View>
                <Text style={styles.greeting}>Good Morning</Text>
                <Text style={styles.driverName}>John </Text>
              </View>
            </View>

            {/* Notification Icon */}
            <TouchableOpacity style={styles.bellButton}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* --- STATUS TOGGLE CARD --- */}
        <Animatable.View animation="zoomIn" delay={300} style={styles.statusCard}>
          <LinearGradient
            colors={isOnline ? ['#E3F2FD', '#BBDEFB'] : ['#FFEBEE', '#FFCDD2']} // Blue if online, Red if offline
            style={styles.statusGradient}
          >
            <View style={styles.statusRow}>
              <View>
                <Text style={[styles.statusText, { color: isOnline ? '#1565C0' : '#C62828' }]}>
                  {isOnline ? "You are Online" : "You are Offline"}
                </Text>
                <Text style={styles.statusSubtext}>
                  {isOnline ? "Waiting for ride requests..." : "Go online to accept rides"}
                </Text>
              </View>
              
              <Switch
                trackColor={{ false: "#ef9a9a", true: "#90CAF9" }}
                thumbColor={isOnline ? "#1E88E5" : "#f4f3f4"}
                ios_backgroundColor="#ef9a9a"
                onValueChange={toggleSwitch}
                value={isOnline}
                style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
              />
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* --- EARNINGS CARD --- */}
        <Animatable.View animation="slideInUp" delay={400} style={styles.earningsWrapper}>
          <LinearGradient
            colors={['#1565C0', '#42A5F5']}
            style={styles.earningsCard}
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          >
            <Text style={styles.earningsLabel}>Today's Earnings</Text>
            <Text style={styles.earningsAmount}>$ 245.50</Text>
            
            <View style={styles.earningsFooter}>
              <View style={styles.earningsStat}>
                <Ionicons name="car-sport" size={16} color="#fff" />
                <Text style={styles.earningsStatText}> 8 Trips</Text>
              </View>
              <View style={styles.earningsStat}>
                <Ionicons name="time" size={16} color="#fff" />
                <Text style={styles.earningsStatText}> 6.5 Hrs</Text>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* --- RIDE REQUEST (Only shows if Online & Has Request) --- */}
        {isOnline && hasRequest && (
          <Animatable.View animation="bounceInUp" duration={800} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Ionicons name="radio-button-on" size={16} color="#1E88E5" />
              <Text style={styles.requestTitle}> NEW RIDE REQUEST</Text>
            </View>

            {/* Passenger Info */}
            <View style={styles.passengerRow}>
              <View style={styles.passengerAvatar}>
                <Text style={styles.avatarText}>S</Text>
              </View>
              <View>
                <Text style={styles.passengerName}>Sarah Johnson</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}> 4.9 (234 rides)</Text>
                </View>
              </View>
              <Text style={styles.estimatedTime}>2 min away</Text>
            </View>

            {/* Route Details */}
            <View style={styles.routeContainer}>
              <View style={styles.routePoints}>
                 <View style={styles.routeDot} />
                 <View style={styles.routeLine} />
                 <View style={[styles.routeDot, { backgroundColor: '#FF5722' }]} />
              </View>
              
              <View style={styles.routeTexts}>
                <View style={styles.locationBox}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.locationText}>456 Oak Avenue</Text>
                </View>
                <View style={{ height: 15 }} />
                <View style={styles.locationBox}>
                  <Text style={styles.locationLabel}>DROP-OFF</Text>
                  <Text style={styles.locationText}>123 Main Street Mall</Text>
                </View>
              </View>
            </View>

            {/* Price & Buttons */}
            <View style={styles.actionRow}>
              <View>
                <Text style={styles.priceLabel}>EST. FARE</Text>
                <Text style={styles.priceAmount}>$15.40</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.declineBtn}
                onPress={() => setHasRequest(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.acceptBtn}>
                <Text style={styles.acceptBtnText}>ACCEPT RIDE</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

        {/* --- QUICK STATS --- */}
        <View style={styles.statsContainer}>
          <Animatable.View animation="fadeInLeft" delay={600} style={styles.statCard}>
            <Ionicons name="star-half" size={28} color="#1E88E5" />
            <Text style={styles.statNumber}>4.85</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </Animatable.View>
          
          <Animatable.View animation="fadeInRight" delay={600} style={styles.statCard}>
            <Ionicons name="map-outline" size={28} color="#1E88E5" />
            <Text style={styles.statNumber}>2,450</Text>
            <Text style={styles.statLabel}>Km Driven</Text>
          </Animatable.View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#90A4AE',
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  bellButton: {
    position: 'relative',
    padding: 5,
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5722',
  },

  // Status Toggle
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusGradient: {
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },

  // Earnings Card
  earningsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  earningsCard: {
    borderRadius: 20,
    padding: 20,
    // Replaced shadow* with boxShadow for web compatibility or new RN style
    elevation: 8, 
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  earningsLabel: {
    color: '#E3F2FD',
    fontSize: 14,
    letterSpacing: 1,
  },
  earningsAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 15,
  },
  earningsFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 15,
  },
  earningsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  earningsStatText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Ride Request Card
  requestCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E88E5',
    letterSpacing: 1,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passengerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingText: {
    fontSize: 12,
    color: '#888',
  },
  estimatedTime: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
  },
  
  // Route details
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingLeft: 10,
  },
  routePoints: {
    width: 20,
    alignItems: 'center',
    marginRight: 15,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginVertical: 5,
  },
  routeTexts: {
    flex: 1,
  },
  locationBox: {},
  locationLabel: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  declineBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Bottom Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});