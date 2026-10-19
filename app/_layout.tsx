import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { getOnboardingDone, resetOnboarding, setOnboardingDone } from '@/src/db';
import { OnboardingContext } from '@/src/onboarding/OnboardingContext';
import { ShareIntentHandler } from '@/src/share/ShareIntentHandler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Start on the tabs screen.
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

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

  const ready = loaded && onboardingDone !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={{ finish, restart }}>
      <RootLayoutNav onboardingDone={onboardingDone} />
    </OnboardingContext.Provider>
  );
}

function RootLayoutNav({ onboardingDone }: { onboardingDone: boolean }) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* First launch only: welcome slides, then permissions */}
        <Stack.Protected guard={!onboardingDone}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="permissions" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>

        {/* The real app */}
        <Stack.Protected guard={onboardingDone}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
          <Stack.Screen name="add-place" options={{ title: 'Add place', presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>

      {/* Opens Add Place when a reel is shared to Spotted (after onboarding) */}
      {onboardingDone ? <ShareIntentHandler /> : null}
    </ThemeProvider>
  );
}
