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

### F1b. Place suggestions from a caption (added after Version 1 planning)
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
- List of saved places, newest first.
- Filter chips: All / Food / Shopping / Fun.
- A second row of chips filters by collection (shown only when the user has collections). Category and collection filters combine.
- Each item shows name, area, category, distance from user (if location allowed).
- Swipe or long-press to edit or delete.

### F4. Map
- All saved places as pins, coloured by category.
- Tap a pin → card with name, note, "Open reel", "Directions" (opens Google Maps / Apple Maps).

### F5. Nearby reminders
- When the user comes within the chosen radius (default **300 m**) of a saved place, show a local notification:
  **"You're near {place name} — you saved it from a reel 👀"**
- Tapping the notification opens that place's card.
- Uses OS geofencing. OS limits: **iOS max 20 regions, Android max 100**. The app always monitors the **20 nearest** saved places and refreshes the set on significant location change.
- No repeat notification for the same place within **24 hours**.
- Respect **quiet hours** (default 22:00–08:00, no notifications).

### F6. Settings
- Reminders on/off.
- Radius: 200 m / 300 m / 500 m / 1 km.
- Quiet hours on/off + times.
- "Delete all my data" button (with confirmation).
- Links: privacy policy, contact support.

### F7. Onboarding
- 3 short welcome screens: Save from reels → Confirm the place → Get reminded nearby.
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

## 5. Out of scope for Version 1 (later)

- User accounts / login / cloud sync
- Business offers and payments (Version 2)
- Shared collections with friends
- Scraping Instagram or TikTok, or reading comments (never; not allowed by the platforms)
- AI / server-side place detection from captions or comments (Version 2, needs a backend)
- Web app

## 6. Screens

0. Animated splash (on every app start; tap to skip)
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
  collectionIds: string[]; // the collections this place is in (can be empty)
}

interface Settings {
  remindersEnabled: boolean;   // default true
  radiusMeters: 200 | 300 | 500 | 1000; // default 300
  quietHoursEnabled: boolean;  // default true
  quietStart: string;          // "22:00"
  quietEnd: string;            // "08:00"
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

The visual source of truth is the design prototype (`spotted-prototype-reference.html`): its CSS has the exact colours, sizes and animation timings. The colours live in code in `constants/Theme.ts`.

- **Brand: purple.** Clean, friendly, rounded cards, lots of white space.
- **Light mode:** page `#F6F2FB`, cards `#FFFFFF`, text `#1C0F2E`, soft text `#5E4F72`, brand and buttons `#6A1FB0`, saved marks and alerts red `#D62839`.
- **Dark mode:** page `#120A1F`, cards `#1E1231`, text `#F4EEFC`, soft text `#BBABD4`, brand `#A061F0`, buttons `#7B2CD6`, red `#F0475A`.
- **Font:** Poppins (weights 400 to 800).
- **Category colours** (the Saved folders): Food orange to red (`#F4A259` to `#D62839`), Shopping pink to purple (`#F15BB5` to `#7209B7`), Fun light blue to blue (`#4CC9F0` to `#3451D1`).
- Large tap targets (at least 44 x 44), light and dark mode, readable text contrast in both.
- **Motion:** friendly animations, and every animation respects the phone's Reduce Motion setting.
- **Never** use eyes, faces or any human features in icons, illustrations or animations. **No emoji** in the UI.
- Older screens still use the first coral palette (`constants/Colors.ts`) until they are redesigned. The app icon will follow the purple brand later.

## 11. Secrets

- Google API key in `.env` as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — **never commit `.env`**.
- Restrict the key in Google Cloud to the app's package name (`com.spotted.app`) and only the needed APIs.
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
- [ ] No crashes in a 1-week test by 12+ testers.
- [ ] Battery use acceptable after a full day.

## 13. Version 2 preview (do not build yet)

- Accounts + cloud sync (Supabase or Firebase).
- AI place detection: caption (and pasted comments) understood by an AI service, always confirmed by the user.
- Business portal: businesses send offers **only to users who saved their place and opted in**.
- Shared lists ("My Dubai brunch spots").
