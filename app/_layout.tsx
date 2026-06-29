import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen'; // <-- THIS IMPORT WAS MISSING
import 'react-native-reanimated';
import Toast from "react-native-toast-message";
import { useColorScheme } from '@/hooks/use-color-scheme';
import AnimatedSplash from '@/components/AnimatedSplash';
import { useState } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the native splash screen from auto-hiding immediately
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);

  // This function is called when our custom scaling animation finishes
  const handleSplashAnimationComplete = async () => {
    try {
      // Hide the native splash screen smoothly
      await SplashScreen.hideAsync();
    } catch (e) {
      console.warn('Error hiding splash screen', e);
    } finally {
      // Tell the app it's ready to render the router
      setAppReady(true);
    }
  };

  // While the animation is running, show ONLY the animated logo
  if (!appReady) {
    return <AnimatedSplash onFinish={handleSplashAnimationComplete} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerShown :false
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast /> 
    </ThemeProvider>
  );
}