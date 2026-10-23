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
