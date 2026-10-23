# My steps (things only Sarah can do)

> Claude wrote the code. These are the jobs that need **you**: accounts, money, clicking in websites,
> testing on your phone. Do them **in order**. Tick each box when it is done.
>
> Everything here was written while you were away, so nothing below has been tried by Claude on a real
> phone or in a real account. If a screen looks different from what is written, go with what you see
> and tell Claude.

**The order**

| # | Phase | What you do | New build needed after? |
|---|---|---|---|
| 0 | Branches | Compare and merge the branches carefully | – |
| 1 | Real search + Android map | Google keys, budget alert, Cloudflare proxy, EAS variables, flip the map switch | **Yes** |
| 2 | Polish and safety | Nothing, only check things in the new build | **Yes** (same build as Phase 1) |
| 3 | Real-phone test | Walk around with the test sheet | uses the Phase 1/2 build |
| 4 | Privacy policy + Google Play | Publish the policy, Play account (USD 25), closed test with 12+ testers for 14 days | **Yes** (production build for Play) |
| 5 | iPhone | Apple account (USD 99/year), TestFlight, 20 real captions | iPhone build |
| 6 | Launch | See ROADMAP.md Phase 6 (Claude helps when you get there) | – |
| 7 | Extras | Quickly check the 3 small new features | no |

**Quick tip:** do Phase 1 first, then make ONE new build that includes everything from Phases 1 and 2.
That saves your free build quota. `eas build` is never started by Claude: you start it.

---

## Phase 0: Branches (before anything else)

1. [ ] `main` has a separate redesign that you made. The branches `main`, `improvements-round-1` and
   `cloud-work` have **not** been merged. Before merging anything, ask Claude:
   *"Compare `main` and `cloud-work` and tell me what each one changed."* Then decide what to keep.
2. [ ] Do not merge by clicking "Merge" blindly. One branch can overwrite the other.

---

## Phase 1: Real search + Android map

### 1A. Google Cloud: two separate keys

You need **two different keys**. One stays on a server (places search). One goes in the app (the map).

1. [ ] Go to <https://console.cloud.google.com> and sign in.
2. [ ] Make a project: top bar → project picker → **New project** → name it `Spotted` → **Create**.
3. [ ] Turn on billing for the project (Google asks for a card; there is a free monthly credit). Menu → **Billing**.
4. [ ] Turn on the two services. Menu → **APIs & Services** → **Library**. Search and click **Enable** for:
   - **Places API (New)**
   - **Maps SDK for Android**
5. [ ] Make the **Places key** (stays on the server):
   1. Menu → **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
   2. Click the new key → rename it `Spotted Places (server)`.
   3. Under **API restrictions** choose **Restrict key** → tick **only** *Places API (New)* → **Save**.
   4. Copy the key and keep it somewhere private. **Do not** paste it into the app or into chat.
6. [ ] Make the **Maps SDK key** (goes in the app):
   1. **Create credentials** → **API key** again.
   2. Rename it `Spotted Maps (Android app)`.
   3. Under **Application restrictions** choose **Android apps** → **Add an item**.
   4. Package name: `com.spotted.app`.
   5. SHA-1 fingerprint: run `eas credentials` in a terminal (choose Android → your build profile) and copy the
      **SHA-1** shown. If you use the Google Play "app signing", also add the SHA-1 shown in
      Play Console → your app → **Test and release** → **App integrity** → **App signing**. You can add several.
   6. Under **API restrictions** choose **Restrict key** → tick **only** *Maps SDK for Android* → **Save**.
   7. Copy the key.

### 1B. Budget alert of USD 10 a month

1. [ ] Menu → **Billing** → **Budgets & alerts** → **Create budget**.
2. [ ] Name `Spotted monthly`. Amount: **USD 10**. Choose **Monthly**.
3. [ ] Keep the alert thresholds (50%, 90%, 100%) and make sure your email is ticked → **Finish**.
4. [ ] Remember: a budget alert only **warns** you, it does not stop spending. Check the Billing page once a week
   during the pilot.

