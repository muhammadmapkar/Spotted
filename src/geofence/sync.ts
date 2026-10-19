import * as Location from 'expo-location';

import { getSettings } from '../db/settings';
import { listPlaces } from '../db/places';
import { Coords } from '../location/distance';
import { getPermissionState, remindersWork } from '../permissions';
import { GEOFENCE_TASK, REFRESH_DISTANCE_METERS, REFRESH_TASK } from './constants';
import { MAX_WATCHED_PLACES, nearestPlaces, remindablePlaces } from './rules';

// Where is the user? (null if we can't tell.)
async function getPosition(): Promise<Coords | null> {
  try {
    const last = await Location.getLastKnownPositionAsync();
    if (last) return last.coords;
    const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return now.coords;
  } catch {
    return null;
  }
}

// Stop everything (used when reminders are off, or there is nothing to watch).
async function stopWatching(): Promise<void> {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
  if (await Location.hasStartedLocationUpdatesAsync(REFRESH_TASK)) {
    await Location.stopLocationUpdatesAsync(REFRESH_TASK);
  }
}

// Makes the phone watch the right places. Safe to call as often as you like:
// it starts, updates or stops the watching depending on the current settings,
// permissions and saved places. It never throws, so it can never crash the app.
export async function syncGeofencing(): Promise<void> {
  try {
    const [settings, permissions, allPlaces] = await Promise.all([
      getSettings(),
      getPermissionState(),
      listPlaces(),
    ]);
    // Muted places and places marked "I've been here" are not watched.
    const places = remindablePlaces(allPlaces);

    // Nothing to do (or not allowed to): make sure we are not watching.
    if (!settings.remindersEnabled || !remindersWork(permissions) || places.length === 0) {
      await stopWatching();
      return;
    }

    // Watch the 20 nearest places (a phone limit). A new list replaces the old one.
    const nearest = nearestPlaces(places, await getPosition(), MAX_WATCHED_PLACES);
    await Location.startGeofencingAsync(
      GEOFENCE_TASK,
      nearest.map((place) => ({
        identifier: place.id,
        latitude: place.latitude,
        longitude: place.longitude,
        radius: settings.radiusMeters,
        notifyOnEnter: true,
        notifyOnExit: false,
      }))
    );

    // Only when there are MORE than 20 places do we need to pick again as you move.
    // With 20 or fewer, we already watch them all, which saves battery.
    if (places.length > MAX_WATCHED_PLACES) {
      if (!(await Location.hasStartedLocationUpdatesAsync(REFRESH_TASK))) {
        await Location.startLocationUpdatesAsync(REFRESH_TASK, {
          accuracy: Location.Accuracy.Low, // rough position is enough, and uses less battery
          distanceInterval: REFRESH_DISTANCE_METERS,
          showsBackgroundLocationIndicator: false,
        });
      }
    } else if (await Location.hasStartedLocationUpdatesAsync(REFRESH_TASK)) {
      await Location.stopLocationUpdatesAsync(REFRESH_TASK);
    }
  } catch {
    // Background location may be unavailable (for example in Expo Go). Just carry on.
  }
}

// A snapshot for the "check reminders" testing button in Settings.
export async function getReminderStatus(): Promise<string> {
  try {
    const [settings, permissions, places] = await Promise.all([
      getSettings(),
      getPermissionState(),
      listPlaces(),
    ]);
    const watching = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    return [
      `Reminders setting: ${settings.remindersEnabled ? 'on' : 'off'}`,
      `Radius: ${settings.radiusMeters} m`,
      `Location allowed: ${permissions.location ? 'yes' : 'no'}`,
      `"All the time" allowed: ${permissions.background ? 'yes' : 'no'}`,
      `Notifications allowed: ${permissions.notifications ? 'yes' : 'no'}`,
      `Saved places: ${places.length}`,
      `Watching now: ${watching ? 'yes' : 'no'}`,
    ].join('\n');
  } catch (e) {
    return `Could not read status: ${String(e)}`;
  }
}
