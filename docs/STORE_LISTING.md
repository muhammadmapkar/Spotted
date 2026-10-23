# Store listing and form answers

Everything here is ready to copy and paste into **Google Play Console** (Part 1 to 3) and **App Store Connect**
(Part 4). Written in plain words so you can check that every answer is true for your app.

> **Check before you paste:** the forms change from time to time. If a question looks different, choose the answer
> that matches the *meaning* given here, and ask Claude if you are unsure.
> **Be honest in the forms.** Google and Apple check them against what the app really does.

---

# PART 1: Google Play listing

| Field | Text |
|---|---|
| **App name** (max 30) | Spotted |
| **Short description** (max 80) | Save places from reels. Get a gentle reminder when you're nearby. *(65 characters)* |
| **Category** | Travel & Local *(Alternative: Lifestyle)* |
| **Tags** (pick up to 5) | Travel, Maps & navigation, Food & drink, Shopping, Lifestyle |
| **Contact email** | your support email (the one in `src/config.ts`) |
| **Website** | optional; the privacy policy page is fine |
| **Privacy policy** | the GitHub Pages link from MY_STEPS.md (Phase 4B) |

## Full description (max 4000 characters; this is about 1,900)

```
Found a great café, shop or thing to do in a reel, then forgot about it? Spotted fixes that.

Share a reel to Spotted, confirm the place, and relax. When you are close to it later, Spotted gives you a gentle nudge:
"You're near Arabian Tea House — you saved it from a reel 👀"

HOW IT WORKS
1. SAVE: In Instagram or TikTok tap Share, then Spotted. (Or paste the reel link.)
2. CONFIRM: Pick the exact place yourself. Choose Food, Shopping or Fun, and add a note like "try the pistachio croissant".
3. GET REMINDED: Walk past it and your phone reminds you, even when Spotted is closed.

WHAT YOU GET
• A tidy list of every place you saved, with filters for Food, Shopping and Fun
• A map with coloured pins for all your places
• Your own collections, like "Dubai brunch spots" or "Date night"
• Place suggestions from a caption: paste a caption, or share a TikTok link, and Spotted suggests the place (you always confirm)
• Reminders that respect you: quiet hours at night, a daily limit, no repeat for the same place within 24 hours
• Mute a place, or tap "I've been here" and it stops reminding you
• Directions in one tap, and your reel one tap away
• Share a place with a friend
• Light and dark mode

PRIVATE BY DESIGN
• No account, no sign-up, no ads
• Your places and your location stay on your phone
• Delete everything any time in Settings

Spotted uses your location, "Allow all the time", only to remind you when you are near a place you saved. You can turn reminders off in Settings and the rest of the app keeps working.

Spotted is not affiliated with or endorsed by Instagram or TikTok. It does not read your Instagram or TikTok account, comments or feed. It only keeps the link you share.
```

## Graphics Google needs

- App icon: 512 × 512 PNG (use `assets/images/icon.png` resized).
- Feature graphic: 1024 × 500 PNG (coral `#E8505B` background, the pin icon, the words "Save from reels. Get reminded nearby.").
- Phone screenshots: at least 2, best 6 to 8.

## Screenshots to take (phone)

Use a clean test phone with 5 to 8 real-looking places in Dubai. Turn off notifications from other apps first.
Take them in **light mode** (and one or two in dark mode if you like).

1. **My Places**: list with the All / Food / Shopping / Fun chips and 4 or 5 places with distances.
2. **Add Place from a shared reel**: "Reel link attached" and the suggested places below.
3. **Caption suggestion**: the caption box open, with 2 or 3 suggested places.
4. **Map**: real map with coloured pins and a place card open (name, note, Open reel, Directions).
5. **The reminder**: the lock screen with the notification "You're near … — you saved it from a reel 👀".
6. **Place details**: category, "Remind me when I'm near", "I've been here", note, collections.
7. **Collections**: My Places filtered by a collection like "Dubai brunch spots".
8. **Settings**: distance, daily limit and quiet hours.

---

# PART 2: Play Console "App content" answers

Go to **Policy and programs → App content**. Every item must be finished before a test or release.

## 2.1 Privacy policy
The link to your published page.

## 2.2 App access
**All functionality is available without special access.** (There is no login.)

## 2.3 Ads
**No, my app does not contain ads.**

## 2.4 Content rating (IARC questionnaire)
- Email: your support email. Category: **Utility, Productivity, Communication, or Other**.
- Answer **No** to every question: violence, blood, fear, sexual content, bad language, drugs/alcohol/tobacco,
  gambling, user-generated content shared with other people, sharing the user's location with other people,
  digital purchases, unrestricted internet access/web browsing in the app.
  (Spotted opens links in other apps. It does not show user-to-user content.)
