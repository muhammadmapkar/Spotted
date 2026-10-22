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
5. Before every commit, run the checks. Everything must pass:
   ```bash
   npm run check        # type-check + all automatic tests
   npx expo-doctor      # project health check
   ```

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

### Automatic tests
One command runs all of them (about 5 seconds):
```bash
npm test               # the tests only
npm run check          # type-check, then the tests
```
They need **Node 24 or newer** (they use Node's built-in test runner and SQLite, so nothing extra to install).

**What they cover** (302 tests in `tests/`):
- the place-clue finder: reads sample captions and suggests the place (and never guesses wildly);
- the reminder rules: nearest 20 places, quiet hours (including past midnight), the 24-hour no-repeat rule;
- the background reminder job and the "refused permissions" cases, against a pretend phone;
- on-phone storage, collections, settings, and "Delete all my data";
- sharing a reel: finding and cleaning the link, and opening Add Place (runs the real component in React);
- the Android map safety switch, the place search (demo list and Google), the My Places filters;
- readable colours in light and dark mode, and the icon files;
- Influencer page: platform buttons and profile links (app first, website if the app is missing), the top 7 and all-recommendations lists, reel links, month chip, the ring / pop / fan-in animations, and every tap on the real screen;
- Map tab: which places get a pin (saved = red bookmark, unsaved partner = purple), distances from the user, the 15 km circle, the dark map style, the real Google map vs the drawn preview (never the Google map on Android without a key), and tapping pins;
- Saved tab: folders and counts, searching only saved places, shared filters, keeping saved places on the phone (and "Delete all my data" forgetting them), the back arrow / phone back button, and every tap on the real screen;
- Filter sheet: the budget slider (AED 20 to 500+, snapped to steps), distance and category chips, the two switches, Reset, the live "Show N places" button, and the glide animation of the results;
- Place page: the line under the name, the Google Maps link, influencer recommendations and reel links, offers and their empty messages, PDF vs paper menu (Android viewer, https only, fallback if the PDF fails), the dropdowns' animation, the buttons, and every tap on the real screen;
- Home: the circles row, search (names, tags, menu items, influencer handles), partner-first ordering, filters and chips, the typing placeholder, the area name, and every tap on the real screen;
- the bottom bar: tab order, the sliding dot's position, the New In red dot, and that Settings is still reachable from Profile;
- sign-in: phone numbers, the code boxes, the whole flow (wrong code, resend, first-time versus returning users), and that Delete all my data signs out;
- the animated splash: its timings and sizes are compared with the prototype's CSS, and its wiring (start times, finish once, tap to skip, Reduce Motion) is tested;
- the redesign foundation: palettes and sample data are compared against the prototype file itself, and the light/dark choice is saved.

**What they do NOT cover:** real phones. Background location, real notifications, Instagram's share sheet,
and how the screens look need a manual test on a development build (see the test list in the owner's notes).

**Adding a test:** make `tests/something.test.js` (copy a small one, like `tests/share-links.test.js`).
The helpers in `tests/helpers/fakes.js` give you a pretend phone (`createPhone`), a pretend database
(`makeTestDb`), a frozen clock (`atTime`) and a way to run real React components (`setupReact`).
`tests/helpers/build.js` lists the files the tests load. Add a new file there if your test needs one.
A good habit: when you fix a bug, first write a test that fails because of it.

### Things that will bite you
- **Android map:** the Google map **crashes the whole app** if no Google Maps key is built in. That is
  why `GOOGLE_MAPS_KEY_IN_BUILD` in `src/config.ts` is `false` and the Map tab shows a list instead.
  Only set it to `true` after a key is built into the app.
- **Background reminders** need the background jobs defined at start-up. That is why `index.ts` is the
  app's entry file and imports `src/geofence/tasks` first. Do not move that import.
- **Native packages** (anything with native code, like maps, location, notifications) need a **new
  development build** after you add them. JavaScript-only changes do not.
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
│   │   ├── saved.tsx         # Saved tab (folders, search, filters)
│   │   ├── map.tsx           # Map with coloured pins
│   │   ├── index.tsx         # Home: location, saved-place circles, search, Explore feed
│   │   ├── new.tsx           # New In (placeholder for now)
│   │   └── profile.tsx       # Profile; Settings opens from here
│   ├── reel-map.tsx          # The original map of places saved from reels (opens from "Places from reels")
│   ├── reel-places.tsx       # The original list of places saved from reels (opens from the Saved tab)
│   ├── venue/[id].tsx        # The Place page (hero, Location / Menu / save, influencer and offer dropdowns, menu sheet)
│   ├── influencer/[id].tsx   # The Influencer page (ring, platform buttons, top 7, all recommendations)
│   ├── settings.tsx          # Settings (reminders, delete all my data, privacy link)
│   ├── sign-in.tsx           # Sign in: phone, code, details
│   ├── add-place.tsx         # Search + save a place (also opens from a shared reel)
│   ├── place/[id].tsx        # Place detail / edit / delete
│   ├── welcome.tsx           # Welcome slides (first launch)
│   ├── permissions.tsx       # Explains and asks for permissions (first launch)
│   └── _layout.tsx           # App shell, theme, first-launch logic
├── src/
│   ├── db/                   # On-device storage (expo-sqlite): places, settings
│   ├── places/               # Place search (Google, or a built-in demo list without a key)
│   │                         #   + the place-clue finder that reads a pasted caption (clues.ts)
│   ├── geofence/             # Nearby reminders: rules, background jobs, notifications
│   ├── share/                # Receives reels shared from Instagram
│   ├── permissions/          # Location + notification permissions
│   ├── theme/                # Light/dark theme provider (useTheme) and the Poppins font mapping
│   ├── auth/                 # Sign-in: phone rules, the step-by-step flow logic, who is signed in
│   ├── services/auth.ts      # The FAKE SMS service (code is always 123456). A real provider replaces this one file
│   ├── influencer/           # Influencer page rules (profile links with website fallback, top 7, all recommendations)
│   ├── components/filters/   # The filter bottom sheet
│   ├── map/                  # Map tab rules (pins, circle, dark map style); the drawing is in components/map/
│   ├── saved/                # Saved tab rules (folders, search, filters)
│   ├── services/savedPlaces.ts  # where saved places are kept on the phone (one file to change for a backend)
│   ├── place/                # Place page rules (Google Maps link, recommendations, offers, menu viewer choice)
│   ├── home/                 # Home rules (circles, search, filters, sorting) and the typing placeholder
│   ├── state/                # Small shared stores: saved places, filters, the New In dot
│   ├── splash/               # The animated intro (road, banner, pin). timeline.ts has the timings from the prototype
│   ├── data/mock.ts          # SAMPLE data for the redesign preview (places, influencers, offers)
│   ├── location/             # Distance helpers
│   ├── onboarding/           # First-launch state
│   └── components/           # Shared UI pieces (icons/ = the Spotted line icons, PlaceLogo)
├── tests/                    # Automatic tests (run with `npm test`) and their helpers
├── docs/PRIVACY_POLICY.md    # Draft privacy policy (publish it, then link it in src/config.ts)
├── eas.json                  # Build settings for Expo's cloud builds
├── SPEC.md  CLAUDE.md  README.md
```

## Notes

- **No Google key yet?** The app still works: Add Place searches a small built-in list of Dubai places.
  Put a key in `.env` and the real Google search switches on by itself.
- **Expo Go vs development build.** Expo Go is fine for screens, list, search and storage. Sharing from
  Instagram and background reminders only work in a **development build** (see above).
- **Menu PDFs.** A place with a `menuPdfUrl` shows that PDF inside the app (`react-native-webview`; on Android it is wrapped in Google's free document viewer, because Android's web view cannot show PDFs by itself). Places without one show the items like a paper menu. The sample places have no PDF yet.
- **Google Maps key (Android).** The Map tab shows a drawn preview on Android until a Google Maps key is built in, because the Google map crashes the app without one. To switch to the real map: (1) create a key in Google Cloud ("Maps SDK for Android" enabled, restricted to package `com.spotted.app`), (2) put it in `.env` as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (never commit it) and as an EAS secret for builds, (3) add it to the Android settings in a small `app.config.js` (`android.config.googleMaps.apiKey`), (4) set `GOOGLE_MAPS_KEY_IN_BUILD` to `true` in `src/config.ts`, (5) make a new development build. iPhone uses Apple Maps and needs no key.
- **Filter sheet.** The purple filter button on Home slides up a sheet (`@gorhom/bottom-sheet`, with `@react-native-community/slider`). It changes one shared filter state, so Home (and, in the next step, the Saved tab) always agree; the list behind it reshuffles as you change things.
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