### 1C. Deploy the Places proxy to Cloudflare

You need Node.js on your computer (the same one you use for the app).

1. [ ] Make a free account at <https://dash.cloudflare.com/sign-up>.
2. [ ] Open a terminal in the project folder, then:
   ```bash
   cd server/places-proxy
   npx wrangler login
   ```
   A browser opens. Click **Allow**.
3. [ ] Store the Places key as a secret (paste the key when asked; it is hidden as you type):
   ```bash
   npx wrangler secret put GOOGLE_PLACES_API_KEY
   ```
4. [ ] Make up a long random password (30+ letters and numbers) and store it as the proxy's shared secret:
   ```bash
   npx wrangler secret put APP_SHARED_SECRET
   ```
   Keep a copy of this password. You need it in step 1D. (If you skip this, the proxy still works, but
   anyone who finds its address can use it.)
5. [ ] Deploy:
   ```bash
   npx wrangler deploy
   ```
6. [ ] Wrangler prints an address like `https://spotted-places-proxy.<something>.workers.dev`. Copy it.
7. [ ] Test it. In a browser open that address with `/v1/anything` at the end. You should see
   `{"error":"Not allowed"}` (if you set a password) or `{"error":"Not found"}`. Both mean it is alive.
8. [ ] If wrangler complains about the `[[ratelimits]]` setting, tell Claude exactly what it says.

### 1D. Give the builds their settings (EAS environment variables)

These are saved on Expo's website, not in the code. Do it once per environment (`development`, `preview`, `production`).
Easiest: use the website.

1. [ ] Go to <https://expo.dev> → your account → project **spotted** → **Environment variables**.
2. [ ] Add these three, and tick **all three** environments (Development, Preview, Production):

   | Name | Value | Visibility |
   |---|---|---|
   | `EXPO_PUBLIC_PLACES_PROXY_URL` | the address from step 1C.6 | Plain text |
   | `EXPO_PUBLIC_PLACES_PROXY_SECRET` | the password from step 1C.4 | Sensitive |
   | `GOOGLE_MAPS_ANDROID_API_KEY` | the **Maps SDK key** from 1A.6 | Sensitive |
3. [ ] Or, from a terminal, one at a time (example):
   ```bash
   eas env:create --name GOOGLE_MAPS_ANDROID_API_KEY --value "PASTE_KEY" --environment production --environment preview --environment development --visibility sensitive
   ```
4. [ ] For your own phone while developing, also copy `.env.example` to `.env` and fill in
   `EXPO_PUBLIC_PLACES_PROXY_URL`, `EXPO_PUBLIC_PLACES_PROXY_SECRET`. **Never commit `.env`.**

### 1E. Turn the Android map on (code switch)

1. [ ] Open `src/config.ts` and change:
   ```ts
   export const GOOGLE_MAPS_KEY_IN_BUILD = false;
   ```
   to
   ```ts
   export const GOOGLE_MAPS_KEY_IN_BUILD = true;
   ```
   **Only do this after** step 1D is finished **and** you are about to make a new build.
   Why: on Android the Google map **crashes the whole app** if the key is missing from the build.
   With `false`, the Map tab shows a plain list instead (safe).
   (Or ask Claude: "set GOOGLE_MAPS_KEY_IN_BUILD to true".)
2. [ ] Make a new development build (this uses your free build quota, so do it once, after Phase 2 too):
   ```bash
   eas build --profile development --platform android
   ```
   Or use `--profile preview` for a build you can give to testers.
3. [ ] Install it on your phone and check:
   - Add Place now shows **real** Google results (not only the small Dubai demo list).
   - The Map tab shows a real map with coloured pins and the Food / Shopping / Fun chips at the top.
4. [ ] If the map is grey or blank: the Maps SDK key is probably restricted to the wrong SHA-1 or package name.
   Check step 1A.6.

