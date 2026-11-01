import { ConfigContext, ExpoConfig } from 'expo/config';

// Expo reads app.json first and passes it in here as `config`. We keep every setting from app.json
// and only ADD what must not be written in a file: the Android Google Maps key.
//
// The key comes from the environment variable GOOGLE_MAPS_ANDROID_API_KEY:
//  - in EAS builds: set it as an EAS environment variable (see docs/MY_STEPS.md)
//  - on your own computer: put it in .env (never commit .env)
// If the variable is not set, the app still builds, but the Android map cannot work.
// (That is why GOOGLE_MAPS_KEY_IN_BUILD in src/config.ts stays false until you set the key.)
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '';

  return {
    ...config,
    name: config.name ?? 'Spotted',
    slug: config.slug ?? 'spotted',
    android: {
      ...config.android,
      // Only add the key when we have one, so builds without a key behave as before.
      ...(mapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } } : {}),
    },
  };
};
