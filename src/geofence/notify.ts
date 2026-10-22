import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Place, recsFor } from '../data/mock';
import { SavedPlace } from '../db/types';
import { alertBody, alertTitle } from './rules';

const CHANNEL_ID = 'default';

// Android needs a "channel" before it will show notifications.
async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Nearby reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// Remove every reminder that is waiting to appear or is still showing.
// Used by "Delete all my data". Never throws.
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // Nothing to remove, or notifications are not available: that's fine.
  }
}

async function show(title: string, body: string, data: Record<string, string>, delaySeconds: number): Promise<void> {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger:
      delaySeconds > 0
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds, channelId: CHANNEL_ID }
        : null,
  });
}

// "A place you saved is 280 m away" for a place saved from a reel. Tapping it opens the place
// (the place id travels inside the notification as `data`).
// delaySeconds is only used for testing, so you have time to close the app.
export async function sendNearbyNotification(place: SavedPlace, distanceMeters: number | null = null, delaySeconds = 0): Promise<void> {
  await show(alertTitle(distanceMeters), alertBody(place.name, 0), { placeId: place.id }, delaySeconds);
}

// "A place you saved is 1.2 km away" / "Saffron Lane . 5 influencers recommend it" for a saved Spotted place.
// Tapping it opens the Place page.
export async function sendVenueAlert(place: Place, distanceMeters: number | null, delaySeconds = 0): Promise<void> {
  await show(alertTitle(distanceMeters), alertBody(place.name, recsFor(place.id).length), { venueId: place.id }, delaySeconds);
}
