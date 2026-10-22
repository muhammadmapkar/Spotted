import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { GeofenceManager } from '@/src/geofence/GeofenceManager';
import { ThemePreference, getOnboardingDone, getThemePreference, resetOnboarding, setOnboardingDone } from '@/src/db';
import { OnboardingContext } from '@/src/onboarding/OnboardingContext';
import { ShareIntentHandler } from '@/src/share/ShareIntentHandler';
import { POPPINS } from '@/src/theme/fonts';
import { SpottedThemeProvider, applyThemePreference } from '@/src/theme/ThemeProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Start on the tabs screen.
  anchor: '(tabs)',
};

// Spotted's look for headers, back buttons and backgrounds (coral accent, our text colour),
// in light and dark mode. Without this the app would use Expo's default blue.
const SpottedLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};
const SpottedDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load the Poppins font (5 weights). The splash screen stays up until it is ready.
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });
  // If a font ever fails to load, carry on with the phone's own font instead of crashing.
  const loaded = fontsLoaded || !!fontError;

  // The user's saved Light / Dark / "follow my phone" choice (null = still loading).
  const [themePreference, setThemePref] = useState<ThemePreference | null>(null);
  useEffect(() => {
    getThemePreference()
      .then((preference) => {
        applyThemePreference(preference); // before the first screen shows, so there is no flash
        setThemePref(preference);
      })
      .catch(() => setThemePref('system'));
  }, []);

  // Has the user already been through the welcome screens? (null = still checking)
  const [onboardingDone, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    getOnboardingDone()
      .then(setDone)
      .catch(() => setDone(false));
  }, []);

  const finish = useCallback(async () => {
    await setOnboardingDone();
    setDone(true);
  }, []);

  // Testing only (used by a button in Settings while developing).
  const restart = useCallback(async () => {
    await resetOnboarding();
    setDone(false);
  }, []);

  const ready = loaded && onboardingDone !== null && themePreference !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <SpottedThemeProvider initialPreference={themePreference}>
      <OnboardingContext.Provider value={{ finish, restart }}>
        <RootLayoutNav onboardingDone={onboardingDone} />
      </OnboardingContext.Provider>
    </SpottedThemeProvider>
  );
}

function RootLayoutNav({ onboardingDone }: { onboardingDone: boolean }) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? SpottedDark : SpottedLight}>
      {/* Phone status bar (clock, battery): light icons in dark mode, dark icons in light mode */}
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTitleStyle: { fontFamily: POPPINS.semiBold } }}>
        {/* First launch only: welcome slides, then permissions */}
        <Stack.Protected guard={!onboardingDone}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="permissions" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>

        {/* The real app */}
        <Stack.Protected guard={onboardingDone}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
          <Stack.Screen name="collections" options={{ title: 'Collections' }} />
          <Stack.Screen name="add-place" options={{ title: 'Add place', presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>

      {/* Opens Add Place when a reel is shared to Spotted (after onboarding) */}
      {onboardingDone ? <ShareIntentHandler /> : null}

      {/* Watches your saved places and opens one when you tap a reminder */}
      {onboardingDone ? <GeofenceManager /> : null}
    </ThemeProvider>
  );
}
