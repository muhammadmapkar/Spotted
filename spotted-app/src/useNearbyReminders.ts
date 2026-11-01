import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { metres } from './geo';
import { useStore } from './store';

const NEAR_M = 300;
const DAY = 24 * 60 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

// Foreground-only: watches position while the app is open and fires a local notification
// when a to-visit place is within 300 m. Max one per place per day, none from 11pm to 8am.
// Reminders while the app is closed need a background geofencing task and a dev build.
export function useNearbyReminders() {
  const { toVisit, lastReminded, markReminded, placeOf } = useStore();
  const ref = useRef({ toVisit, lastReminded, markReminded, placeOf });
  ref.current = { toVisit, lastReminded, markReminded, placeOf };
  const active = toVisit.length > 0;

  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      const notif = await Notifications.getPermissionsAsync();
      if (perm.status !== 'granted' || notif.status !== 'granted' || cancelled) return;
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 50 }, (pos) => {
        const hour = new Date().getHours();
        if (hour >= 23 || hour < 8) return;
        const { toVisit, lastReminded, markReminded, placeOf } = ref.current;
        for (const id of toVisit) {
          const p = placeOf(id);
          if (!p) continue;
          if (Date.now() - (lastReminded[id] ?? 0) < DAY) continue;
          if (metres(pos.coords, { latitude: p.lat, longitude: p.lng }) <= NEAR_M) {
            markReminded(id);
            Notifications.scheduleNotificationAsync({
              content: { title: 'Spotted', body: `You're near ${p.name}, which you saved!` },
              trigger: null,
            }).catch(() => {});
          }
        }
      });
    })().catch(() => {});
    return () => { cancelled = true; sub?.remove(); };
  }, [active]);
}
