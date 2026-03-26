import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { useRef } from "react";

export default function DriverFace() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <Text>Loading...</Text>;

  if (!permission.granted) {
    return (
      <View>
        <Text>Need Camera Permission</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Grant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    const photo = await cameraRef.current.takePictureAsync();
    console.log(photo);
    router.push("/driver-license");
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

      <TouchableOpacity
        onPress={takePhoto}
        style={{
          position: "absolute",
          bottom: 40,
          alignSelf: "center",
          backgroundColor: "blue",
          padding: 20,
        }}
      >
        <Text style={{ color: "#fff" }}>Capture Face</Text>
      </TouchableOpacity>
    </View>
  );
}