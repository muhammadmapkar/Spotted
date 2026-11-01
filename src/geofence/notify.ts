import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { SavedPlace } from '../db/types';
import { ACTION_NOT_NOW, ACTION_VISITED, NEARBY_CATEGORY } from './actions';
import { notificationBody } from './rules';

const CHANNEL_ID = 'default';

// Android needs a "channel" before it will show notifications.
// We also register the two reminder buttons. They work without opening the app.
async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Nearby reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  try {
    await Notifications.setNotificationCategoryAsync(NEARBY_CATEGORY, [
      { identifier: ACTION_VISITED, buttonTitle: "I've been here", options: { opensAppToForeground: false } },
      { identifier: ACTION_NOT_NOW, buttonTitle: 'Not now', options: { opensAppToForeground: false } },
    ]);
  } catch {
    // Buttons are a nice extra. The reminder still shows without them.
  }
}

// Hide one reminder (used after a button on it was tapped). Never throws.
export async function dismissReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch {
    // Already gone: fine.
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

// "Remind me at a time": a reminder at a date the user chose. Tapping it opens the place.
// Returns the phone's id for it, so it can be cancelled later.
export async function scheduleTimedReminder(place: SavedPlace, date: Date): Promise<string> {
  await ensureChannel();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Spotted ⏰',
      body: `Time to try ${place.name}! You planned to go today.`,
      data: { placeId: place.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
  });
}

// Cancel a timed reminder that has not gone off yet. Never throws.
export async function cancelTimedReminder(notificationId: string | undefined): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already gone off or already cancelled: fine.
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
      categoryIdentifier: NEARBY_CATEGORY, // shows the "I've been here" and "Not now" buttons
    },
    trigger:
      delaySeconds > 0
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds, channelId: CHANNEL_ID }
        : null,
  });
}
