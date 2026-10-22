import { Alert } from 'react-native';

import { PRIVACY_POLICY_URL } from './config';
import { openLink } from './openLink';

// The privacy policy and terms links (used in Settings and on the sign-in screen).
export function openPrivacyPolicy(): void {
  if (PRIVACY_POLICY_URL) openLink(PRIVACY_POLICY_URL);
  else Alert.alert('Privacy policy', 'Our privacy policy page is coming soon.');
}

export function openTerms(): void {
  Alert.alert('Terms of use', 'Our terms page is coming soon.');
}
