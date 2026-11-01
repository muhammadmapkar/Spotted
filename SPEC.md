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

### F3. Places from reels (list, opened from the Saved tab)
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
- When the user comes within the chosen radius (default **300 m**) of a saved place, show a local notification (no emoji):
  **Title:** "A place you saved is 1.2 km away" (the real distance; "A place you saved is nearby" if the distance is unknown)
  **Body:** "Saffron Lane · 5 influencers recommend it" (just the name when no influencer recommends it)
- This works for the saved Spotted places (Saved tab) and for places saved from reels.
- Tapping the notification opens that place: the Place page for a Spotted place, the place's own page for a place saved from a reel.
- If the app is open when an alert arrives, a banner slides down from the top instead of the phone's own banner (tap it to open the place; it goes away after 6.5 seconds).
- A reminder for a place saved from a reel has two buttons: **"I've been here"** (marks it visited) and **"Not now"** (no reminders for that place for 7 days).
- **Remind me at a time** (place page): this evening, tomorrow, Saturday or in a week. Title "Time to try a place you saved", body "{name} · you planned to go today".
- Uses OS geofencing. OS limits: **iOS max 20 regions, Android max 100**. The app always monitors the **20 nearest** saved places and refreshes the set on significant location change.
- No repeat notification for the same place within **24 hours**.
- Respect **quiet hours** (default 22:00–08:00, no notifications).
- **Daily limit:** at most 2 reminders in any 24 hours (setting: 1 / 2 / 3 / no limit), so a busy day doesn't spam the user.
- **Per place:** on the place screen the user can turn reminders off for that place ("Remind me when I'm near") or mark **"I've been here"**. Muted and visited places are not watched and don't use up the 20 slots.
- **Buttons on the reminder** (added after Version 1 planning): **"I've been here"** marks the place as visited, and
  **"Not now"** pauses reminders for that place for **7 days**. Both work without opening the app (on Android, a
  background job does it; on iPhone this still needs testing). The list shows "⏸ Paused for now" while paused.

### F6. Settings
- Reminders on/off.
- Radius: 200 m / 300 m / 500 m / 1 km.
- Quiet hours on/off + times.
- Most reminders per day: 1 / 2 / 3 / no limit (default 2).
- "Delete all my data" button (with confirmation).
- Links: privacy policy, contact support.

### F7. Onboarding
- 3 short welcome screens: Save from reels (Instagram or TikTok) → Confirm the place → Get reminded nearby.
- Permission requests come **after** explaining why: location "while using the app" and notifications. Location "all the time" is asked ONLY when the user turns on "Nearby saved-place alerts" in Profile, after a clear explanation.
- App still works (list + map) if the user refuses background location; reminders are simply off, with a friendly banner explaining how to turn them on.

### F9. Sign in (local demo)
Added from the redesign. There is **no server** in Version 1, so this is a demo sign-in that lives only on the phone.
- **Step 1, phone:** a country code picker (United Arab Emirates +971 first) and the phone number. "Send code".
- **Step 2, code:** 6 boxes. The SMS is **fake**: the code is always `123456`. Wrong code: the boxes shake and say "That code didn't match. Please try again." There is a "Resend code" countdown and "Change number".
- **Step 3, details (first time on this phone only):** name and email, then "Start exploring".
- The signed-in user (phone, name, email) is saved **on the phone only** and stays signed in after a restart.
- **Delete all my data** also signs the user out and removes the saved profile.
- The fake SMS sits behind one file (`src/services/auth.ts`). A real SMS service replaces it in Version 2, with a backend.

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

### F11. Rate a place after visiting (added after Version 1 planning)
- When **"I've been here"** is on, the place screen asks **"How was it?"**: **Loved it** or **Not for me**.
- Tapping the chosen answer again clears it. Turning "I've been here" off clears the rating too.
- My Places shows it next to "✓ Been here". The rating is kept in backups.

