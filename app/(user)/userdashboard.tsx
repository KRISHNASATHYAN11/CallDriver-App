import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
  Keyboard,
  Animated,
} from "react-native";
import MapView, { Marker, Region, MapPressEvent } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

/* ================= DARK MAP STYLE ================= */
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "geometry.stroke", stylers: [{ color: "#2a2a2a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#888888" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2a2a2a" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#333333" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#666666" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#333333" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#444444" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#111111" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#555555" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#555555" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#555555" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#111111" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#333333" }],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#777777" }],
  },
];

/* ================= SEARCH COMPONENT ================= */
const LocationSearch = ({
  setCoords,
  setPickup,
  mapRef,
  inputRef,
  isSearching,
  setIsSearching,
  setSelectedPin,
  setMapMode,
  pickup,
}: any) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const timerRef = useRef<any>(null);

  const searchLocation = (text: string) => {
    setQuery(text);
    if (text.length > 0 && !isSearching) setIsSearching(true);
    if (text.length < 3) {
      setResults([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${text}&countrycodes=in`,
          { headers: { "User-Agent": "driver-app" } }
        );
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.log(err);
      }
    }, 500);
  };

  const handleSelect = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    const newCoords: Region = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setPickup(item.display_name);
    setCoords(newCoords);
    setSelectedPin({ latitude: lat, longitude: lon });
    setMapMode("idle");

    mapRef.current?.animateToRegion(newCoords, 1000);

    setResults([]);
    setQuery(item.display_name);
    setIsSearching(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputWrapper}>
        <View style={styles.searchIconDot} />
        <TextInput
          ref={inputRef}
          placeholder="Enter pickup or tap on map"
          value={query || pickup}
          onChangeText={searchLocation}
          onFocus={() => setIsSearching(true)}
          style={styles.searchInput}
          placeholderTextColor="#555"
        />
        {query || pickup ? (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setPickup("");
              setResults([]);
              setSelectedPin(null);
              setMapMode("idle");
              setIsSearching(false);
              Keyboard.dismiss();
            }}
            style={{ padding: 5 }}
          >
            <Text style={{ color: "#555", fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isSearching && Array.isArray(results) && results.length > 0 && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={Array.isArray(results) ? results : []}
            keyExtractor={(item, i) => i.toString()}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            style={{ maxHeight: 200 }}
            renderItem={({ item }) => {
              if (!item || !item.display_name) return null;

              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.resultIcon}>
                    <View style={styles.resultIconInner} />
                  </View>

                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultMainText} numberOfLines={1}>
                      {item?.display_name?.split(",")[0] || "Unknown"}
                    </Text>

                    <Text style={styles.resultSubText} numberOfLines={1}>
                      {item?.display_name || "No address"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

/* ================= FETCHING DRIVER MODAL ================= */
const FetchingDriverModal = ({
  visible,
  onCancel,
}: {
  visible: boolean;
  onCancel: () => void;
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;
  const fadeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      fadeScale.setValue(0);
      return;
    }

    Animated.timing(fadeScale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          delay: 150,
        }),
        Animated.timing(dotOpacity3, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          delay: 300,
        }),
        Animated.timing(dotOpacity1, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity2, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity3, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      pulseAnim.stopAnimation();
      rotateAnim.stopAnimation();
      dotOpacity1.stopAnimation();
      dotOpacity2.stopAnimation();
      dotOpacity3.stopAnimation();
    };
  }, [visible]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.2, 0],
  });

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Animated.View
        style={[
          styles.fetchOverlay,
          {
            opacity: fadeScale,
            transform: [{ scale: fadeScale }],
          },
        ]}
      >
        <View style={styles.fetchBackdrop} />
        <Animated.View style={styles.fetchCard}>
          <View style={styles.fetchIconContainer}>
            <Animated.View
              style={[
                styles.fetchPulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.fetchPulseRing,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2],
                      }),
                    },
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.4, 0.1, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[styles.fetchRotatingArc, { transform: [{ rotate }] }]}
            >
              <View style={styles.fetchArcSegment} />
            </Animated.View>
            <View style={styles.fetchCenterIcon}>
              <Text style={styles.fetchCarEmoji}>🚗</Text>
            </View>
          </View>

          <Text style={styles.fetchTitle}>Finding your driver</Text>
          <View style={styles.fetchDotsRow}>
            <Animated.View style={[styles.fetchDot, { opacity: dotOpacity1 }]} />
            <Animated.View style={[styles.fetchDot, { opacity: dotOpacity2 }]} />
            <Animated.View style={[styles.fetchDot, { opacity: dotOpacity3 }]} />
          </View>
          <Text style={styles.fetchSubtext}>
            Searching nearby drivers for you
          </Text>

          <View style={styles.fetchProgressTrack}>
            <Animated.View style={styles.fetchProgressFill} />
          </View>

          <View style={styles.fetchStatusRow}>
            <View style={styles.fetchStatusChip}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.fetchStatusText}>Scanning area</Text>
            </View>
            <View style={styles.fetchStatusChip}>
              <Text style={styles.fetchStatusCount}>3</Text>
              <Text style={styles.fetchStatusText}>Nearby</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.fetchCancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.fetchCancelText}>Cancel Search</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

/* ================= MAIN SCREEN ================= */

export default function UserDashboard() {
  const [pickup, setPickup] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const mapRef = useRef<MapView>(null);
  const inputRef = useRef<TextInput>(null);

  const [coords, setCoords] = useState<Region>({
    latitude: 8.5241,
    longitude: 76.9366,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const [mapMode, setMapMode] = useState<"idle" | "selecting">("idle");
  const [selectedPin, setSelectedPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const confirmButtonOpacity = useState(new Animated.Value(0))[0];
  const pinScale = useState(new Animated.Value(0))[0];

  const [isScheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isScheduled, setIsScheduled] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [bookingOtp, setBookingOtp] = useState("");

  const [isFetchingDriver, setIsFetchingDriver] = useState(false);
  const fetchTimerRef = useRef<any>(null);

  // 🔥 Confirmed state — when true, show OTP-only panel
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);

  const panTimerRef = useRef<any>(null);

  const showConfirmButtonAnimated = useCallback(() => {
    setShowConfirmButton(true);
    Animated.timing(confirmButtonOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [confirmButtonOpacity]);

  const hideConfirmButtonAnimated = useCallback(() => {
    Animated.timing(confirmButtonOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowConfirmButton(false));
  }, [confirmButtonOpacity]);

  const animatePinDrop = useCallback(() => {
    pinScale.setValue(0);
    Animated.spring(pinScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [pinScale]);

  const fetchAddressFromCoords = async (
    latitude: number,
    longitude: number
  ) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { "User-Agent": "driver-app" } }
      );
      const data = await res.json();
      if (data.display_name) {
        setPickup(data.display_name);
      }
    } catch (err) {
      console.log("Reverse Geocode Error:", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMapPress = async (event: MapPressEvent) => {
    if (isSearching) {
      setIsSearching(false);
      Keyboard.dismiss();
      return;
    }

    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedPin({ latitude, longitude });
    setMapMode("selecting");
    animatePinDrop();

    const newRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setCoords(newRegion);

    fetchAddressFromCoords(latitude, longitude);
    showConfirmButtonAnimated();
  };

  const handleConfirmLocation = () => {
    setMapMode("idle");
    hideConfirmButtonAnimated();
    Toast.show({
      type: "success",
      text1: "Pickup location set!",
      position: "bottom",
    });
  };

  const handleCancelLocation = () => {
    setSelectedPin(null);
    setPickup("");
    setMapMode("idle");
    hideConfirmButtonAnimated();
  };

  const onMapRegionChangeComplete = (region: Region) => {
    setCoords(region);

    if (mapMode === "selecting") {
      setSelectedPin({
        latitude: region.latitude,
        longitude: region.longitude,
      });

      if (panTimerRef.current) clearTimeout(panTimerRef.current);
      panTimerRef.current = setTimeout(() => {
        fetchAddressFromCoords(region.latitude, region.longitude);
      }, 500);
    }
  };

  const handleBack = () => {
    router.replace("/login");
  };

  const handleCancelFetching = () => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    setIsFetchingDriver(false);
    Toast.show({
      type: "info",
      text1: "Search cancelled",
      position: "bottom",
    });
  };

  const handleBooking = () => {
    if (!pickup) {
      Toast.show({
        type: "error",
        text1: "Please select a pickup location",
        position: "bottom",
      });
      return;
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setBookingOtp(otp);

    const scheduleData = isScheduled
      ? {
        date: selectedDate.toLocaleDateString(),
        time: selectedTime.toLocaleTimeString(),
      }
      : "Now";

    const data = {
      pickup,
      latitude: selectedPin?.latitude || coords.latitude,
      longitude: selectedPin?.longitude || coords.longitude,
      schedule: scheduleData,
      vehicleType,
      vehicleNumber,
      otp: otp,
    };

    console.log("BOOKING DATA:", data);

    setIsFetchingDriver(true);

    fetchTimerRef.current = setTimeout(() => {
      setIsFetchingDriver(false);
      setSuccessModalVisible(true);
    }, 3000);
  };

  // 🔥 Done button → show OTP-only dashboard
  const handleDone = () => {
    setSuccessModalVisible(false);
    setIsBookingConfirmed(true);
  };

  const formatDisplayTime = () => {
    if (!isScheduled) return "Now";
    const dateStr = selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const timeStr = selectedTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <View style={styles.container}>
      {/* ================= MAP ================= */}
      {Platform.OS !== "web" && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider="google"
          initialRegion={coords}
          onRegionChangeComplete={onMapRegionChangeComplete}
          onPress={handleMapPress}
          showsUserLocation
          moveOnMarkerPress={false}
          customMapStyle={darkMapStyle}
          userInterfaceStyle="dark"
        >
          {selectedPin && (
            <Marker coordinate={selectedPin} anchor={{ x: 0.5, y: 1 }}>
              <Animated.View
                style={[
                  styles.selectedMarker,
                  { transform: [{ scale: pinScale }] },
                ]}
              >
                <View style={styles.selectedMarkerPin}>
                  <View style={styles.selectedMarkerDot} />
                </View>
                <View style={styles.selectedMarkerShadow} />
              </Animated.View>
            </Marker>
          )}
        </MapView>
      )}

      {/* TAP INSTRUCTION */}
      {!selectedPin && !isSearching && !isBookingConfirmed && (
        <View style={styles.tapInstructionContainer} pointerEvents="none">
          <View style={styles.tapInstructionBox}>
            <Text style={styles.tapInstructionIcon}>👆</Text>
            <Text style={styles.tapInstructionText}>Tap to select pickup</Text>
          </View>
        </View>
      )}

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* CONFIRM LOCATION BUTTON */}
      {showConfirmButton && !isBookingConfirmed && (
        <Animated.View
          style={[
            styles.confirmLocationContainer,
            { opacity: confirmButtonOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.confirmLocationButton}
            onPress={handleConfirmLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmLocationIcon}>✓</Text>
            <Text style={styles.confirmLocationText}>Select this location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelLocationButton}
            onPress={handleCancelLocation}
          >
            <Text style={styles.cancelLocationText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ================= BOTTOM PANEL ================= */}
      <View
        style={[
          styles.panel,
          isBookingConfirmed && styles.panelConfirmed,
        ]}
      >
        <View style={styles.panelHandle} />

        {/* ========== OTP-ONLY VIEW ========== */}
        {isBookingConfirmed ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.otpPanelContent}
          >
            {/* Status badge */}
            <View style={styles.confirmedBadge}>
              <View style={styles.confirmedBadgeDot} />
              <Text style={styles.confirmedBadgeText}>RIDE CONFIRMED</Text>
            </View>

            {/* Driver arriving animation area */}
            <View style={styles.driverArrivingIconContainer}>
              <View style={styles.driverArrivingRing} />
              <View style={styles.driverArrivingRingOuter} />
              <Text style={styles.driverArrivingEmoji}>🚗</Text>
            </View>

            <Text style={styles.driverArrivingTitle}>Driver is on the way</Text>
            <Text style={styles.driverArrivingSubtext}>
              Share this code with your driver to start the ride
            </Text>

            {/* OTP Box */}
            <View style={styles.dashboardOtpBox}>
              <Text style={styles.dashboardOtpLabel}>CONFIRMATION CODE</Text>
              <Text style={styles.dashboardOtpValue}>{bookingOtp}</Text>
            </View>

            {/* Pickup info */}
            <View style={styles.dashboardPickupRow}>
              <View style={styles.dashboardPickupDot} />
              <View style={styles.dashboardPickupTextWrap}>
                <Text style={styles.dashboardPickupLabel}>Pickup</Text>
                <Text style={styles.dashboardPickupAddress} numberOfLines={2}>
                  {pickup || "Selected Location"}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.dashboardActionRow}>
              <TouchableOpacity /* ... Call Button ... */ />
              <TouchableOpacity /* ... Message Button ... */ />
              <TouchableOpacity /* ... Share Button ... */ />

              {/* --- MODIFY THIS BUTTON --- */}
              <TouchableOpacity
                style={styles.dashboardActionBtn}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/rideDetails',
                    params: {
                      pickup: pickup,
                      vehicleType: vehicleType,
                      // You can pass other data here if needed
                    },
                  });
                }}
              >
                <Text style={styles.dashboardActionIcon}>🏁</Text>
                <Text style={styles.dashboardActionLabel}>Finish</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* ========== NORMAL BOOKING VIEW ========== */
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.panelTitle}>Book your driver</Text>

            <LocationSearch
              mapRef={mapRef}
              inputRef={inputRef}
              setCoords={setCoords}
              setPickup={setPickup}
              isSearching={isSearching}
              setIsSearching={setIsSearching}
              setSelectedPin={setSelectedPin}
              setMapMode={setMapMode}
              pickup={pickup}
            />

            {loadingAddress && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>
                  Fetching location address...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.scheduleRow}
              onPress={() => setScheduleModalVisible(true)}
            >
              <View style={styles.scheduleIconContainer}>
                <Text style={{ fontSize: 20 }}>🕐</Text>
              </View>
              <View style={styles.scheduleTextContainer}>
                <Text style={styles.scheduleLabel}>When</Text>
                <Text style={styles.scheduleValue}>{formatDisplayTime()}</Text>
              </View>
              <Text style={styles.scheduleChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Choose Service</Text>
            <View style={styles.vehicleChipsRow}>
              {["Mini", "Sedan", "SUV", "Luxury"].map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.vehicleChip,
                    vehicleType === name && styles.activeVehicleChip,
                  ]}
                  onPress={() => setVehicleType(name)}
                >
                  <Text
                    style={[
                      styles.vehicleChipText,
                      vehicleType === name && styles.activeVehicleChipText,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Vehicle Number</Text>
            <TextInput
              placeholder="KL-01-XXXX"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              style={styles.input}
              placeholderTextColor="#555"
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleBooking}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {isScheduled ? "Schedule Ride" : "Confirm Driver"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ================= SCHEDULE MODAL ================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isScheduleModalVisible}
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set pickup time</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setIsScheduled(false);
                setScheduleModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>Now</Text>
              {!isScheduled && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setIsScheduled(true);
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.modalOptionText}>Schedule for later</Text>
              {isScheduled && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            {isScheduled && (
              <View style={styles.scheduledInfoBox}>
                <View style={styles.scheduledInfoRow}>
                  <Text style={styles.scheduledInfoLabel}>Date:</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.scheduledInfoValue}>
                      {selectedDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.scheduledInfoRow, { marginBottom: 0 }]}>
                  <Text style={styles.scheduledInfoLabel}>Time:</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                    <Text style={styles.scheduledInfoValue}>
                      {selectedTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, { marginTop: 20 }]}
              onPress={() => setScheduleModalVisible(false)}
            >
              <Text style={styles.confirmButtonText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= FETCHING DRIVER MODAL ================= */}
      <FetchingDriverModal
        visible={isFetchingDriver}
        onCancel={handleCancelFetching}
      />

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSuccessModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>🎉</Text>
            </View>
            <Text style={styles.successTitle}>Ride Confirmed!</Text>
            <Text style={styles.successSubtext}>
              Your driver is on the way.
            </Text>

            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>Share this OTP to start ride</Text>
              <Text style={styles.otpText}>{bookingOtp}</Text>
            </View>

            <View style={styles.successInfoRow}>
              <Text style={styles.successInfoIcon}>📍</Text>
              <Text style={styles.successInfoText} numberOfLines={2}>
                {pickup || "Selected Location"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={handleDone}
            >
              <Text style={styles.successDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          onChange={(e, selected) => {
            setShowDatePicker(false);
            if (selected) {
              setSelectedDate(selected);
              setShowTimePicker(true);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          onChange={(e, selected) => {
            setShowTimePicker(false);
            if (selected) setSelectedTime(selected);
          }}
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Selected Marker
  selectedMarker: {
    alignItems: "center",
  },
  selectedMarkerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
  },
  selectedMarkerShadow: {
    width: 12,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    marginTop: 5,
  },

  // Tap Instruction
  tapInstructionContainer: {
    position: "absolute",
    top: "50%",
    left: "70%",
    marginLeft: -100,
    marginTop: -60,
    zIndex: 10,
  },
  tapInstructionBox: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  tapInstructionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tapInstructionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
  },

  // Confirm Location
  confirmLocationContainer: {
    position: "absolute",
    bottom: "42%",
    left: 20,
    right: 20,
    zIndex: 20,
    alignItems: "center",
  },
  confirmLocationButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: "100%",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmLocationIcon: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  confirmLocationText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelLocationButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  cancelLocationText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  loadingText: {
    marginLeft: 10,
    color: "#666",
    fontSize: 14,
  },

  // Back Button
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 22,
    color: "#fff",
    marginTop: -2,
  },

  // Bottom Panel
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingTop: 10,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
  },
  panelConfirmed: {
    maxHeight: "75%",
  },
  panelHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#333",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#fff",
    paddingHorizontal: 20,
  },

  // Search
  searchContainer: {
    marginBottom: 15,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  dropdownContainer: {
    backgroundColor: "#0a0a0a",
    marginTop: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  resultIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  resultIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#888",
  },
  resultTextContainer: { flex: 1 },
  resultMainText: { fontWeight: "600", fontSize: 15, color: "#fff" },
  resultSubText: { fontSize: 13, color: "#555", marginTop: 2 },

  // Schedule
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  scheduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  scheduleTextContainer: { flex: 1 },
  scheduleLabel: { fontSize: 14, color: "#555" },
  scheduleValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginTop: 2,
  },
  scheduleChevron: { fontSize: 24, color: "#444", marginLeft: 10 },

  // Vehicle Type Chips
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
    paddingHorizontal: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  vehicleChipsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    marginHorizontal: 20,
    gap: 10,
  },
  vehicleChip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  activeVehicleChip: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  vehicleChipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  activeVehicleChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },

  // Input
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  // Confirm Button
  confirmButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 120,
  },
  confirmButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Schedule Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#333",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#fff",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#fff",
  },
  checkMark: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  scheduledInfoBox: {
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  scheduledInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  scheduledInfoLabel: {
    fontWeight: "600",
    color: "#888",
  },
  scheduledInfoValue: {
    color: "#fff",
  },

  // ================= FETCHING DRIVER MODAL =================
  fetchOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  fetchBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  fetchCard: {
    width: width * 0.88,
    backgroundColor: "#0a0a0a",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  fetchIconContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    position: "relative",
  },
  fetchPulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  fetchRotatingArc: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: "#fff",
    borderRightColor: "rgba(255,255,255,0.3)",
  },
  fetchArcSegment: {
    display: "none",
  },
  fetchCenterIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  fetchCarEmoji: {
    fontSize: 28,
  },
  fetchTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  fetchDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    height: 12,
    gap: 6,
  },
  fetchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  fetchSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  fetchProgressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  fetchProgressFill: {
    width: "45%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  fetchStatusRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  fetchStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  fetchStatusText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  fetchStatusCount: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
    minWidth: 12,
    textAlign: "center",
  },
  fetchCancelButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
  },
  fetchCancelText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
  },

  // ================= SUCCESS MODAL =================
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  successCard: {
    width: width * 0.85,
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  successIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  successIcon: {
    fontSize: 36,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  successSubtext: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
  },
  otpBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  otpLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  otpText: {
    fontSize: 40,
    fontWeight: "bold",
    letterSpacing: 10,
    color: "#fff",
  },
  successInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    width: "100%",
  },
  successInfoIcon: {
    marginRight: 10,
    fontSize: 18,
  },
  successInfoText: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  successDoneBtn: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  successDoneBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ================= CONFIRMED DASHBOARD (OTP ONLY) =================
  otpPanelContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: "center",
  },

  // Green status badge
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    marginBottom: 28,
  },
  confirmedBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  confirmedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22c55e",
    letterSpacing: 1.5,
  },

  // Driver arriving icon area
  driverArrivingIconContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  driverArrivingRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  driverArrivingRingOuter: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  driverArrivingEmoji: {
    fontSize: 42,
  },

  driverArrivingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  driverArrivingSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },

  // Big OTP box on dashboard
  dashboardOtpBox: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  dashboardOtpLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    letterSpacing: 2,
    marginBottom: 10,
  },
  dashboardOtpValue: {
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: 14,
    color: "#fff",
  },

  // Pickup row
  dashboardPickupRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    borderRadius: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dashboardPickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginTop: 5,
    marginRight: 14,
  },
  dashboardPickupTextWrap: {
    flex: 1,
  },
  dashboardPickupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    letterSpacing: 1,
    marginBottom: 4,
  },
  dashboardPickupAddress: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },

  // Action buttons row
  dashboardActionRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  dashboardActionBtn: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dashboardActionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  dashboardActionLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});