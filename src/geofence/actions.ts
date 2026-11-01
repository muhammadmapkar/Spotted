// The two buttons on a "You're near ..." reminder, and what they do.
// Kept free of phone-only code so automatic tests can check them.

import { getPlace, updatePlace } from '../db/places';

// The name of the button set (Android/iOS call it a notification "category").
export const NEARBY_CATEGORY = 'nearby-reminder';

// The button ids. They travel back to the app when a button is tapped.
export const ACTION_VISITED = 'visited';
export const ACTION_NOT_NOW = 'not-now';

// "Not now" pauses reminders for this place for this many days.
export const NOT_NOW_DAYS = 7;

// Do what a reminder button asks. Returns true if it was one of our buttons.
// Safe to run twice for the same tap (the result is the same).
export async function handleReminderAction(actionId: string, placeId: string, now = new Date()): Promise<boolean> {
  if (actionId !== ACTION_VISITED && actionId !== ACTION_NOT_NOW) return false;
  const place = await getPlace(placeId);
  if (!place) return true; // the place was deleted meanwhile: nothing to do

  if (actionId === ACTION_VISITED) {
    // Keep the first date if it was already marked.
    await updatePlace(placeId, { visitedAt: place.visitedAt ?? now.toISOString() });
  } else {
    const until = new Date(now.getTime() + NOT_NOW_DAYS * 24 * 60 * 60 * 1000);
    await updatePlace(placeId, { snoozedUntil: until.toISOString() });
  }
  return true;
}
