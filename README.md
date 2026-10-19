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
  (for anything you share with others, keep the Places key on the small proxy in `server/places-proxy`, see below)
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

## Test on a phone with a standalone APK

A "preview" build is a normal app (an `.apk` file) that works on its own, with no computer running.
Use it for real-life tests like walking past a saved place and waiting for the reminder.

```bash
eas build --profile preview --platform android
```

Open the link EAS gives you on the phone to install it (Android asks you to allow installs from your browser).
- Add `EXPO_PUBLIC_PLACES_PROXY_URL` as an EAS environment variable, or the APK uses the demo list of Dubai places.
  (`.env` is not uploaded to EAS.)
- The "Testing" buttons in Settings are hidden in this build.
- On the phone: allow location "all the time" and turn off battery saving for Spotted.
- This uses one of the free monthly builds. A preview APK cannot be uploaded to Google Play (use `production`).

## Build for the stores

```bash
# Android (Google Play) — makes an .aab file
eas build --profile production --platform android
eas submit --platform android

# iPhone (App Store) — no Mac needed
eas build --profile production --platform ios
eas submit --platform ios
```

### Sharing from Instagram on iPhone

The iPhone share extension (Share → Spotted) is switched on in `app.json`. A test run of `expo prebuild`
created the extension correctly, but it has **not been tried on a real iPhone yet**. Notes:
- You need the Apple Developer Program (USD 99 / year). EAS will ask for credentials for **two** targets:
  the app and "ShareExtension". Let EAS create them.
- Do not commit the `ios/` or `android/` folders that `expo prebuild` makes; EAS rebuilds them.
- Native change = a new development build is needed.

## For developers joining the project

Welcome! Read **SPEC.md** (what we build) and **CLAUDE.md** (the rules) first. They are short.

### Get it running
1. Accept your GitHub invitation, then install [Node.js](https://nodejs.org) (LTS) and Git.
2. Get the code and install the packages:
   ```bash
   git clone https://github.com/sarahnazirahmed-debug/Spotted.git
   cd Spotted
   npm install
   ```
3. Secrets: `cp .env.example .env`. The Google key is **optional** (without it the app uses a built-in
   demo list of Dubai places). If you need the key, ask the owner to send it privately.
   **Never commit `.env`, keys or passwords.**
4. Start the app: `npx expo start --dev-client` (needs the Spotted development build on an Android phone;
   ask the owner for the install file). Expo Go can show the screens, but not Instagram sharing or
   background reminders.
5. Before every commit, run these checks. All must be clean:
   ```bash
   npm run typecheck
   npm test
   npx expo-doctor
   ```
   (`npm test` checks the reminder rules, link handling and caption reading. GitHub also runs
   the first two automatically on every pull request.)

### How we work together
- **Never work directly on `main`.** Make a branch for each task:
  ```bash
  git checkout main && git pull
  git checkout -b short-name-of-task
  ```
- Commit small and often, with a clear message, then push your branch:
  ```bash
  git add .
  git commit -m "Say what you changed"
  git push -u origin short-name-of-task
  ```
- On GitHub, open a **Pull Request** into `main`. The owner reviews and merges it.
- Keep Version 1 small. Do not build anything listed under "Out of scope" in SPEC.md without asking.
- Builds (`eas build`) are tied to the owner's Expo account. Ask before starting one, because the free
  plan has a limited number of builds per month.

### Things that will bite you
- **Android map:** the Google map **crashes the whole app** if no Google Maps key is built in. That is
  why `GOOGLE_MAPS_KEY_IN_BUILD` in `src/config.ts` is `false` and the Map tab shows a list instead.
  Only set it to `true` after a key is built into the app.
- **Background reminders** need the background jobs defined at start-up. That is why `index.ts` is the
  app's entry file and imports `src/geofence/tasks` first. Do not move that import.
- **Native packages** (anything with native code, like maps, location, notifications) need a **new
  development build** after you add them. JavaScript-only changes do not.
- **The Google key.** Never put the Places key inside the app for builds other people use. Use the
  proxy in `server/places-proxy` (its README explains the 10-minute setup) and set `EXPO_PUBLIC_PLACES_PROXY_URL`.
- **Never scrape Instagram or TikTok, and never read comments.** Use official public services or text the
  user pastes. This is a store and platform rule, not just a preference.
- Reminder rules (quiet hours, 24-hour repeat, nearest 20 places) live in `src/geofence/rules.ts`.
  Change them carefully: they decide when users get notified.
- `app/(tabs)/settings.tsx` shows "Testing" buttons only in development builds. They are hidden in store builds.

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
│   ├── places/               # Place search (Google via proxy, or a built-in demo list) and caption clues
│   ├── geofence/             # Nearby reminders: rules, background jobs, notifications
│   ├── share/                # Receives reels shared from Instagram
│   ├── permissions/          # Location + notification permissions
│   ├── location/             # Distance helpers
│   ├── onboarding/           # First-launch state
│   └── components/           # Shared UI pieces
├── server/places-proxy/      # Tiny Cloudflare Worker that keeps the Google key off the phone
├── tests/                    # Automatic tests (run with npm test)
├── docs/PRIVACY_POLICY.md    # Draft privacy policy (publish it, then link it in src/config.ts)
├── eas.json                  # Build settings for Expo's cloud builds
├── SPEC.md  CLAUDE.md  README.md
```

## Notes

- **No Google key yet?** The app still works: Add Place searches a small built-in list of Dubai places.
  Set `EXPO_PUBLIC_PLACES_PROXY_URL` (or, for your own testing only, a Google key) in `.env` and real search switches on by itself.
- **Caption suggestions.** In Add Place, "Find the place from the caption" suggests places. TikTok links are read
  automatically (TikTok's official oEmbed service); for Instagram, paste the caption. You always confirm.
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
