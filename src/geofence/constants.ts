// Names of the two background jobs (Android/iOS remember jobs by name).
export const GEOFENCE_TASK = 'spotted-geofence'; // runs when you walk into a saved place's circle
export const REFRESH_TASK = 'spotted-refresh-geofences'; // runs when you have moved far, to pick the nearest 20 again
export const REMINDER_BUTTON_TASK = 'spotted-reminder-button'; // runs when a button on a reminder is tapped

// How far you must move before we pick the nearest places again (metres).
export const REFRESH_DISTANCE_METERS = 2000;
