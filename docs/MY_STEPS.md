# My steps (things only Sarah can do)

> Claude wrote the code. These are the jobs that need **you**: accounts, money, clicking in websites,
> testing on your phone. Do them **in order**. Tick each box when it is done.
>
> Everything here was written while you were away, so nothing below has been tried by Claude on a real
> phone or in a real account. If a screen looks different from what is written, go with what you see
> and tell Claude.

**Which phases need what**

| Phase | What it is | Needs a new development build? |
|---|---|---|
| 1 | Real search + Android map | **Yes** (map key, notification icon) |
| 2 | Polish and safety | **Yes** (notification icon and colour are baked into the build) |
| 3 | Real-phone test | uses the build from Phase 1/2 |
| 4 | Privacy policy + Google Play | production build for Play |
| 5 | iPhone | iPhone build |

**Quick tip:** do Phase 1 first, then make ONE new build that includes everything from Phases 1 and 2.
That saves your free build quota.

---

## Phase 0: Branches (before anything else)

1. [ ] `main` has a separate redesign by Sarah. The branches `main`, `improvements-round-1` and
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
