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
