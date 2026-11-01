# Spotted — Product Spec (Version 1)

> Save places you find on Instagram reels. Get reminded when you're nearby.

**Status:** Version 1 (MVP) · **Platforms:** Android first, iPhone second · **Launch city:** Dubai (works worldwide)

---

## 1. The problem

People save dozens of restaurants, cafés, shops and things to do from Instagram reels, then forget about them. When they're actually nearby, they don't remember.

## 2. The solution

Spotted lets users share a reel straight to the app, confirm which place it is, and then get a gentle phone notification when they're close to that place.

## 3. Who it's for

- Primary: 18–40 year olds in Dubai who use Instagram to discover food, shopping and fun.
- Secondary: tourists and residents anywhere who save places from reels.

## 4. Version 1 features (MUST have)

### F1. Share a reel to Spotted
- In Instagram, user taps **Share → Spotted** (or copies the reel link and pastes it in the app).
- Spotted opens the **Add Place** screen with the reel link attached.
- The app does **not** scrape or read Instagram content. The user confirms the place.
- If a reel is shared while the welcome / permission screens are showing (first launch), the link is remembered and Add Place opens with it as soon as onboarding is finished.

### F1b. Place suggestions from a caption (built; added after Version 1 planning)
Goal: save time. The app *suggests* the place, and the user always confirms.
- **TikTok link:** the app asks TikTok's official public **oEmbed** service for the post's caption (no login, no scraping).
- **Instagram link:** there is no official way to read a post. The user copies the caption in Instagram and taps **Paste caption** in Add Place.
- **Place clues are found on the phone** (no AI service, no server): lines starting with 📍, phrases like "at …", @tags, and the city or area.
- The clues are searched with **Google Places**, and the best matches are shown as suggestions.
- The user taps a suggestion to confirm, then chooses a category and collection (F2, F8).
- If no clue is found, the normal search box is shown.
- **Never:** scrape pages, read comments, log in to Instagram/TikTok for the user, or send captions to an AI service (that is Version 2).