- Expected result: **Everyone / PEGI 3 / 3+** (the app only lists places the user chooses).

## 2.5 Target audience and content
- Target age group: **18 and over** (tick only "18 and over").
- Does the app appeal to children? **No.**
- This keeps you out of the stricter "Families" rules.

## 2.6 Other short questions (all "No" for Spotted)
- Government app: **No**. Financial features: **None**. Health features: **None**. News app: **No**.
- COVID-19 contact tracing: **No**. Advertising ID: **No**, the app does not use it.

## 2.7 Data safety form

First question: **Does your app collect or share any of the required user data types?** → **Yes**
(because the text you type in place search, and your approximate location, are sent to Google Places through our relay).

Then: **Is all of the user data collected by your app encrypted in transit?** → **Yes** (all connections use HTTPS).
**Do you provide a way for users to request that their data be deleted?** → **Yes**: Settings → Delete all my data erases
everything on the phone. (We keep no data on any server.)

| Data type | Collected? | Shared? | Why it is used | Optional? | Processed ephemerally? |
|---|---|---|---|---|---|
| **Location → Approximate location** | Yes | No *(sent to Google Places only to return results, as our service provider)* | App functionality | Yes (user can refuse) | Yes |
| **App activity → In-app search history** (the place name typed in search, or the place name found in a caption) | Yes | No *(same reason)* | App functionality | Yes | Yes |
| **Location → Precise location** | **No.** It stays on the phone and is never sent anywhere. | – | – | – | – |
| Everything else (name, email, photos, contacts, financial info, device IDs, crash logs, …) | **No** | – | – | – | – |

Notes:
- "Sharing" in Google's form does not include sending data to a **service provider that works for you** (Google Places
  does the search for us). If Play asks you to change that answer, follow Play's help text.
- The Android map is **Google Maps SDK**. Google publishes what the Maps SDK collects. Open
  <https://developers.google.com/maps/documentation/android-sdk/data-disclosure> and add anything it lists
  (for example approximate/precise location used by the SDK) to the form, so the form matches.
- Do **not** tick "Data is collected for advertising" or "analytics". The app has none.

## 2.8 Location permissions (background location declaration)

Go to **App content → Sensitive app permissions → Location permissions** (it may also be under "Permissions declaration form").
Google asks: *Does your app use background location?* → **Yes**. Then fill in the form like this:

**What feature in your app needs background location? (core feature)**
> Nearby reminders. The user saves places they found in reels. When the user comes within a distance they choose
> (200 m to 1 km) of one of their saved places, Spotted shows a local notification, "You're near {place}". This is the
> main purpose of the app. The user can turn reminders off in Settings at any time.

**Why can the feature not work with foreground location only?**
> The reminder must appear when the user is walking or travelling with the phone in a pocket and the app closed.
> If location only worked while the app was open, the user would have to open Spotted to check whether they are near a
> place, which defeats the purpose. The app uses the operating system's geofencing (it watches the 20 nearest saved places),
> not constant location tracking, to use very little battery.

**How is the location data used and where does it go?**
> It is used only on the phone, to decide when to show the reminder. It is never sent to a server and never shared.

**Where does the app show the "prominent disclosure" before asking?**
> On the second permission screen of onboarding ("Remind me when I am nearby"). It says: *"Spotted uses your location to
> remind you when you're near a place you saved — even when the app is closed. Your location stays on your phone."*
> The user taps **Continue** to agree before the system permission screen appears. The user can also tap **Not now**.

**The video (required):** record it with the script below and upload it to YouTube as **Unlisted**. Paste the link.

### Script for the short video (about 45 to 60 seconds, no talking needed; add short text on screen)

1. *(0:00)* Show the phone home screen. Tap the **Spotted** icon on a fresh install. (Caption: "Opening Spotted for the first time".)
2. *(0:05)* The 3 welcome slides: swipe through quickly.
3. *(0:12)* **Permission explainer screens.** Slow down here. Show the screen titled **"Remind me when I am nearby"** with the
   full text, so it can be read. Tap **Continue**.
4. *(0:20)* The phone's permission screen: choose **Allow all the time** (on Android 11 and newer this opens the settings page:
   choose **Allow all the time** there). Caption: "User gives permission".
5. *(0:30)* Back in Spotted: show **My Places** with one saved place. Open **Settings** and show **Nearby reminders: on** and
   the distance choice.
