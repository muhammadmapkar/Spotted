import { useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { reelLinkFromText } from './links';
import { rememberPendingShare, takePendingShare } from './pendingShare';

// Listens for links shared to Spotted from other apps (like Instagram's Share button).
// When one arrives, it opens Add Place with the reel link already attached.
// If it arrives during the welcome / permission screens, the link is remembered and Add Place
// opens as soon as onboarding is finished (so a reel shared on the very first launch is not lost).
// This renders nothing. It only works in a development build, not in Expo Go
// (there the share feature simply never fires, and nothing breaks).
export function ShareIntentHandler({ onboardingDone }: { onboardingDone: boolean }) {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  // A tiny pause makes sure the app's screens are ready before we move.
  // IMPORTANT: we must NOT cancel this timer when an effect re-runs. Marking the share
  // as handled changes `hasShareIntent`, which re-runs the effect, and a cancel
  // would stop the screen from ever opening.
  const openAddPlace = (link: string) => {
    setTimeout(() => {
      router.push({ pathname: '/add-place', params: { reelUrl: link } } as never);
    }, 250);
  };

  useEffect(() => {
    if (!hasShareIntent) return;

    const link = reelLinkFromText(shareIntent.webUrl ?? shareIntent.text ?? '');
    resetShareIntent(); // so the same share is not handled twice

    if (!link) {
      Alert.alert('No link found', 'What you shared did not contain a link. Try sharing the reel again.');
      return;
    }
    if (!onboardingDone) {
      rememberPendingShare(link); // opened later, see the effect below
      return;
    }
    openAddPlace(link);
  }, [hasShareIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Onboarding just finished: open Add Place with the link that was shared earlier (if any).
  useEffect(() => {
    if (!onboardingDone) return;
    const link = takePendingShare();
    if (link) openAddPlace(link);
  }, [onboardingDone]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
