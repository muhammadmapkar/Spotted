import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Coords } from './distance';

// Gives the user's position, or null if location is not allowed (or not known yet).
// It never shows a permission pop-up: onboarding does that.
export function useUserLocation(): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') {
            if (!cancelled) setCoords(null);
            return;
          }
          // First the quick "last known" position, then a fresher one.
          const last = await Location.getLastKnownPositionAsync();
          if (last && !cancelled) setCoords(last.coords);
          const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!cancelled) setCoords(now.coords);
        } catch {
          // Location unavailable: the app just works without distances.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return coords;
}
