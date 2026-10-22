import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { hrefForAlert } from '../alerts/links';
import { onDataChanged } from '../db/changes';
import { syncGeofencing } from './sync';

// Lives inside the app (renders nothing) and does two jobs:
//  1. Keeps the phone watching the right places, whenever something changes.
//  2. Opens the place when you tap a "A place you saved is ... away" alert.
export function GeofenceManager() {
  const router = useRouter();

  // Job 1: keep the watched places up to date.
  useEffect(() => {
    syncGeofencing(); // when the app opens

    // When places or settings change. We wait a second so a burst of changes runs once.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopListening = onDataChanged(() => {
      clearTimeout(timer);
      timer = setTimeout(syncGeofencing, 1000);
    });

    // When you come back to the app (you may have changed a permission in phone settings).
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncGeofencing();
    });

    return () => {
      clearTimeout(timer);
      stopListening();
      appState.remove();
    };
  }, []);

  // Job 2: a notification was tapped.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!lastResponse) return;
    const { identifier, content } = lastResponse.notification.request;
    if (handled.current === identifier) return; // already opened
    handled.current = identifier;

    // A saved Spotted place opens the Place page; a place saved from a reel opens its own page.
    const href = hrefForAlert(content.data);
    if (href) {
      // A tiny pause makes sure the app's screens are ready first.
      setTimeout(() => router.push(href as never), 250);
    }
  }, [lastResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
