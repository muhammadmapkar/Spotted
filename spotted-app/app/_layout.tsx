import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StoreProvider, useStore } from '../src/store';
import { font, useTheme } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Shell() {
  const c = useTheme();
  const { ready } = useStore();
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, ready]);
  if (!fontsLoaded || !ready) return null;
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: c.bg }, headerTintColor: c.primary, headerTitleStyle: { fontFamily: font.semi, color: c.text }, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="spot-it" options={{ presentation: 'modal', title: 'Spot it' }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
        <Stack.Screen name="rewards" options={{ title: 'Rewards' }} />
        <Stack.Screen name="my-page" options={{ title: 'Your Spotted page' }} />
      </Stack>
    </>
  );
}

export default function Root() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
