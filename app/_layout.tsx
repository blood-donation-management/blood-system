import { useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenCapture from 'expo-screen-capture';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  // Allow screenshots to be taken throughout the app
  useEffect(() => {
    ScreenCapture.allowScreenCaptureAsync();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/admin-login" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* Ensure system status bar is visible and readable over light backgrounds */}
      <StatusBar style="dark" />
    </>
  );
}