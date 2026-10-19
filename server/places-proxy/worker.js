// Spotted places proxy — a tiny Cloudflare Worker.
//
// WHY: if the Google key is inside the app, anyone can pull it out and run up your bill.
// With this proxy the key lives only here (as a secret). The app talks to this worker,
// and the worker talks to Google.
//
// It only allows the three requests the app needs, rebuilds each request from scratch
// (so the app cannot ask Google for anything else), and forces the cheapest field lists.

const GOOGLE = 'https://places.googleapis.com/v1';

const DETAILS_FIELDS = 'id,displayName,formattedAddress,location,types';
const TEXT_SEARCH_FIELDS = 'places.id,places.displayName,places.formattedAddress,places.location,places.types';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// Keeps a number only if it is a real number inside a range.
function num(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

// Checks the "prefer results near here" circle sent by the app. Returns a clean copy or null.
function cleanBias(bias) {
  const circle = bias && bias.circle;
  const lat = num(circle && circle.center && circle.center.latitude, -90, 90);
  const lon = num(circle && circle.center && circle.center.longitude, -180, 180);
  const radius = num(circle && circle.radius, 1, 50000);
  if (lat === null || lon === null || radius === null) return null;
  return { circle: { center: { latitude: lat, longitude: lon }, radius } };
}

function cleanText(value, maxLength) {
  return typeof value === 'string' && value.trim() && value.length <= maxLength ? value.trim() : null;
}

async function callGoogle(env, path, init) {
  const response = await fetch(`${GOOGLE}${path}`, {
    ...init,
    headers: { ...init.headers, 'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY },
  });
  // Pass Google's answer straight back (status included).
  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    // Slow down anyone sending too many requests (needs the rate limit binding in wrangler.toml).
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: 'Too many requests' }, 429);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/v1/, '');

    // 1. Suggestions while typing.
    if (request.method === 'POST' && path === '/places:autocomplete') {
      const body = await request.json().catch(() => null);
      const input = cleanText(body && body.input, 100);
      const sessionToken = cleanText(body && body.sessionToken, 64);
      if (!input) return json({ error: 'Bad request' }, 400);
      const clean = { input };
      if (sessionToken) clean.sessionToken = sessionToken;
      const bias = cleanBias(body.locationBias);
      if (bias) clean.locationBias = bias;
      return callGoogle(env, '/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
      });
    }

    // 2. Search by a phrase taken from a caption.
    if (request.method === 'POST' && path === '/places:searchText') {
      const body = await request.json().catch(() => null);
      const textQuery = cleanText(body && body.textQuery, 150);
      if (!textQuery) return json({ error: 'Bad request' }, 400);
      const clean = { textQuery, maxResultCount: 3 };
      const bias = cleanBias(body.locationBias);
      if (bias) clean.locationBias = bias;
      return callGoogle(env, '/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': TEXT_SEARCH_FIELDS },
        body: JSON.stringify(clean),
      });
    }

    // 3. Full details of the place the user picked.
    const details = path.match(/^\/places\/([A-Za-z0-9_-]{10,200})$/);
    if (request.method === 'GET' && details) {
      const token = url.searchParams.get('sessionToken');
      const query = token && token.length <= 64 ? `?sessionToken=${encodeURIComponent(token)}` : '';
      return callGoogle(env, `/places/${details[1]}${query}`, {
        method: 'GET',
        headers: { 'X-Goog-FieldMask': DETAILS_FIELDS },
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
