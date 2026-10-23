// Links and contact details used in Settings. Change them here.

// TODO before store submission: put your real privacy policy web address here.
// While it is empty, tapping "Privacy policy" shows a "coming soon" message.
export const PRIVACY_POLICY_URL = '';

// Where "Contact support" sends an email.
export const SUPPORT_EMAIL = 'hello.spottedapp@gmail.com';

// Is a Google Maps key built into the app?
//  false = (for now) on Android the Map tab shows a simple list of places instead of a map.
//          IMPORTANT: on Android, the Google map CRASHES the whole app if there is no key,
//          so we must not show it until a key is built in.
//  true  = the real map is shown. Set this to true only after you have set the Maps key
//          (GOOGLE_MAPS_ANDROID_API_KEY, read by app.config.ts) and made a new build.
//          Steps: docs/MY_STEPS.md.
// iPhone uses Apple Maps, which needs no key, so it always shows the real map.
export const GOOGLE_MAPS_KEY_IN_BUILD = false;
