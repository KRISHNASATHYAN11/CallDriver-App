import { useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function DriverOnboarding() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [license, setLicense] = useState("");

  const handleNext = () => {
    if (!name || !age || !license) {
      alert("Fill all fields");
      return;
    }

    if (parseInt(age) < 18) {
      alert("Must be 18+");
      return;
    }

    router.push("/driver-face");
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Name</Text>
      <TextInput style={{ borderWidth: 1 }} value={name} onChangeText={setName} />

      <Text>Age</Text>
      <TextInput style={{ borderWidth: 1 }} value={age} onChangeText={setAge} />

      <Text>License</Text>
      <TextInput style={{ borderWidth: 1 }} value={license} onChangeText={setLicense} />

      <TouchableOpacity onPress={handleNext} style={{ backgroundColor: "blue", padding: 15, marginTop: 20 }}>
        <Text style={{ color: "#fff" }}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}