---

## Phase 2: Polish and safety

1. [ ] Nothing to do until the test. The notification icon (a white pin) and colour (coral) are added.
   They only show up in a **new build** (not in Expo Go or an old build).
2. [ ] After installing the new build, check on your phone:
   - Welcome screen mentions TikTok.
   - Share a reel while the welcome or permission screens are showing. After finishing them, Add Place should
     open with that reel.
   - Turn on TalkBack (Settings → Accessibility → TalkBack) and tap a switch in Settings. It should read its name.

---

## Phase 3: Real-phone test (about 1 week, mostly you)

1. [ ] Make sure Phase 1 (keys, proxy, EAS variables) and Phase 2 are done.
2. [ ] Make the test build (this uses your free build quota, so ask yourself first: is everything in it?):
   ```bash
   eas build --profile preview --platform android
   ```
   When it finishes, open the link on your phone and install it. (Allow "install unknown apps" if asked.)
3. [ ] Open `docs/TEST_PLAN.md`. Do the tests in order and tick them. Write down anything that fails.
4. [ ] Turn off battery saving for Spotted first. The steps for Samsung, Xiaomi and Pixel are at the bottom of `docs/TEST_PLAN.md`.
5. [ ] Borrow 1 or 2 other Android phones (a Samsung and a Xiaomi if you can) and repeat tests 6 to 9 on them.
6. [ ] Do test 15 (battery after a full day) on at least one phone.
7. [ ] Come back to Claude with what failed. Ask it to fix the bugs one at a time on a branch called `phase-3-fixes`.

---

## Phase 4: Privacy policy, Google Play, and testers

### 4A. Pick the support email and finish the privacy policy

1. [ ] Decide your support email (it is what users and Google see). `src/config.ts` currently has
   `hello.spottedapp@gmail.com`. If that is a real inbox you read, keep it. If not, make a new free Gmail address.
2. [ ] Open `docs/PRIVACY_POLICY.md`. Find `[SUPPORT EMAIL]` (at the bottom, under **Contact**) and replace it with that email.
3. [ ] Ask someone you trust to read the policy once. It is a draft and **not legal advice**. If anything in it is not true for
   your app, tell Claude to change it.

### 4B. Publish the policy for free with GitHub Pages

Google and Apple both need a **web link** to the policy.

*Option A: use this repository (simplest, works only if the repository is Public)*
1. [ ] Go to <https://github.com/sarahnazirahmed-debug/spotted> → **Settings** → scroll to **Danger Zone** to check whether
   the repository is **Public**. (Free GitHub Pages needs a public repository. Everything inside it, including the `docs` folder, becomes visible to everyone. That is fine here: there are no secrets in it. `.env` is never committed.)
2. [ ] Still in **Settings**: click **Pages** (left menu).
3. [ ] Under **Build and deployment** → **Source**: **Deploy from a branch**. Under **Branch**: pick `main`, folder `/docs`, then **Save**.
   (The privacy policy file must be on `main`. Merge it there first, after Phase 0 step 1.)
4. [ ] Wait 1 to 2 minutes. The page address will be:
   `https://sarahnazirahmed-debug.github.io/spotted/PRIVACY_POLICY`
   Open it in your browser and check that it reads well and shows your email.

*Option B: a small separate public repository (if you want to keep this one private)*
1. [ ] On GitHub click **New repository** → name `spotted-privacy` → **Public** → **Create**.
2. [ ] Click **Add file → Upload files**, upload `docs/PRIVACY_POLICY.md` and rename it `index.md` (or ask Claude to produce `index.md`).
3. [ ] **Settings → Pages** → Source **Deploy from a branch** → `main` / `(root)` → **Save**.
4. [ ] Your address will be `https://sarahnazirahmed-debug.github.io/spotted-privacy/`.

### 4C. Put the link in the app

