import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { getPlace, listPlaces, updatePlace } from '../db/places';
import { getSettings } from '../db/settings';
import { GEOFENCE_TASK, REFRESH_TASK } from './constants';
import { sendNearbyNotification } from './notify';
import { shouldNotify } from './rules';
import { syncGeofencing } from './sync';

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
    const [place, settings, allPlaces] = await Promise.all([getPlace(region.identifier), getSettings(), listPlaces()]);
    if (!place) return;

    const now = new Date();
    // No reminder if: reminders off, place muted or visited, quiet hours,
    // this place notified in the last 24 h, or the daily limit is reached.
    if (!shouldNotify(place, now, settings, allPlaces)) return;

    // Write down the time FIRST, so two quick events can never send two notifications.
    await updatePlace(place.id, { lastNotifiedAt: now.toISOString() });
    await sendNearbyNotification(place);
  } catch {
    // Never crash a background job.
  }
});

// Job 2: you have moved a long way, so pick the 20 nearest places again.
TaskManager.defineTask(REFRESH_TASK, async ({ error }) => {
  if (error) return;
  await syncGeofencing();
});
