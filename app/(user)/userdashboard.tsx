import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

/* ================= SEARCH ================= */

const LocationSearch = ({ setCoords, setPickup }: any) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [timer, setTimer] = useState<any>(null);

  const searchLocation = (text: string) => {
    setQuery(text);
    if (timer) clearTimeout(timer);

    const newTimer = setTimeout(async () => {
      if (text.length < 3) return setResults([]);
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

    setTimer(newTimer);
  };

  return (
    <View style={styles.searchBox}>
      <TextInput
        placeholder="Enter pickup point"
        value={query}
        onChangeText={searchLocation}
        style={styles.searchInput}
      />

      {results.length > 0 && (
        <FlatList
          style={styles.dropdown}
          data={results}
          keyExtractor={(item, i) => i.toString()}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => {
                setPickup(item.display_name);
                setCoords({
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
                setResults([]);
                setQuery(item.display_name);
              }}
            >
              <Text>{item.display_name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

/* ================= MAIN ================= */

export default function UserDashboard() {
  const [pickup, setPickup] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const [coords, setCoords] = useState<Region>({
    latitude: 8.5241,
    longitude: 76.9366,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedDateType, setSelectedDateType] = useState("today");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  /* ===== BACK BUTTON ===== */
  const handleBack = () => {
    router.replace("/login"); // go to login page
  };

  const handleBooking = () => {
    const data = {
      pickup,
      latitude: coords.latitude,
      longitude: coords.longitude,
      date,
      time,
      vehicleType,
      vehicleNumber,
    };

    console.log("BOOKING DATA:", data);
    Toast.show({
  type: "success",
  text1: "Ride Booked 🚗",
  text2: "Driver will reach you soon 💙",
   position: "top",
  topOffset: 100,  
});
  };

  return (
    <View style={{ flex: 1 }}>
      {/* UPDATED HEADER ROW: Back Button + Search Bar */}
      <View style={styles.headerRow}>
        {/* 1/5 Part: Back Button */}
        <TouchableOpacity style={styles.backButtonWrapper} onPress={handleBack}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>

        {/* 4/5 Part: Search Bar */}
        <View style={styles.searchContainer}>
          <LocationSearch setCoords={setCoords} setPickup={setPickup} />
        </View>
      </View>

      {/* MAP */}
      {Platform.OS !== "web" && (
        <MapView
          style={styles.map}
          region={coords}
          onRegionChangeComplete={(region) => setCoords(region)}
        >
          <Marker coordinate={coords} />
        </MapView>
      )}

      {/* BOTTOM PANEL */}
      <LinearGradient colors={["#ffffff", "#e6f0ff"]} style={styles.panel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* DATE */}
          <Text style={styles.heading}>Date</Text>
          <View style={styles.row}>
            {["today", "tomorrow", "custom"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionBtn,
                  selectedDateType === type && styles.activeBtn,
                ]}
                onPress={() => {
                  setSelectedDateType(type);
                  if (type === "tomorrow") {
                    const t = new Date();
                    t.setDate(t.getDate() + 1);
                    setDate(t);
                  }
                  if (type === "custom") setShowDatePicker(true);
                }}
              >
                <Text
                  style={{
                    color: selectedDateType === type ? "#fff" : "#000",
                  }}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(e, selected) => {
                setShowDatePicker(false);
                if (selected) setDate(selected);
              }}
            />
          )}

          {/* TIME */}
          <Text style={styles.heading}>Time</Text>
          <TouchableOpacity
            style={styles.timeBox}
            onPress={() =>
              selectedDateType === "today"
                ? setTime(new Date())
                : setShowTimePicker(true)
            }
          >
            <Text>
              {selectedDateType === "today"
                ? "NOW"
                : time.toLocaleTimeString()}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              onChange={(e, selected) => {
                setShowTimePicker(false);
                if (selected) setTime(selected);
              }}
            />
          )}

          {/* CAR TYPE */}
          <Text style={styles.heading}>Select Car Type</Text>
          <View style={styles.carContainer}>
            {["Mini", "Sedan", "SUV", "Luxury"].map((car) => (
              <TouchableOpacity
                key={car}
                style={[
                  styles.carCard,
                  vehicleType === car && styles.activeCar,
                ]}
                onPress={() => setVehicleType(car)}
              >
                <Text
                  style={[
                    styles.carText,
                    vehicleType === car && { color: "#fff" },
                  ]}
                >
                  {car}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* VEHICLE NUMBER */}
          <Text style={styles.heading}>Vehicle Number</Text>
          <TextInput
            placeholder="KL-01-XXXX"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            style={styles.input}
          />

          {/* BUTTON */}
          <TouchableOpacity onPress={handleBooking}>
            <LinearGradient
              colors={["#007bff", "#00c6ff"]}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Pick Now</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Extra space at bottom to ensure scroll works well */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  map: { flex: 1 },

  // HEADER ROW
  headerRow: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 20,
  },

  backButtonWrapper: {
    width: 45,
    height: 45,
    backgroundColor: "#fff",
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },

  backBtn: {
    color: "#007bff",
    fontSize: 22,
    fontWeight: "bold",
  },

  searchContainer: {
    flex: 1,
    zIndex: 10,
  },

  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },

  searchInput: {
    height: 45,
    paddingHorizontal: 10,
  },

  dropdown: {
    maxHeight: 200,
    backgroundColor: "#fff",
  },

  resultItem: {
    padding: 10,
    borderBottomWidth: 0.5,
  },

  // --- MODIFIED PANEL STYLE ---
  panel: {
    position: "absolute",
    // Calculation: TabBar Bottom (35) + TabBar Height (70) + Buffer (15) = 120
    bottom: 120, 
    left: 0,
    right: 0,
    width: "100%",
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "55%", // Reduced slightly to ensure map is still visible
  },

  heading: {
    fontWeight: "bold",
    marginVertical: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  optionBtn: {
    padding: 10,
    backgroundColor: "#eef5ff",
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },

  activeBtn: {
    backgroundColor: "#007bff",
  },

  timeBox: {
    padding: 12,
    backgroundColor: "#eef5ff",
    borderRadius: 8,
    alignItems: "center",
  },

  carContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },

  carCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    backgroundColor: "#eef5ff",
    borderRadius: 10,
    alignItems: "center",
  },

  activeCar: {
    backgroundColor: "#007bff",
  },

  carText: {
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "#eef5ff",
    padding: 10,
    borderRadius: 8,
  },

  button: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});