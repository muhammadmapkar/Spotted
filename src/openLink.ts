import { Alert, Linking } from 'react-native';

import { updatePlace } from './db';

// Opens a web link (or the phone's settings) and never crashes if it can't.
// If nothing on the phone can open it, the user sees a friendly message instead.
export async function openLink(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open the link', 'Your phone could not open this link. Please try again later.');
  }
}

// Opens the reel saved with a place. If the phone cannot open it, the user sees a friendly message
// with the choice to remove the broken link from the place (the place itself is kept).
// `onRemoved` runs after the link was removed, so the screen can refresh.
export async function openReel(place: { id: string; reelUrl?: string }, onRemoved?: () => void): Promise<void> {
  if (!place.reelUrl) return;
  try {
    await Linking.openURL(place.reelUrl);
  } catch {
    Alert.alert(
      "This reel won't open",
      'The link may be broken, or the reel may have been deleted. You can remove the link from this place. The place stays saved.',
      [
        { text: 'Keep link', style: 'cancel' },
        {
          text: 'Remove link',
          style: 'destructive',
          onPress: async () => {
            try {
              await updatePlace(place.id, { reelUrl: undefined });
              onRemoved?.();
            } catch {
              Alert.alert('Could not remove the link', 'Please try again.');
            }
          },
        },
      ]
    );
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