### F12. Plan my weekend (added after Version 1 planning)
- A **"✨ Plan my weekend"** button on My Places (shown when there is at least one place not visited yet).
- It suggests **3 saved places you haven't been to**, picked from the 10 closest (or from all, without location),
  mixing Food, Shopping and Fun when it can. Closest first.
- **Shuffle** gives another 3; tapping a place opens it. All on the phone, no server.

### F13. Add many reels at once (added after Version 1 planning)
- Add Place has a link **"Have lots of reels? Add them all at once"**. It opens **Add many reels**.
- The user pastes any text with many Instagram/TikTok links. Every link is found, tidied and added to **Reels to sort**.
  Links already waiting, or already saved on a place, are skipped.
- Tapping a waiting reel opens Add Place with that link (with caption suggestions as in F1b). The user confirms the
  place as usual; once it is saved, the reel leaves the list. A ✕ removes a reel without saving it.
- Places from reels shows **"N reels waiting to be sorted"** while the list is not empty.
- Stored on the phone (table `inbox`). "Delete all my data" empties it. Not part of backups.

### F14. Remind me at a time (added after Version 1 planning)
- The place screen has **"Remind me at a time"** with ready-made choices: **This evening, 7 pm** (only if at least
  30 minutes away), **Tomorrow, 7 pm**, **Saturday, 11 am** (the next Saturday, never today), **In a week, 7 pm**.
- Tapping one sets it straight away (no Save needed): a local notification **"Time to try {name}! You planned to go
  today."** Tapping it opens the place. One timed reminder per place; **Cancel** removes it.
- It is the user's own choice, so quiet hours and the daily limit don't apply. It also works without location.
- The place screen shows "Sat 7 Nov, 11:00" while it is waiting. Deleting the place or all data cancels it.
  Timed reminders are not restored from backups.

### F10. Back up and restore (added after Version 1 planning)
- Version 1 has no cloud, so this is how to keep places when changing phones.
- Settings → **Back up my places** makes one file (`spotted-backup-YYYY-MM-DD.json`) with all places, collections and
  settings, and opens the phone's share menu (Google Drive, email, WhatsApp...). Nothing is sent to our servers.
- Settings → **Restore from a backup** lets the user pick that file.
- Restoring **adds**; it never deletes. A place already on the phone (same id or same Google place) is skipped.
  A collection with the same name is reused. Settings from the file replace the current ones.
- A file that is not a Spotted backup is refused and nothing changes. Damaged places in a file are skipped.

## 5. Out of scope for Version 1 (later)

- Real accounts: a server, real SMS codes, and cloud sync (Version 2). Version 1 has only the local demo sign-in (F9).
- Business offers and payments (Version 2)
- Shared collections with friends
- Scraping Instagram or TikTok, or reading comments (never; not allowed by the platforms)
- AI / server-side place detection from captions or comments (Version 2, needs a backend)
- Web app

## 6. Screens

0. Animated splash (on every app start; tap to skip)
1. Welcome (3 slides)
2. Permissions explainer
3. Saved (folders of saved places) — tab; "Places from reels" (the original list) opens from it
4. Map — tab
5. Add Place (search + category + note)
6. Place detail / edit
7. Settings (opened from the Profile tab)
8. Manage collections (opened from Settings)
9. Sign in: phone, code, details (shown when signed out, after the splash)
10. Home, New In and Profile — tabs from the redesign (placeholders until they are built)