1. [ ] Open `src/config.ts`.
2. [ ] Set `PRIVACY_POLICY_URL` to the page address from 4B, for example:
   ```ts
   export const PRIVACY_POLICY_URL = 'https://sarahnazirahmed-debug.github.io/spotted/PRIVACY_POLICY';
   ```
3. [ ] Set `SUPPORT_EMAIL` to the same email as in the policy.
4. [ ] (Or tell Claude: "Set PRIVACY_POLICY_URL to ... and SUPPORT_EMAIL to ...".)
5. [ ] These two changes need a **new build** to reach phones.

### 4D. Google Play developer account (USD 25, once)

1. [ ] Go to <https://play.google.com/console/signup>. Sign in with the Google account you want to own the app
   (use a normal account you will keep for years).
2. [ ] Choose account type **Personal** (for one person) or **Organization** (a company; needs a D-U-N-S number and more time).
   **Important:** a *Personal* account made after November 2023 must run a **closed test with at least 12 testers for 14 days**
   before it can publish to production. The steps below do this.
3. [ ] Pay the one-time **USD 25** fee with a card.
4. [ ] Verify your identity (a photo of an ID, your address, and a phone number). This can take a few days.
5. [ ] Verify your phone/Android device if Google asks (it asks you to use the Play Console app on an Android phone).

### 4E. Create the app in Play Console

1. [ ] Play Console → **Create app**.
2. [ ] App name: **Spotted**. Default language: English (United Kingdom or United States, your choice).
   App or game: **App**. Free or paid: **Free**. (Paid apps cannot become free later.)
3. [ ] Tick the two declarations (developer program policies, US export laws) → **Create app**.
4. [ ] Open `docs/STORE_LISTING.md` and copy from it into each Play Console page:
   - **Grow → Store presence → Main store listing**: name, short description, full description, screenshots, icon (512×512), feature graphic (1024×500).
   - **Policy and programs → App content**: Privacy policy link, **Data safety**, **Ads** (No ads), **Content rating**, **Target audience**, **Location permissions** (background location declaration) and the video.
   - Everything under "App content" must show a green tick before Google lets you start a test.

### 4F. Build the app for Google Play

1. [ ] Before this step, make sure `PRIVACY_POLICY_URL` and `SUPPORT_EMAIL` are set (4C) and Phase 3 testing is OK.
2. [ ] Run:
   ```bash
   eas build --profile production --platform android
   ```
   This makes an `.aab` file (the format Google Play needs). It uses a build from your free quota.
   The first time, EAS asks to create an Android keystore for you. Say **yes** and let EAS keep it.
3. [ ] Upload it in Play Console: **Test and release → Testing → Closed testing → Create track** (see 4G), then **Create new release**
   → upload the `.aab`. (Or later with `eas submit --platform android`, which needs a Google service account key.
   For the first upload, uploading by hand is easier.)

### 4G. Closed testing track with 12 or more testers for 14 days

1. [ ] Play Console → your app → **Test and release → Testing → Closed testing** → **Create track** → name it `Pilot`.
2. [ ] **Testers** tab: **Create email list** (e.g. "Pilot testers"). Add the **Gmail addresses** of at least **12** people
   (use 15 to 20 to be safe, because some will not join). Each tester must use the Google account that they signed in to Play with.
   Google also lets you use a Google Group instead.
3. [ ] Add a feedback email or link for testers on the same page.
4. [ ] **Create new release** → upload the `.aab` → give it a name (for example `1.0.0 pilot`) → release notes
   (for example "First test version. Share a reel to Spotted and save the place.") → **Save** → **Review release** → **Start rollout to Closed testing**.
5. [ ] Google reviews the release (a few hours to a few days). When it is live, the **Testers** tab shows a **join link**
   ("Copy link"). Send this link to the testers (use `docs/TESTER_MESSAGE.md`).
6. [ ] Testers must tap the link, press **Become a tester**, then install Spotted from Google Play.
7. [ ] Count the days: the **14 days** start when at least **12 testers** have joined (opted in) and stay opted in.
   Do not remove testers during that time. Use the **Dashboard** page: Google shows "Run a closed test" progress.
