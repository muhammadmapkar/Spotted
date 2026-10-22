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

// Anything that can be watched: a place saved from a reel, or a saved Spotted place.
export interface WatchTarget {
  identifier: string; // what the phone calls this circle
  latitude: number;
  longitude: number;
}

// The closest `limit` targets (same idea as nearestPlaces, for the mixed list). If we don't know where the
// user is yet, the first `limit` in the order given are used.
export function nearestTargets<T extends WatchTarget>(targets: T[], position: Coords | null, limit: number = MAX_WATCHED_PLACES): T[] {
  if (!position) return targets.slice(0, limit);
  return [...targets].sort((a, b) => distanceMeters(position, a) - distanceMeters(position, b)).slice(0, limit);
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
export function notifiedRecently(place: { lastNotifiedAt?: string }, now: Date): boolean {
  if (!place.lastNotifiedAt) return false;
  const last = new Date(place.lastNotifiedAt).getTime();
  if (Number.isNaN(last)) return false;
  return now.getTime() - last < REPEAT_HOURS * 60 * 60 * 1000;
}

// The final decision: should we show a notification for this place right now?
export function shouldNotify(place: { lastNotifiedAt?: string }, now: Date, settings: Settings): boolean {
  if (!settings.remindersEnabled) return false;
  if (isQuietTime(now, settings)) return false;
  if (notifiedRecently(place, now)) return false;
  return true;
}

// ---- the words of the alert ------------------------------------------------------------------

// 280 -> "280 m", 1234 -> "1.2 km", 12600 -> "13 km"
export function formatAway(meters: number): string {
  const rounded = Math.round(meters / 10) * 10;
  if (rounded < 1000) return `${Math.max(10, rounded)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

// The title: "A place you saved is 1.2 km away". If we don't know how far the user is, "...is nearby".
export function alertTitle(distanceMeters: number | null): string {
  return distanceMeters === null ? 'A place you saved is nearby' : `A place you saved is ${formatAway(distanceMeters)} away`;
}

// "5 influencers recommend it", "1 influencer recommends it", or nothing when no influencer does.
export function influencerLine(count: number): string {
  if (count <= 0) return '';
  return count === 1 ? '1 influencer recommends it' : `${count} influencers recommend it`;
}

// The body: "Saffron Lane · 5 influencers recommend it" (just the name when nobody has recommended it).
export function alertBody(name: string, influencers: number): string {
  const line = influencerLine(influencers);
  return line ? `${name} · ${line}` : name;
}
