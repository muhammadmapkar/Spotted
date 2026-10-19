import { useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { reelLinkFromText } from './links';

// Listens for links shared to Spotted from other apps (like Instagram's Share button).
// When one arrives, it opens Add Place with the reel link already attached.
// This renders nothing. It only works in a development build, not in Expo Go
// (there the share feature simply never fires, and nothing breaks).
export function ShareIntentHandler() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (!hasShareIntent) return;

    const link = reelLinkFromText(shareIntent.webUrl ?? shareIntent.text ?? '');
    resetShareIntent(); // so the same share is not handled twice

    // A tiny pause makes sure the app's screens are ready before we move.
    const timer = setTimeout(() => {
      if (link) {
        router.push({ pathname: '/add-place', params: { reelUrl: link } } as never);
      } else {
        Alert.alert('No link found', 'What you shared did not contain a link. Try sharing the reel again.');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [hasShareIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