8. [ ] On day 7 and day 14 send the questions from `docs/TESTER_MESSAGE.md` and save the answers.
9. [ ] After 14 days, Play Console **Dashboard → Apply for production**. Answer Google's questions about your test
   (how you found testers, what feedback you got, what you changed). Claude can help you write the answers from the pilot results.

---

## Phase 5: iPhone (no builds were made by Claude)

You need a real iPhone (iOS 16 or newer is best) and a Mac is **not** required (EAS builds in the cloud).

### 5A. Apple Developer Program (USD 99 a year)

1. [ ] Go to <https://developer.apple.com/programs/enroll/> and sign in with your Apple ID
   (turn on two-factor sign-in for it first: iPhone → Settings → your name → Sign-In & Security).
2. [ ] Choose **Individual** (just you) or **Organization** (a company; needs a D-U-N-S number and takes longer).
3. [ ] Pay **USD 99** for the year. Approval can take from a few hours to a few days. Apple may call or email you.
4. [ ] Write down your **Team ID** (developer.apple.com → Account → Membership details).

### 5B. Create the app in App Store Connect

1. [ ] Go to <https://appstoreconnect.apple.com> → **Apps** → **+** → **New App**.
2. [ ] Platform **iOS**. Name **Spotted**. Primary language English. Bundle ID: pick `com.spotted.app`
   (if it is not in the list yet, do 5C first, then come back). SKU: `spotted-001` (any text). User access: **Full access**.
3. [ ] Copy the **Apple ID number** of the app (App Store Connect → your app → App Information → "Apple ID", a number like 6738123456).
   You need it for `eas submit`. Give it to Claude: "my App Store Connect app id is …" so it can be added to `eas.json`.

### 5C. Make the iPhone build (uses your free build quota)

1. [ ] Before building, look at the two iOS choices in `docs/STORE_LISTING.md` (iPad screenshots) and tell Claude if you want
   `supportsTablet` changed to `false` (no iPad version).
2. [ ] Run:
   ```bash
   eas build --profile production --platform ios
   ```
3. [ ] EAS asks you to **log in to your Apple account** (Apple ID, password, a code sent to your devices). It then asks to create
   credentials. Answer **yes** to everything and let EAS manage them. It makes certificates and profiles for **two** things:
   - the app `com.spotted.app`
   - the **share extension** `com.spotted.app.ShareExtension` (this is what makes "Share → Spotted" appear)
   and an **App Group** `group.com.spotted.app` that connects the two.
4. [ ] If it stops with an error about the extension or the App Group, copy the **whole error** to Claude.
5. [ ] When the build finishes (about 15 to 30 minutes) EAS shows a link.

### 5D. TestFlight (the way to test on your iPhone)

1. [ ] Upload the build:
   ```bash
   eas submit --platform ios
   ```
   Choose the build you just made. (It asks for your App Store Connect app ID from 5B.3. Or download the file and upload it with the
   Apple **Transporter** app on a Mac.)
2. [ ] Wait 10 to 30 minutes for "Processing" to finish: App Store Connect → your app → **TestFlight**.
3. [ ] Answer the **export compliance** question if it appears: the app uses only standard HTTPS, so it is exempt ("No" to proprietary encryption).
4. [ ] **Internal testing**: TestFlight tab → **Internal Testing** → **+** → make a group → add yourself (your Apple ID must be an
   App Store Connect user: Users and Access → +). No Apple review is needed for internal testers.
5. [ ] On your iPhone install the free **TestFlight** app from the App Store. Open the invite email on the iPhone → **Open in TestFlight** → **Install**.
6. [ ] For other testers (**External testing**): add up to 10,000 people with a public link. The first build needs a short **Beta App Review** by Apple (about a day).

### 5E. iPhone test list

