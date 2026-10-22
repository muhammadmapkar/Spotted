import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { getLastAlertAt, setLastAlertAt } from '../db/alerts';
import { getPlace, updatePlace } from '../db/places';
import { placeById } from '../data/mock';
import { distanceMeters } from '../location/distance';
import { coordinatesOf } from '../place/placeData';
import { getSettings } from '../db/settings';
import { GEOFENCE_TASK, REFRESH_TASK } from './constants';
import { parseVenueRegion } from './catalogue';
import { sendNearbyNotification, sendVenueAlert } from './notify';
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
    const settings = await getSettings();
    const now = new Date();

    // A saved Spotted place (from the Saved tab).
    if (venueId) {
      const venue = placeById(venueId);
      if (!venue) return;
      if (!shouldNotify({ lastNotifiedAt: await getLastAlertAt(venueId) }, now, settings)) return;
      await setLastAlertAt(venueId, now.toISOString()); // write the time FIRST, so two quick events can never send two alerts
      const here = await getPosition();
      await sendVenueAlert(venue, here ? distanceMeters(here, coordinatesOf(venue)) : null);
      return;
    }

    // A place saved from a reel.
    const place = await getPlace(region.identifier);
    if (!place) return;
    if (!shouldNotify(place, now, settings)) return; // reminders off, quiet hours, or notified in the last 24 h

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
