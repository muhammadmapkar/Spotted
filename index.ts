// The very first file the app runs (set as "main" in package.json).
//
// The background jobs for nearby reminders must be defined here, before anything else.
// When you walk near a saved place, the phone can start Spotted in the background with
// no screens at all, and it needs the jobs to already exist.
import './src/geofence/tasks';

// Then start the app as usual.
import 'expo-router/entry';
