// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "CallDriver",
  slug: "CallDriver",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/splash-icon.png",
  scheme: "calldriver",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.calldriver.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "CallDriver needs your location to show your pickup point on the map and connect you with nearby drivers.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "CallDriver needs your location to provide real-time ride tracking and ensure pickup accuracy.",
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
      NSCameraUsageDescription:
        "CallDriver needs camera access to take profile photos.",
      NSPhotoLibraryUsageDescription:
        "CallDriver needs photo library access to select profile pictures.",
    },
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/splash-icon.png",
      backgroundImage: "./assets/images/splash-icon.png",
      monochromeImage: "./assets/images/splash-icon.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.anonymous.CallDriver",
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "RECORD_AUDIO",
      "NOTIFICATIONS",
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      },
    },
  },

  web: {
    output: "static" as const,
    favicon: "./assets/images/splash-icon.png",
    bundler: "metro",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 300,
        resizeMode: "contain" as const,
        backgroundColor: "#000000",
      },
    ],
    "@react-native-community/datetimepicker",
    "expo-audio",
    "expo-video",
    "expo-secure-store",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "CallDriver needs your location to provide real-time ride tracking and ensure pickup accuracy.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/splash-icon.png",
        color: "#000000",
      },
    ],
    "expo-image-picker",
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: "your-eas-project-id",
    },
  },
});