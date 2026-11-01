import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { getLastAlertAt, setLastAlertAt } from '../db/alerts';
import { getPlace, listPlaces, updatePlace } from '../db/places';
import { placeById } from '../data/mock';
import { distanceMeters } from '../location/distance';
import { coordinatesOf } from '../place/placeData';
import { getSettings } from '../db/settings';
import { handleReminderAction } from './actions';
import { GEOFENCE_TASK, REFRESH_TASK, REMINDER_BUTTON_TASK } from './constants';
import { parseVenueRegion } from './catalogue';
import { dismissReminder, sendNearbyNotification, sendVenueAlert } from './notify';
import { shouldNotify } from './rules';
import { getPosition, syncGeofencing } from './sync';

// The two background jobs. The phone can wake the app just to run these,
// even when Spotted is closed. They must be defined as soon as the app loads,
// so this file is imported at the top of app/_layout.tsx.

// Job 1: you walked into the circle around a saved place.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };
  if (eventType !== Location.GeofencingEventType.Enter || !region?.identifier) return;

  try {
    const venueId = parseVenueRegion(region.identifier);
    const [settings, allPlaces] = await Promise.all([getSettings(), listPlaces()]);
    const now = new Date();

    // A saved Spotted place (from the Saved tab).
    if (venueId) {
      const venue = placeById(venueId);
      if (!venue) return;
      // The daily limit also counts reminders already sent for places saved from reels.
      if (!shouldNotify({ lastNotifiedAt: await getLastAlertAt(venueId) }, now, settings, allPlaces)) return;
      await setLastAlertAt(venueId, now.toISOString()); // write the time FIRST, so two quick events can never send two alerts
      const here = await getPosition();
      await sendVenueAlert(venue, here ? distanceMeters(here, coordinatesOf(venue)) : null);
      return;
    }

    // A place saved from a reel.
    const place = await getPlace(region.identifier);
    if (!place) return;
    // No reminder if: reminders off, place muted, visited or paused ("Not now"), quiet hours,
    // this place notified in the last 24 h, or the daily limit is reached.
    if (!shouldNotify(place, now, settings, allPlaces)) return;

    // Write down the time FIRST, so two quick events can never send two notifications.
    await updatePlace(place.id, { lastNotifiedAt: now.toISOString() });
    const here = await getPosition();
    await sendNearbyNotification(place, here ? distanceMeters(here, place) : null);
  } catch {
    // Never crash a background job.
  }
});

// Job 2: you have moved a long way, so pick the 20 nearest places again.
TaskManager.defineTask(REFRESH_TASK, async ({ error }) => {
  if (error) return;
  await syncGeofencing();
});

// Job 3 (Android): you tapped "I've been here" or "Not now" on a reminder while Spotted was closed.
// (When the app is open, src/geofence/GeofenceManager.tsx handles the tap instead.)
TaskManager.defineTask<Notifications.NotificationTaskPayload>(REMINDER_BUTTON_TASK, async ({ data, error }) => {
  if (error || !data || !('actionIdentifier' in data)) return;
  try {
    const request = data.notification.request;
    const placeId = request.content.data?.placeId;
    if (typeof placeId !== 'string') return;
    if (await handleReminderAction(data.actionIdentifier, placeId)) {
      await dismissReminder(request.identifier);
    }
  } catch {
    // Never crash a background job.
  }
});
// Not available everywhere (for example on the web or in tests): then the buttons still work while the app is open.
try {
  Notifications.registerTaskAsync(REMINDER_BUTTON_TASK).catch(() => {});
} catch {
  // Never crash while the app starts.
}
