import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// What the user has allowed so far.
export interface PermissionState {
  location: boolean; // location while the app is open
  background: boolean; // location "all the time" (needed to remind you when the app is closed)
  notifications: boolean;
}

// Reminders only work when all three are allowed.
export function remindersWork(state: PermissionState): boolean {
  return state.location && state.background && state.notifications;
}

// Every function below catches errors, so a refused or unsupported permission
// can never crash the app. It just counts as "not allowed".
async function safe(check: () => Promise<boolean>): Promise<boolean> {
  try {
    return await check();
  } catch {
    return false;
  }
}

// Look at the current permissions WITHOUT showing any pop-up.
export async function getPermissionState(): Promise<PermissionState> {
  return {
    location: await safe(async () => (await Location.getForegroundPermissionsAsync()).status === 'granted'),
    background: await safe(async () => (await Location.getBackgroundPermissionsAsync()).status === 'granted'),
    notifications: await safe(async () => (await Notifications.getPermissionsAsync()).status === 'granted'),
  };
}

// Ask for location while the app is open.
export function requestLocation(): Promise<boolean> {
  return safe(async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted');
}

// Ask for "Allow all the time". The phone must already have allowed the first one.
export function requestBackgroundLocation(): Promise<boolean> {
  return safe(async () => (await Location.requestBackgroundPermissionsAsync()).status === 'granted');
}

// Ask to show notifications.
export function requestNotifications(): Promise<boolean> {
  return safe(async () => {
    if (Platform.OS === 'android') {
      // Android 13+ only shows the question once a notification channel exists.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Nearby reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    return (await Notifications.requestPermissionsAsync()).status === 'granted';
  });
}