6. *(0:38)* **Close the app** (swipe it away from recent apps) and lock the phone. Caption: "App closed".
7. *(0:42)* Show the notification arriving: **"You're near … — you saved it from a reel 👀"**.
   Best: a short clip taken while really walking to the place (speed it up if needed).
   Fallback: use a development build and the Settings button "Testing: send a test reminder", with a caption that says it is a test notification.
8. *(0:50)* Tap the notification: the place opens. End.

Tips: record the screen with the phone's built-in recorder; keep it under 2 minutes; make sure the on-screen text can be read.

---

# PART 3: Play Console "Main store listing" extras

- **Default language**: English. You can add Arabic later.
- **App category**: Travel & Local.
- **What's new** (first release): "First version of Spotted. Share a reel, confirm the place, and get reminded when you are nearby."
- **Release name**: `1.0.0 pilot`.

---

# PART 4: App Store (iPhone) listing

| Field | Text |
|---|---|
| **App name** (max 30) | Spotted |
| **Subtitle** (max 30) | Reel places, nearby reminders *(29 characters)* |
| **Primary category** | Travel |
| **Secondary category** | Lifestyle |
| **Age rating** | **4+** (answer "None" to every content question) |
| **Price** | Free |
| **Support URL** | a page with your support email. The privacy policy page is OK if it shows the email. |
| **Privacy Policy URL** | the GitHub Pages link |
| **Copyright** | 2026 Your Name |

**Promotional text** (max 170, can be changed any time):
> Save places from reels and get a gentle reminder when you walk past them. No account. Your places stay on your phone.

**Keywords** (max 100 characters, separated by commas, no spaces; do **not** use other companies' names):
```
places,reels,saved,nearby,reminder,map,restaurants,cafes,shopping,things to do,travel,dubai
```
*(91 characters, including commas.)*

**Description** (max 4000): use the Google Play full description above, but change "Tap Share, then Spotted" if the iPhone share
sheet looks different, and keep the last paragraph ("not affiliated with Instagram or TikTok").

**What's New**: "First version of Spotted."

**Screenshots (required sizes):**
- **iPhone 6.9"** (1320 × 2868) and/or **6.5"** (1284 × 2778): at least 3, up to 10. Same 8 scenes as the list in Part 1.
- **iPad 13"** only if `supportsTablet` is `true` in `app.json` (it is `true` today). If you don't want to take iPad screenshots,
  ask Claude to set `supportsTablet` to `false` before the iOS build.

## App Review notes (paste in "App Review Information → Notes")

```
Spotted lets people save places from reels (Instagram / TikTok) and reminds them when they are near a saved place.
No sign-in is needed.

HOW TO TEST
1. Open the app and go through the welcome screens. Allow location ("Allow While Using", then "Always") and notifications.
2. Tap + and search for a place (for example "Burj Khalifa"). Pick it, choose a category and tap Save.
3. The Map tab shows the saved place.
4. Sharing: in Safari or any app that shares a web link, tap Share and choose Spotted. Spotted opens with the link attached.

BACKGROUND LOCATION ("Always")
Spotted needs "Always" location so it can remind the user when they come close to a saved place while the app is closed.
This is the app's main feature. The app uses region monitoring (geofencing) on the 20 nearest saved places, not continuous tracking.
Location never leaves the phone. The app explains this on its second permission screen before asking, and it still works if the
user refuses (reminders are then off).

The app does not read Instagram or TikTok content. It only stores the link the user shares.
```

## App Privacy ("nutrition label") answers

In App Store Connect → your app → **App Privacy**. Spotted has no accounts, no analytics and no ads, and does not track users.

- **Do you or your third-party partners collect data from this app?** → **Yes** *(the typed search text and approximate location go to Google Places through our relay. Apple counts data sent off the phone as "collected", so choose Yes to be safe.)*

| Data type | Used for | Linked to the user's identity? | Used for tracking? |
|---|---|---|---|
| **Location → Coarse Location** | App Functionality | **No** | **No** |
| **Search History** (the place name typed in search or found in a caption) | App Functionality | **No** | **No** |

- Everything else (contact info, identifiers, usage data, diagnostics, purchases, …) → **Not collected**.
- Precise location is used **only on the phone** and never leaves it, so it is **not** listed.
- **Tracking:** "No, we do not use data for tracking." (No tracking permission pop-up is needed.)
- Tick that you use the standard **encryption** exemption (the app already says `ITSAppUsesNonExemptEncryption = false`),
  so you will not be asked about export compliance on every build.
