import { SavedPlace, Settings } from '../db/types';
import { Coords, distanceMeters } from '../location/distance';

// The rules for nearby reminders, written as plain functions so they are easy to test.

// Phones limit how many places can be watched at once. iOS allows 20, so we always use 20.
export const MAX_WATCHED_PLACES = 20;

// The same place never notifies twice within this time.
export const REPEAT_HOURS = 24;

// The places to watch: the 20 closest to the user.
// If we don't know where the user is yet, we use the 20 newest instead.
export function nearestPlaces(
  places: SavedPlace[],
  position: Coords | null,
  limit: number = MAX_WATCHED_PLACES
): SavedPlace[] {
  if (!position) return places.slice(0, limit); // the list is already newest first
  return [...places]
    .sort((a, b) => distanceMeters(position, a) - distanceMeters(position, b))
    .slice(0, limit);
}

// "22:30" -> minutes since midnight (1350)
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Is it quiet hours right now? Works for overnight spans like 22:00 to 08:00.
export function isQuietTime(now: Date, settings: Settings): boolean {
  if (!settings.quietHoursEnabled) return false;
  const start = toMinutes(settings.quietStart);
  const end = toMinutes(settings.quietEnd);
  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false; // no time between them: never quiet
  return start < end
    ? current >= start && current < end // same-day span, e.g. 13:00 to 15:00
    : current >= start || current < end; // overnight span, e.g. 22:00 to 08:00
}

// Has this place already notified within the last 24 hours?
export function notifiedRecently(place: SavedPlace, now: Date): boolean {
  if (!place.lastNotifiedAt) return false;
  const last = new Date(place.lastNotifiedAt).getTime();
  if (Number.isNaN(last)) return false;
  return now.getTime() - last < REPEAT_HOURS * 60 * 60 * 1000;
}

// The final decision: should we show a notification for this place right now?
export function shouldNotify(place: SavedPlace, now: Date, settings: Settings): boolean {
  if (!settings.remindersEnabled) return false;
  if (isQuietTime(now, settings)) return false;
  if (notifiedRecently(place, now)) return false;
  return true;
}

// The text of the notification (from SPEC.md).
export function notificationBody(place: SavedPlace): string {
  return `You're near ${place.name} — you saved it from a reel 👀`;
}
