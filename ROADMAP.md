# Spotted — Roadmap (what's left, ideas, and phase prompts)

> Written 23 Oct 2026 after a full check of the code against SPEC.md.
> Each phase below has a **prompt** you can copy and paste into Claude Code. Do the phases in order.

---

## 1. Where we are

The app is **almost fully built**. What's missing is mostly *outside* the code: keys, accounts, real-phone testing and the app stores.

| Feature (SPEC.md) | Status | Notes |
|---|---|---|
| F1 Share a reel to Spotted | 🟡 Partly | Code is done. Never tried on a real phone. A reel shared during the very first launch (welcome screens) may be lost. |
| F1b Place suggestions from a caption | ✅ Done | TikTok works automatically; Instagram uses "Paste caption". Not yet tried on many real reels. |
| F2 Confirm and save a place | ✅ Done | Real Google search only works after the proxy is set up (Phase 1). Until then: demo list of Dubai places. |
| F3 My Places list | ✅ Done | |
| F4 Map | 🟡 Partly | On Android the map is switched off (shows a list) until a Maps key is added. No category filters on the map. |
| F5 Nearby reminders | 🟡 Built, not tested | All rules are coded and unit-tested. Never tested by actually walking past a place. |
| F6 Settings | 🟡 Almost | Privacy policy link says "coming soon". |
| F7 Onboarding | ✅ Done | Welcome slides only mention Instagram, not TikTok. |
| F8 Collections | ✅ Done | |

**Checks:** `npm test` (21 of 21 pass) and `npm run typecheck` (clean) both pass today.

**Git:** the newest work is on the branch `improvements-round-1` and is **not merged into `main` yet**.

---

## 2. What's left before launch (checklist)

