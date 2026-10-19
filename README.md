# Spotted

Save places you find on Instagram reels. Get reminded when you're nearby.

Built with Expo (React Native) + TypeScript. Android first, iPhone second.
See **[SPEC.md](./SPEC.md)** for what the app does and **[CLAUDE.md](./CLAUDE.md)** for how Claude Code should work on it.

---

## What you need

- [Node.js](https://nodejs.org) (LTS version)
- A free [Expo](https://expo.dev) account
- An Android phone (iPhone later)
- A Google Cloud API key with **Places API** and **Maps SDK for Android/iOS** turned on
- Git and a GitHub account

## First-time setup

```bash
# 1. Get the code (skip if you created it here)
git clone https://github.com/<your-username>/spotted.git
cd spotted

# 2. Install packages
npm install

# 3. Add your secret key
cp .env.example .env
# then open .env and paste your key:
# EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
```

> Never share or commit `.env`. It's already in `.gitignore`.

## Run it on your phone

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app (Android) to see list, map and add-place screens.

Sharing from Instagram and nearby reminders need a **development build** (Expo Go can't do them):

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Install the build on your phone from the link EAS gives you, then run `npx expo start --dev-client`.

## Build for the stores

```bash
# Android (Google Play) — makes an .aab file
eas build --profile production --platform android
eas submit --platform android

# iPhone (App Store) — no Mac needed
eas build --profile production --platform ios
eas submit --platform ios
```

## Project structure

```
spotted/
├── app/                      # Screens (Expo Router)
│   ├── (tabs)/
│   │   ├── index.tsx         # My Places list
│   │   ├── map.tsx           # Map with coloured pins
│   │   └── settings.tsx      # Settings
│   ├── add-place.tsx         # Search + save a place (also opens from a shared reel)
│   ├── place/[id].tsx        # Place detail / edit / delete
│   ├── welcome.tsx           # Welcome slides (first launch)
│   ├── permissions.tsx       # Explains and asks for permissions (first launch)
│   └── _layout.tsx           # App shell, theme, first-launch logic
├── src/
│   ├── db/                   # On-device storage (expo-sqlite): places, settings
│   ├── places/               # Place search (Google, or a built-in demo list without a key)
│   ├── geofence/             # Nearby reminders: rules, background jobs, notifications
│   ├── share/                # Receives reels shared from Instagram
│   ├── permissions/          # Location + notification permissions
│   ├── location/             # Distance helpers
│   ├── onboarding/           # First-launch state
│   └── components/           # Shared UI pieces
├── docs/PRIVACY_POLICY.md    # Draft privacy policy (publish it, then link it in src/config.ts)
├── eas.json                  # Build settings for Expo's cloud builds
├── SPEC.md  CLAUDE.md  README.md
```

## Notes

- **No Google key yet?** The app still works: Add Place searches a small built-in list of Dubai places.
  Put a key in `.env` and the real Google search switches on by itself.
- **Expo Go vs development build.** Expo Go is fine for screens, list, search and storage. Sharing from
  Instagram and background reminders only work in a **development build** (see above).
- **Testing buttons.** In a development build, the bottom of Settings has "Testing" buttons
  (test reminder, reminder status, show welcome screens again). They are hidden in the store build.

## Costs

| Item | Cost |
|---|---|
| Google Play developer account | USD 25 once |
| Apple Developer Program | USD 99 / year |
| Expo EAS (free plan) | ~15 Android + 15 iOS builds / month |
| Google Maps / Places | Free monthly allowance, then pay per use — **set a budget alert** |

## Privacy

Version 1 stores everything on the phone. Location is used only to trigger nearby reminders and is never sent to a server. Users can delete all data in Settings.

## Contact

hello.spottedapp@gmail.com (change to your real support email)