Do all tests in `docs/TEST_PLAN.md` on the iPhone. The wording is for Android. On iPhone:
- Battery-saving steps do not apply. Instead check Settings → **Spotted** → **Location** is **Always**, **Precise Location** on, and **Background App Refresh** on.
- iOS asks for location in two steps: first "Allow While Using App", and later it may ask again to change to "Always". If the second question never comes, go to
  Settings → Spotted → Location → **Always**.

Extra iPhone tests (tick when OK):
1. [ ] **Share extension from Instagram:** in an Instagram reel tap the paper-plane → **Share to…** (or **More**) → **Spotted**. Spotted opens on Add place with the link.
   If Spotted is not in the list, scroll the row of apps to the end, tap **More**, and turn Spotted on (then drag it to the top).
2. [ ] **Share extension from TikTok:** Share → **More** (or the share-sheet icon) → **Spotted**.
3. [ ] **Share from Safari:** open any web page, tap Share, choose **Spotted**.
4. [ ] **Reel shared when Spotted was closed:** force-close Spotted, then share a reel. It should open on Add place.
5. [ ] **Map:** shows Apple Maps with coloured pins (no key is needed on iPhone).
6. [ ] **Walk-by reminder with the app closed** (same as test 6 in the test plan).
7. [ ] **Nothing breaks if you choose "Don't Allow"** for location or notifications.

### 5F. Real reel captions (so Claude can improve place-finding)

1. [ ] Collect **about 20 real captions** of reels about places (Instagram and TikTok, Dubai and elsewhere).
   In Instagram: open the reel → tap the caption → **Copy**. Paste each one into a text file or message to yourself.
   Include the hard ones (places mentioned only with @tags, only in Arabic, only an emoji, no place at all).
2. [ ] Paste them to Claude and say: *"Here are 20 real reel captions. Use them to improve `src/places/clues.ts` and add each as a test in `tests/clues.test.ts`."*
   Write next to each one which place it should find (or "no place"). That is the answer key for the tests.

### 5G. Fill in the App Store page and submit

1. [ ] App Store Connect → your app → **App Store** tab → **iOS App** → paste the texts from `docs/STORE_LISTING.md`, Part 4.
2. [ ] Add the screenshots (Part 1 list; iPhone sizes in Part 4).
3. [ ] **App Privacy** → follow the answers in `docs/STORE_LISTING.md`, Part 4.
4. [ ] **Age rating**: answer "None" to everything → 4+.
5. [ ] Add the **Privacy Policy URL** and **Support URL**.
6. [ ] Paste the **App Review notes** from `docs/STORE_LISTING.md` (very important: they explain why the app needs "Always" location).
7. [ ] Choose the TestFlight build → **Add for Review** → **Submit for Review**. (Do this only after the Google Play pilot looks good, see ROADMAP Phase 6.)

---

## Phase 7: Check the small extras (5 minutes, in the new build)

1. [ ] **Search in My Places:** type part of a place name, area or note. The list shrinks. Clear the box and everything is back.
2. [ ] **Newest / Nearest:** tap **Nearest**. The closest place is first. (If location is refused the button is greyed out and says why.)
3. [ ] **Share place:** open a saved place → **Share place** → choose WhatsApp. The message has the name, your note, a Google Maps link and the reel link.
4. [ ] **Broken reel link:** this is hard to trigger with a normal Instagram link, because the phone can open any web address.
   If you can't make it fail, skip it. When it does fail you see "This reel won't open" with **Remove link** and **Keep link**.

---

## Last: before you submit to the stores (Phase 6)

When Phases 1 to 5 are finished, ask Claude: *"Do Phase 6 from ROADMAP.md."* It will go through the lists in `CLAUDE.md` and `SPEC.md`
and tell you what is ticked. The final **Submit for review** buttons in Play Console and App Store Connect are yours to press.

## Anything unclear?

If a step does not match what you see on screen, stop and send Claude a screenshot. Never paste your keys, passwords or the content of `.env` into chat.