**Home (from the prototype):** "You're in {District, City}" (from the phone's location; a sample area if location is refused), then "Saved places near you": a row of up to 10 circles of saved places within 15 km, nearest first, showing the distance under each (a bright rotating ring under 5 km, a softer one from 5 to 15 km). Then a search bar that types example searches and a filter button with a count badge. Typing searches all nearby places by name, category, tags and menu items, plus influencers by handle, with Spotted Partners first. With nothing typed, an "Explore nearby" feed shows every place within 15 km, partners first, then nearest. While the design is built, the places, influencers and offers are **sample data** (`src/data/mock.ts`).

**Place page (from the prototype):** slides in from the right. A hero picture (the place's photo if it has one, otherwise the drawn shop front in the place's colours; it slowly zooms out), a back button, and a "Spotted Partner" badge for partners. Then the name and "Category · AED lo–hi per person · distance". Buttons: **Location** (opens Google Maps at the place), **Menu**, and a save/unsave bookmark with a short message. Two dropdowns: **Influencer recommendations** (open by default; each influencer's profile circle opens their page, and a small platform icon under it opens that exact reel) and **Offers** (closed by default: Fazaa/Esaad partner discounts, and Spotted offers such as the stamp card). **Menu** slides up a sheet with a close button: the menu PDF inside the app when the place has a `menuPdfUrl`, otherwise the items drawn like a paper menu. Only web (https) links are ever opened.

**Influencer page (from the prototype):** slides in from the right. The profile picture (or a gradient with their initial) sits in a slowly turning rainbow ring that zooms in, with the @handle, followers and niche beside it. Under it, one button per platform (Instagram / TikTok / YouTube) that pops in; a tap opens their profile in that app, or on the website if the app is not installed. **This month's top 7** (with a month chip) is a row of swipeable numbered cards, each with the place picture, name, category, distance and the items they recommend with prices; the cards fan in from the right and a tap opens the Place page. **All recommendations** lists every place they picked or made reels about, each with a play button that opens that reel. Influencers are found from Home search and from the Place page.

**Profile tab (from the prototype):** a round initial on a purple-to-red gradient inside a turning ring (no photo, no person icon), the name, email and phone number with a green verified tick. A purple **"You've saved with Spotted"** card whose big AED number counts up from 0 each time the tab opens, with a little gold coin burst and the split between Spotted / Esaad / Fazaa (sample values for now). **My loyalty cards**: swipeable cards, one per restaurant, with the logo, "4 of 6 stamps", six stamp slots (the stamped ones press in one by one, the next one glows gold), "Now 10% off" and the next level; the discount rises with the stamps up to a maximum of 25% (0, 0, 5, 5, 10, 15, 25 percent at 0 to 6 stamps); tapping a card opens the place. **Notifications**: "Get new offers on WhatsApp" (green when on; it ONLY controls new offers going to WhatsApp; the choice is saved with the profile on the phone and is OFF until the person turns it on), "Nearby saved-place alerts" (normal app notifications, the same switch as Nearby reminders in Settings), and "Dark mode". Settings and Sign out are at the bottom.

**New In tab (from the prototype):** everything is within 15 km of the user, and the sections slide in one after another. **New offers**: horizontal cards with the place's picture or colours on top, a shimmering red "NEW" badge, the source (Fazaa / Esaad / Spotted), the offer text, place name and distance, and the time left in red; tapping one opens the Place page with the Offers dropdown already open. **New influencers on Spotted**: circles with the profile picture (or initial), the handle and a "JUST JOINED" badge, opening the Influencer page. **New places on Spotted**: place cards of shops and restaurants that just joined as Spotted Partners, with "JUST JOINED" and "Spotted Partner" badges. Opening the tab clears the red dot on its icon.

**Map tab (from the prototype):** centred on the user's location (the sample area if location is refused) with a pulsing blue dot and a 15 km circle (dashed purple border, light purple fill). Pins pop in one by one: saved places are small red bookmarks, Spotted Partners you have not saved are purple pins. A floating card at the top shows "Map", a "15 km around you" chip and a legend (Saved, Spotted Partner, You). Tapping a pin makes it bigger and shows a card above the tab bar with the place logo, name, category, price, distance and an **Open** button to the Place page; tapping empty ground closes it. In dark mode the Google map uses a custom dark style. On Android the Google map needs a Google Maps key in the build; until then a drawn preview of the same screen is shown (so the app never crashes). The original map of places saved from reels opens from "Places from reels".

**Saved tab (from the prototype):** the title "Saved" and "N places you've spotted", then a search bar "Search your saved places…" that searches ONLY the user's saved places (name, category, tags, menu items), with the same filter button and chips as Home. With nothing typed and no filter on, it shows four folder tiles in two columns: **All saved, Food, Shopping, Fun**. Each is a coloured gradient card with up to three overlapping place logos and the count, and the tiles pop in. Tapping a folder lists its places as place cards, with a back arrow and the folder name. Saving a place puts it in the folder of its group (Food / Shopping / Fun). The saved places are kept on the phone through one small file (`src/services/savedPlaces.ts`), so they survive restarts and can move to a backend later. The older list of places saved from reels (with the + button) is still there, reached from a link at the bottom of the Saved tab.

**Filter sheet (from the prototype):** opened from the filter button next to a search bar (Home now, the Saved tab next). It slides up from the bottom and has: a budget slider "How much do you want to spend today?" per person (AED 20 to 500+; the top value means "Any budget"; the big number follows the slider), distance chips (1, 5, 10, 15 km), category chips (All, Food, Shopping, Fun, Indian, Mexican, Café), two switches (Spotted by influencers only; Has offers), "Reset", and a big "Show N places" button with the live count. A place passes the budget if its lowest price per person fits. There is ONE shared filter state; active filters show as removable chips under the search bar, and results glide to their new places.

**The bottom bar:** Saved · Map · **Home** (the raised centre button, opens first) · New In · Profile. A red dot on New In shows until it is opened. Profile shows the user's first initial.

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
  snoozedUntil?: string;       // "Not now" on a reminder: paused until this date
  rating?: 1 | -1;             // after visiting: 1 = loved it, -1 = not for me
  remindAt?: string;           // "Remind me at a time": when it goes off
  remindNotificationId?: string; // the phone's id for it, to cancel it
  collectionIds: string[]; // the collections this place is in (can be empty)
}

interface UserProfile {
  phone: string;         // international format, e.g. "+971501234567"
  name: string;
  email: string;
  createdAt: string;     // ISO date
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
- **Data stored:** saved places, collections, settings, and the demo sign-in profile (phone, name, email), on the phone only.
- **Third parties:** Google Places receives search text (including place clues taken from a caption) and approximate location to return results. For a TikTok link, TikTok's oEmbed service receives that link to return the caption.
- Permission text (iOS / Android):
  "Spotted uses your location to tell you when a place you saved is nearby, even when the app is closed. Your location stays on your phone." (while using the app: "Spotted uses your location while the app is open, to show how far saved places are and to find places near you. Your location stays on your phone.")
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
- The older screens (Add place, the edit page, Collections, Settings, the welcome slides, "Places from reels") now use the same purple look (`constants/Colors.ts` holds the same colours), and have no emoji. The app icon image is still the first coral one and needs a new picture (not done yet).
- Every button is at least 44 x 44 and has a role and a name for screen readers; switches sit inside a 56 x 48 button. White letters on bright gradients have a soft shadow, and every colour pair is checked for contrast in both themes by the tests.

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
- [ ] Sign in works: phone, code (123456 in the demo), details; the user stays signed in after a restart; Delete all my data signs out.
- [ ] A place can be muted or marked "I've been here", and then never sends reminders; the daily limit works.
- [ ] My Places search and sort, Share place, and the map filter chips work.
- [ ] A backup file can be saved, and restoring it brings every place back without doubling any.
- [ ] Reminder buttons, rating, Plan my weekend, Add many reels and Remind me at a time work (TEST_PLAN 21-25).
- [ ] `npm test` and `npm run typecheck` pass.
- [ ] No crashes in a 1-week test by 12+ testers.
- [ ] Battery use acceptable after a full day.

## 13. Version 2 preview (do not build yet)

- Accounts + cloud sync (Supabase or Firebase).
- AI place detection: caption (and pasted comments) understood by an AI service, always confirmed by the user.
- Business portal: businesses send offers **only to users who saved their place and opted in**.
- Shared lists ("My Dubai brunch spots").
