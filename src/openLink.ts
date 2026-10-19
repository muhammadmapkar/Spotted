import { Alert, Linking } from 'react-native';

// Opens a web link (or the phone's settings) and never crashes if it can't.
// If nothing on the phone can open it, the user sees a friendly message instead.
export async function openLink(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open the link', 'Your phone could not open this link. Please try again later.');
  }
}

export async function openPhoneSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert('Could not open settings', 'Please open your phone settings and find Spotted under Apps.');
  }
}

// Opens Google Maps with directions to a place. A plain web link, so it needs no key.
// It opens the Google Maps app if it is installed, or the browser otherwise.
export function openDirections(place: { latitude: number; longitude: number }): Promise<void> {
  return openLink(`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`);
}
