import { saveSettings } from '../db/settings';
import { getPermissionState, requestBackgroundLocation, requestLocation, requestNotifications } from '../permissions';

// Turning on "Nearby saved-place alerts". The phone's questions come in this order:
//   1. location "while using the app"  (if it was not allowed yet)
//   2. location "all the time"         (ONLY now, because the user asked for alerts; after our own explanation)
//   3. notifications
// 'on' = everything allowed and the alerts are switched on. The others say what is missing, so the screen can
// explain it in plain words and offer the phone's settings.
export type EnableResult = 'on' | 'declined' | 'need-always' | 'need-notifications';

export async function turnOnNearbyAlerts(confirmAlways: () => Promise<boolean>): Promise<EnableResult> {
  const state = await getPermissionState();

  if (!state.location && !(await requestLocation())) return 'declined';

  if (!state.background) {
    if (!(await confirmAlways())) return 'declined'; // our explanation first, so the phone's question makes sense
    if (!(await requestBackgroundLocation())) return 'need-always';
  }

  if (!state.notifications && !(await requestNotifications())) return 'need-notifications';

  await saveSettings({ remindersEnabled: true });
  return 'on';
}

// What the screens say after turnOnNearbyAlerts did not finish.
export const ALWAYS_EXPLANATION =
  "To tell you when you're near a place you saved, even when Spotted is closed, your phone needs to allow location \"all the time\". Your location stays on your phone. The next question comes from your phone: please choose \"Allow all the time\".";

export function missingMessage(result: EnableResult): string | null {
  if (result === 'need-always') return 'Nearby alerts need location set to "Allow all the time". You can change it in your phone settings.';
  if (result === 'need-notifications') return 'Nearby alerts need notifications. You can allow them in your phone settings.';
  if (result === 'declined') return 'Nearby alerts stay off. You can turn them on any time.';
  return null;
}
