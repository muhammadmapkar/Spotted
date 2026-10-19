import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { SavedPlace } from '../db/types';
import { notificationBody } from './rules';

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

// Show the "You're near ..." notification. Tapping it opens the place
// (the place id travels inside the notification as `data`).
// delaySeconds is only used for testing, so you have time to close the app.
export async function sendNearbyNotification(place: SavedPlace, delaySeconds = 0): Promise<void> {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Spotted',
      body: notificationBody(place),
      data: { placeId: place.id },
    },
    trigger:
      delaySeconds > 0
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds, channelId: CHANNEL_ID }
        : null,
  });
}