### F2. Confirm and save a place
- Search box using **Google Places Autocomplete** (results biased to the user's current location).
- User picks the place → app stores: name, address, latitude/longitude, Google place ID.
- User picks a category: **Food**, **Shopping**, or **Fun**.
- Optional: save the place into one or more of the user's own **collections** (see F8).
- Optional: a short personal note (e.g. "try the pistachio croissant").
- Reel link saved with the place (tap to reopen the reel).

### F3. My Places (list)
- List of saved places, newest first by default.
- **Search box** above the list: finds places by name, area (address) or note. Several words must all match. Upper/lower case doesn't matter.
- **Sort:** "Newest" (default) or "Nearest". "Nearest" only works when location is allowed (otherwise it is greyed out).
- Search, the category chips and the collection chips all combine.
- Filter chips: All / Food / Shopping / Fun.
- A second row of chips filters by collection (shown only when the user has collections). Category and collection filters combine.
- Each item shows name, area, category, distance from user (if location allowed).
- Swipe or long-press to edit or delete.

### F4. Map
- All saved places as pins, coloured by category.
- **Filter chips** at the top: All / Food / Shopping / Fun (the same chips as My Places). The map zooms to the pins that are left. On Android without a Maps key, the list that replaces the map has the same chips.
- Tap a pin → card with name, note, "Open reel", "Directions" (opens Google Maps / Apple Maps).
- **"Open reel" that can't open** (broken link or deleted reel): a friendly message appears with the choice to **remove the link** from that place. The place itself stays saved. This works the same on the place screen and the map card.

### F5. Nearby reminders
- When the user comes within the chosen radius (default **300 m**) of a saved place, show a local notification:
  **"You're near {place name} — you saved it from a reel 👀"** (if the place has no reel attached: **"… — it's on your Spotted list 👀"**)
- Tapping the notification opens that place's card.
- Uses OS geofencing. OS limits: **iOS max 20 regions, Android max 100**. The app always monitors the **20 nearest** saved places and refreshes the set on significant location change.
- No repeat notification for the same place within **24 hours**.
- Respect **quiet hours** (default 22:00–08:00, no notifications).
- **Daily limit:** at most 2 reminders in any 24 hours (setting: 1 / 2 / 3 / no limit), so a busy day doesn't spam the user.
- **Per place:** on the place screen the user can turn reminders off for that place ("Remind me when I'm near") or mark **"I've been here"**. Muted and visited places are not watched and don't use up the 20 slots.

### F6. Settings
- Reminders on/off.
- Radius: 200 m / 300 m / 500 m / 1 km.
- Quiet hours on/off + times.
- Most reminders per day: 1 / 2 / 3 / no limit (default 2).
- "Delete all my data" button (with confirmation).
- Links: privacy policy, contact support.

### F7. Onboarding
- 3 short welcome screens: Save from reels (Instagram or TikTok) → Confirm the place → Get reminded nearby.
- Permission requests come **after** explaining why (location "Always/Allow all the time", notifications).
- App still works (list + map) if the user refuses background location; reminders are simply off, with a friendly banner explaining how to turn them on.

### F8. Collections
- Every place keeps its **category** (Food, Shopping, Fun).
- On top of that, the user can make their own **collections**, like "Dubai brunch spots" or "Date night".
- A place can be in any number of collections, or none.
- Collections are chosen when saving a place (Add Place) and can be changed any time (place screen).
- **Manage collections** (from Settings): create, rename, delete. Deleting a collection never deletes the places in it.
- Collection names: 1 to 40 characters, unique (ignoring upper/lower case).
- Collections are personal and stay on the phone. Sharing them with friends is Version 2.

### F9. Share a place with a friend
- The place screen has a **Share place** button. It opens the phone's normal share sheet (WhatsApp, Messages, ...).
- The message has the place name, address, your note (if any), a Google Maps link, and the reel link (if any).
- Uses React Native's built-in Share. Nothing is sent to our servers.

### F10. Back up and restore (added after Version 1 planning)
- Version 1 has no cloud, so this is how to keep places when changing phones.
- Settings → **Back up my places** makes one file (`spotted-backup-YYYY-MM-DD.json`) with all places, collections and
  settings, and opens the phone's share menu (Google Drive, email, WhatsApp...). Nothing is sent to our servers.
- Settings → **Restore from a backup** lets the user pick that file.
- Restoring **adds**; it never deletes. A place already on the phone (same id or same Google place) is skipped.
  A collection with the same name is reused. Settings from the file replace the current ones.
- A file that is not a Spotted backup is refused and nothing changes. Damaged places in a file are skipped.

## 5. Out of scope for Version 1 (later)

- User accounts / login / cloud sync
- Business offers and payments (Version 2)
- Shared collections with friends
- Scraping Instagram or TikTok, or reading comments (never; not allowed by the platforms)
- AI / server-side place detection from captions or comments (Version 2, needs a backend)
- Web app

## 6. Screens

1. Welcome (3 slides)
2. Permissions explainer
3. My Places (list) — **home tab**
4. Map — tab
5. Add Place (search + category + note)
6. Place detail / edit
7. Settings — tab
8. Manage collections (opened from Settings)

## 7. Tech stack

| Part | Choice |
|---|---|
| App framework | Expo (React Native) + TypeScript |
| Navigation | Expo Router (tabs) |
| Storage (V1) | On-device only: `expo-sqlite` (or AsyncStorage for a first prototype) |
| Maps | `react-native-maps` (Google Maps on Android, Apple Maps on iOS is fine) |
| Place search | Google Places API (Autocomplete + Place Details) |
| Location & geofencing | `expo-location` + `expo-task-manager` |
| Notifications | `expo-notifications` (local notifications only) |
| Receiving shares | `expo-sharing` share-receiving (experimental) or an equivalent share-intent library |
| Builds & store upload | EAS Build + EAS Submit |
| Code backup | Git + GitHub |

## 8. Data model (on device)

```ts
type Category = 'food' | 'shopping' | 'fun';

interface Collection {
  id: string;            // uuid
  name: string;          // 1-40 characters, unique ignoring case
  createdAt: string;     // ISO date
}

interface SavedPlace {
  id: string;            // uuid
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: Category;
  note?: string;
  reelUrl?: string;
  createdAt: string;     // ISO date
  lastNotifiedAt?: string;
  muted: boolean;              // no reminders for this place
  visitedAt?: string;          // "I've been here" (reminders stop)
  collectionIds: string[]; // the collections this place is in (can be empty)
}

interface Settings {
  remindersEnabled: boolean;   // default true
  radiusMeters: 200 | 300 | 500 | 1000; // default 300
  quietHoursEnabled: boolean;  // default true
  quietStart: string;          // "22:00"
  quietEnd: string;            // "08:00"
  maxRemindersPerDay: number;  // default 2; 0 = no limit
}
```

## 9. Permissions and privacy

- **Location (foreground + background):** only to trigger nearby reminders. Never sent to our servers in V1 (we have none).
- **Notifications:** local only.
- **Data stored:** saved places and settings, on the phone only.
- **Third parties:** Google Places receives search text (including place clues taken from a caption) and approximate location to return results. For a TikTok link, TikTok's oEmbed service receives that link to return the caption.
- Permission text (iOS / Android):
  "Spotted uses your location to remind you when you're near a place you saved — even when the app is closed. Your location stays on your phone."
- Must provide: privacy policy URL, in-app "Delete all my data".

## 10. Design

- Clean, friendly, lots of white space.
- Accent colour: coral `#E8505B`; text `#1F2430`.
- Category colours: Food = coral, Shopping = purple, Fun = teal.
- Rounded cards, large tap targets, works in light and dark mode.

## 11. Secrets

- **Place search key (Places API):** do NOT ship it inside the app. A key inside the app can be extracted, and Google's "restrict to this Android app" lock does not work for plain web requests. Keep it on the small proxy in `server/places-proxy` and put only the proxy address in `.env` as `EXPO_PUBLIC_PLACES_PROXY_URL`. The proxy can also check an optional shared secret (`APP_SHARED_SECRET` on the proxy, `EXPO_PUBLIC_PLACES_PROXY_SECRET` in the app, sent as the `X-Spotted-Key` header). It only keeps casual strangers out, because the value is also inside the app. (For your own testing you may still use `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.)
- **Maps SDK key (the map itself):** a separate key, restricted in Google Cloud to the app's package name (`com.spotted.app`) and to Maps SDK only. It is never written in a file: `app.config.ts` reads it from the `GOOGLE_MAPS_ANDROID_API_KEY` environment variable (an EAS environment variable for builds). `GOOGLE_MAPS_KEY_IN_BUILD` in `src/config.ts` is set to `true` only once the key is in the build.
- **Never commit `.env`.**
- Google Cloud budget alert set (e.g. USD 10/month).

## 12. Done means (acceptance checklist)

- [ ] Sharing a reel from Instagram opens Add Place with the link attached (Android).
- [ ] A place can be searched, saved, edited, deleted.
- [ ] List and map show saved places, filters work.
- [ ] Walking within the radius of a saved place triggers a notification with the app closed.
- [ ] No duplicate notifications for 24 h; quiet hours respected.
- [ ] App works without background location (reminders off + banner).
- [ ] "Delete all my data" clears everything.
- [ ] A place can be saved into collections; collections can be created, renamed, deleted; the filter works.
- [ ] Pasting or sharing a TikTok/Instagram caption suggests the right place; the user confirms before anything is saved.
- [ ] A place can be muted or marked "I've been here", and then never sends reminders; the daily limit works.
- [ ] My Places search and sort, Share place, and the map filter chips work.
- [ ] A backup file can be saved, and restoring it brings every place back without doubling any.
- [ ] `npm test` and `npm run typecheck` pass.
- [ ] No crashes in a 1-week test by 12+ testers.
- [ ] Battery use acceptable after a full day.

## 13. Version 2 preview (do not build yet)

- Accounts + cloud sync (Supabase or Firebase).
- AI place detection: caption (and pasted comments) understood by an AI service, always confirmed by the user.
- Business portal: businesses send offers **only to users who saved their place and opted in**.
- Shared lists ("My Dubai brunch spots").