**Code / setup**
- [x] Merge `improvements-round-1` into `main`
- [x] Commit `docs/team-split.html`. The `owner` in `app.json` (`sarahnaziahmed-debug`) was checked: it is the correct Expo username (GitHub's is spelled differently, which is fine).
- [ ] Deploy the Places proxy (`server/places-proxy`) and give the app its address
- [ ] Add the Maps key so the Android map shows. Add category filters to the map.
- [ ] Add missing error handling (place screen, settings) and a loading spinner on the place screen
- [ ] Add accessibility labels (switches, arrow symbols)
- [ ] Set a notification icon and colour
- [ ] Don't lose a reel shared during the first launch
- [ ] Mention TikTok on the welcome slides
- [ ] Add tests for the database, collections and filters

**Real-world testing**
- [ ] Walk past a saved place with the app closed → reminder arrives
- [ ] Test with location / notifications refused
- [ ] Battery use over a full day, on 2–3 phone brands
- [ ] Pilot with 12+ testers for 14 days (`docs/PILOT.md`)

**Legal and stores**
- [ ] Publish the privacy policy and put its link in `src/config.ts`
- [ ] A real support email
- [ ] Google Play: developer account, listing, screenshots, Data Safety form, background location form and video, closed test
- [ ] Apple: developer account, iPhone build, share extension tested, App Store listing and privacy answers

---

## 3. Ideas worth adding

### Small ones (fit Version 1.1: still on the phone, no server needed)
1. **Buttons on the reminder notification.** Add "I've been here" and "Not now" so you don't have to open the app.
2. **Back up / restore.** Save all your places to a file and load them back. Right now, deleting the app or changing phones loses everything, because there's no cloud yet.
3. **Share a place with a friend.** Send the name, a Google Maps link and the reel link in WhatsApp or another app.
4. **Search inside My Places.** A search box for when the list gets long.
5. **Sort by nearest.** Show the closest places first, alongside the current "newest first".
6. **TikTok on the welcome slides.** The app already supports it.
7. **Friendly "reel not found" message.** Show it when a saved reel link was deleted.

### Bigger ones (Version 2, already in SPEC.md, need a server)
- Accounts and cloud sync
- AI that reads the caption and suggests the place
- Shared collections with friends
- Business offers, only to people who saved that place and opted in

👉 Decide on Version 2 **after** the pilot. The pilot tells you whether people actually use reminders.

---

## 4. Phases

**Legend:** 🧑 = something you do yourself (accounts, money, clicking in websites, walking with your phone).

---

### Phase 0: Tidy up (≈1 hour)

**Goal:** all finished work is on `main`, and small mistakes are fixed.
**Done when:** `main` has everything, the checks pass, and nothing is left uncommitted.
**You do:** nothing, except saying OK.

**Prompt:**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. We are doing Phase 0 (Tidy up).
1. Check git status. Commit docs/team-split.html on the branch improvements-round-1.
2. In app.json, check the "owner" field against my Expo account name. Ask me what my exact Expo
   username is before changing it.
3. Run npm run typecheck and npm test. Both must pass.
4. Explain in simple words what merging improvements-round-1 into main means, then wait for my OK.
   After my OK, merge it into main and push.
Stop and tell me what changed.
```

---

### Phase 1: Real place search + Android map (≈half a day, plus your setup time)

**Goal:** searching uses real Google results, and the map shows on Android.
**Done when:** a new preview build finds real Dubai places and shows the map with coloured pins.
**You do 🧑:**
1. Google Cloud: create two API keys (Places, and Maps SDK for Android/iOS).
2. Set a budget alert of USD 10 a month.
3. Create a free Cloudflare account.

**Prompt:**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. We are doing Phase 1 (Real search + Android map).
Work on a new branch called phase-1-keys.
1. Read server/places-proxy and its README. Check the rate-limit setting in its wrangler config
   still uses current Cloudflare syntax; fix it if not. Consider adding a simple shared secret
   header so random people can't use my proxy, and tell me if it is worth it.
2. Give me numbered steps to: make the Google keys (Places key and a separate Maps SDK key restricted
   to com.spotted.app), set a USD 10 budget alert, and deploy the proxy to Cloudflare.
   Wait for me to finish each part.
3. Give me the steps to add EXPO_PUBLIC_PLACES_PROXY_URL as an EAS environment variable.
4. Add the Maps SDK key to app.json the safe way (from an EAS environment variable, not written
   into the file), then set GOOGLE_MAPS_KEY_IN_BUILD to true in src/config.ts.
5. Add Food / Shopping / Fun filter chips to the map (src/components/LiveMap.tsx, app/(tabs)/map.tsx),
   reusing src/placeFilters.ts.
6. Run typecheck and tests. Ask before starting any eas build (it uses my free build quota).
Stop and tell me how to test it on my phone.
```

---

### Phase 2: Polish and safety fixes (≈1 day)

**Goal:** the app doesn't break on errors, works with screen readers, and looks finished.
**Done when:** all items below are fixed, the new tests pass, and nothing crashes.
**You do:** nothing until the test at the end.

**Prompt:**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. We are doing Phase 2 (Polish and safety fixes).
Work on a new branch called phase-2-polish. Do these one at a time, and tell me after each:
1. app/place/[id].tsx: add error handling for loading, saving and deleting a place (show a friendly
   message instead of crashing), and a loading spinner instead of a blank screen.
2. app/(tabs)/settings.tsx: handle errors when a setting fails to save.
3. Accessibility: give every Switch and icon-only button an accessibilityLabel, and hide decorative
   arrow characters (▶ ▾ ▸ ›) from screen readers.
4. app.json: set a notification icon and the coral colour (#E8505B) for expo-notifications.
5. src/share/ShareIntentHandler.tsx: if someone shares a reel during the welcome / permission
   screens, remember it and open Add Place with it once onboarding finishes.
6. app/welcome.tsx: mention TikTok as well as Instagram.
7. Add tests for src/db (places, collections, delete all data) and src/placeFilters.ts, using the
   existing helper in tests/helpers.ts.
Run typecheck and tests at the end. Tell me which changes need a new development build.
```

---

### Phase 3: Real-phone testing on Android (≈1 week, mostly you)

**Goal:** prove that reminders really work in daily life, without draining the battery.
**Done when:** the reminder arrives when walking past a place with the app closed, there are no crashes, and battery use is OK on 2–3 phones.
**You do 🧑:** install the test app, walk past places, and note what happens. Borrow 1–2 other Android phones (Samsung, Xiaomi, etc.).

**Prompt:**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. We are doing Phase 3 (Real-phone testing on Android).
1. Make me a simple test sheet (a markdown file in docs/TEST_PLAN.md) with numbered tests I can tick:
   share from Instagram, share from TikTok, caption suggestion, save/edit/delete, map, walk-by
   reminder with app closed, no repeat within 24 h, quiet hours, daily limit, mute, "I've been here",
   location refused, notifications refused, delete all data, battery after a full day.
   For each test: what to do, and what should happen.
2. Tell me how to turn off battery saving for Spotted on Samsung, Xiaomi and Pixel phones.
3. Ask me before starting the preview build (eas build --profile preview --platform android).
Then wait. When I come back with results, fix the bugs one at a time on a branch called
phase-3-fixes, and tell me how to re-test each.
```

---

### Phase 4: Privacy policy + Google Play closed test / pilot (≈2–3 weeks)

**Goal:** Spotted is on Google Play as a **closed test**, and 12+ real testers use it for 14 days. That is Google's rule for new personal accounts, and it is also the pilot from `docs/PILOT.md`.
**Done when:** 12+ testers have used it for 14 days, and you've collected the pilot answers.
**You do 🧑:**
- Pay USD 25 for the Google Play developer account.
- Pick a support email.
- Find 12+ testers.
- Fill in the Play Console forms (Claude writes the text for you).
- Record a short video of the background-location feature.

**Prompt:**
```
Read SPEC.md, CLAUDE.md, ROADMAP.md and docs/PILOT.md first. We are doing Phase 4
(Privacy policy + Google Play closed test). Work on a branch called phase-4-play.
1. Finish docs/PRIVACY_POLICY.md (fill the [date] and [your contact email] placeholders; ask me for
   the real support email). Give me numbered steps to publish it for free (for example GitHub Pages),
   then put the link in src/config.ts (PRIVACY_POLICY_URL) and the support email in SUPPORT_EMAIL.
2. Write docs/STORE_LISTING.md with: app name, short description (80 characters max), full
   description, category, and a list of the screenshots I should take.
3. Write the answers I need for the Play Console: Data Safety form, the background location
   permission declaration (and a script for the short video Google asks for), content rating, and
   target audience.
4. Give me numbered steps to: create the Play developer account, create the app, set up a closed
   testing track, and invite testers.
5. Set up eas.json submit settings for Android, and ask me before running the production build.
6. Write a short message I can send to testers (how to join, what to do, and the day-7 and day-14
   questions from docs/PILOT.md).
Stop after each numbered part and tell me what I need to do.
```

---

### Phase 5: iPhone (≈1–2 weeks)

**Goal:** Spotted works on iPhone, including sharing from Instagram.
**Done when:** a TestFlight build on a real iPhone can share a reel to Spotted and get a nearby reminder.
**You do 🧑:** pay USD 99 a year for the Apple Developer Program, test on an iPhone, and collect about 20 real reel captions.

**Prompt:**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. We are doing Phase 5 (iPhone).
Work on a branch called phase-5-ios.
1. Give me numbered steps to join the Apple Developer Program and create the app in App Store Connect.
2. Check the iOS settings in app.json (share extension, location permission text, background modes).
   Ask me before starting eas build --profile production --platform ios. Explain the credentials
   EAS will ask for (the app AND the ShareExtension target).
3. Tell me how to install it with TestFlight and give me an iPhone test list (same as
   docs/TEST_PLAN.md, plus the share extension).
4. I will paste about 20 real reel captions. Use them to improve src/places/clues.ts and add each as a
   test in tests/clues.test.ts.
5. Write the App Store listing text and App Privacy answers in docs/STORE_LISTING.md.
Stop after each part.
```

---

### Phase 6: Launch (≈2–3 days of work, plus waiting for store review)

**Goal:** Spotted is live on Google Play and the App Store.
**Done when:** anyone can download it in the UAE (and worldwide if you choose).
**You do 🧑:** press "Submit for review" in both stores, and reply to any review questions.

**Prompt:**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. We are doing Phase 6 (Launch).
1. Go through the "Before store submission" list in CLAUDE.md and the "Done means" list in SPEC.md.
   Tell me what is ticked and what is not.
2. Make sure version numbers in app.json are right, and that the Testing buttons are hidden in
   production builds.
3. Ask me before running the production builds for Android and iOS, then help me submit with
   eas submit.
4. Give me a simple checklist for launch week: what to watch (crashes, reviews, Google billing),
   and how to reply to store reviewers.
Stop and tell me what's left for me to click.
```

---

### Phase 7: Version 1.1 extras (≈half a day each)

Do these **after launch**, one at a time, in the order the pilot feedback suggests. Each one gets its own branch and its own prompt.

**7a. Buttons on the notification**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. Add two buttons to the nearby reminder notification:
"I've been here" (marks the place visited) and "Not now" (no reminder for this place for 7 days).
Look at src/geofence (notifications and tasks) and reuse the existing visited/muted logic.
Add tests for any new rules in tests/rules.test.ts. Update SPEC.md. Work on a new branch.
Stop and tell me how to test it.
```

**7b. Back up and restore**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. In Settings, add "Back up my places" (saves places,
collections and settings to a file I can share or save to Google Drive/iCloud) and "Restore from
backup" (loads that file, without making duplicates). Use src/db. Add tests. Ask before installing
any new package. Update SPEC.md. Work on a new branch. Stop and tell me how to test it.
```

**7c. Share a place with a friend**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. On the place screen (app/place/[id].tsx) add a
"Share" button that sends: place name, my note, a Google Maps link and the reel link, using the
phone's normal share sheet. Update SPEC.md. Work on a new branch. Stop and tell me how to test it.
```

**7d. Search and "nearest first" in My Places**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. In My Places (app/(tabs)/index.tsx) add a search box
(name, area, note) and a sort switch: "Newest" / "Nearest" (nearest only when location is allowed).
Put the logic in src/placeFilters.ts and add tests. Update SPEC.md. Work on a new branch.
Stop and tell me how to test it.
```

**7e. Friendly "reel not found"**
```
Read SPEC.md, CLAUDE.md and ROADMAP.md first. When "Open reel" can't open the link
(src/openLink.ts), show a friendly message instead of nothing, with the option to remove the reel
link from that place. Work on a new branch. Stop and tell me how to test it.
```

---

### Phase 8: Version 2 (big, decide after the pilot)

Only start this if the pilot shows that people save places **and** act on reminders.
**It needs:**
- A backend (Supabase or Firebase)
- Accounts and login
- A new privacy policy
- Monthly running costs

**Prompt (planning only, no code):**
```
Read SPEC.md, CLAUDE.md, ROADMAP.md and the pilot results I will paste. Help me plan Version 2:
accounts + cloud sync, AI place detection from captions, shared collections, and business offers.
For each: what it needs, rough monthly cost, risks (privacy, store rules), and which one to build
first. Don't write any code yet — write the plan to docs/V2_PLAN.md.
```

---

## 5. How much work is left (rough)

| Phase | Building (Claude + you) | Waiting / testing |
|---|---|---|
| 0 Tidy up | ~1 hour | — |
| 1 Search + map | ~half a day | Your setup in Google/Cloudflare |
| 2 Polish | ~1 day | — |
| 3 Android testing | a few fixes | ~1 week of walking around |
| 4 Play + pilot | ~1 day of writing/forms | **14 days** of the closed test (Google rule) |
| 5 iPhone | ~1–2 days | Apple account setup + TestFlight testing |
| 6 Launch | ~1 day | Store review (often 1–7 days) |

**Total:** about **3–5 days of actual work**, but about **5–7 weeks on the calendar**, mostly because of real-life testing and the 14-day Google Play test.

**Tip:** Phase 5 (iPhone) can run at the same time as Phase 4's 14-day test, which saves about 2 weeks.
