# Places proxy (keeps the Google key out of the app)

**Why:** a key inside the app can be pulled out by anyone, and then they can spend your Google money.
Also, Google's "restrict to this Android app" lock does not work for the plain web requests the app
makes for place search. A tiny server in between solves both problems.

This is a Cloudflare Worker (free plan is plenty for testing). It was written but **not yet deployed**,
because deploying needs your Cloudflare account.

## Set it up (about 10 minutes, once)

1. Make a free account at [cloudflare.com](https://dash.cloudflare.com/sign-up).
2. In Google Cloud, make a **new** API key just for this worker. Turn on only **Places API (New)**.
   (Keep your Maps SDK key separate, it is a different key.) Set a budget alert.
3. In a terminal, from this folder:
   ```bash
   cd server/places-proxy
   npx wrangler login
   npx wrangler secret put GOOGLE_PLACES_API_KEY   # paste the key when asked
   npx wrangler deploy
   ```
4. Wrangler prints an address like `https://spotted-places-proxy.<you>.workers.dev`.
5. (Optional, recommended) Add a shared secret, so random strangers can't use your proxy:
   ```bash
   npx wrangler secret put APP_SHARED_SECRET   # type any long random text, e.g. 30+ letters and numbers
   ```
   Then put the **same text** in the app as `EXPO_PUBLIC_PLACES_PROXY_SECRET` (step 6).
   If you skip this, the proxy still works, it just accepts everyone.
6. In the app's `.env` file, **remove** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` and add:
   ```
   EXPO_PUBLIC_PLACES_PROXY_URL=https://spotted-places-proxy.<you>.workers.dev
   EXPO_PUBLIC_PLACES_PROXY_SECRET=the-same-text-as-APP_SHARED_SECRET   # only if you did step 5
   ```
   Then restart with `npx expo start --dev-client`. (Builds on EAS also need this value: add it as an
   EAS environment variable.)

## What it allows

Only `places:autocomplete`, `places:searchText` and place details. It rebuilds every request itself, so the
app can't ask Google for anything else, and it forces the smallest field lists to keep costs down.
It also limits each IP to 60 requests a minute (see `wrangler.toml`, which uses Cloudflare's current `[[ratelimits]]` setting).
If `APP_SHARED_SECRET` is set, it also refuses any request that does not send the matching `X-Spotted-Key` header.

## Honest limits

The shared secret is also stored inside the app, so a determined person can extract it. It only keeps
casual strangers out. Anyone who gets it can still call the worker, but only for place search and only slowly.
If it is ever abused: change the secret (and ship a new app build), lower the rate limit, or move to signed
requests when accounts arrive in Version 2.
