// Place search: the built-in demo list, and the Google search (against a pretend Google).
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes } = require('./helpers/fakes');
installFakes({});

const searchPath = require('node:path').join(__dirname, '..', '.test-build', 'src', 'places', 'search.js');
const loadSearch = (key) => {
  delete require.cache[searchPath]; // the key is read when the file loads
  if (key === undefined) delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  else process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = key;
  return require(searchPath);
};

test('demo search (no Google key): matches words in any order, ignores case', async () => {
  const { searchPlaces, SEARCH_IS_DEMO } = loadSearch(undefined);
  assert.equal(SEARCH_IS_DEMO, true);
  assert.equal((await searchPlaces('', 't')).length, 0);
  assert.equal((await searchPlaces('   ', 't')).length, 0);
  assert.deepStrictEqual((await searchPlaces('TEA', 't')).map((p) => p.name), ['Arabian Tea House']);
  assert.deepStrictEqual((await searchPlaces('kite beach', 't')).map((p) => p.name), ['Kite Beach']);
  assert.deepStrictEqual((await searchPlaces('beach kite', 't')).map((p) => p.name), ['Kite Beach']);
  assert.ok((await searchPlaces('mall', 't')).length >= 3);
  assert.equal((await searchPlaces('zzzz', 't')).length, 0);
});

test('demo places are sensible: unique ids, all in Dubai', () => {
  const { DEMO_PLACES } = app('src/places/demoPlaces.js');
  const ids = DEMO_PLACES.map((p) => p.googlePlaceId);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
  assert.ok(DEMO_PLACES.every((p) => p.latitude > 24.5 && p.latitude < 25.5 && p.longitude > 54.8 && p.longitude < 55.6));
});

test('Google search: right request, location bias, and reading the answer', async () => {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.includes(':autocomplete')) {
      return { ok: true, json: async () => ({ suggestions: [
        { placePrediction: { placeId: 'ChIJ1', text: { text: 'Cafe One, Dubai' }, structuredFormat: { mainText: { text: 'Cafe One' }, secondaryText: { text: 'Jumeirah, Dubai' } } } },
        { queryPrediction: { text: { text: 'cafe near me' } } }, // not a real place: must be skipped
        { placePrediction: { placeId: 'ChIJ2', text: { text: 'Cafe Two' } } },
      ] }) };
    }
    if (url.includes('/places/ChIJ1')) {
      return { ok: true, json: async () => ({ id: 'ChIJ1', displayName: { text: 'Cafe One' }, formattedAddress: 'Street 1, Jumeirah, Dubai', location: { latitude: 25.1, longitude: 55.2 } }) };
    }
    if (url.includes('/places/NOLOC')) return { ok: true, json: async () => ({ id: 'NOLOC' }) };
    return { ok: false, status: 403, json: async () => ({}) };
  };

  const { searchPlaces, getPlaceDetails, SEARCH_IS_DEMO } = loadSearch('TESTKEY');
  assert.equal(SEARCH_IS_DEMO, false);

  assert.deepStrictEqual(await searchPlaces('ca', 'tok'), [], 'under 3 letters: no request (saves money)');
  assert.equal(calls.length, 0);

  const found = await searchPlaces('cafe', 'tok', { latitude: 25.2, longitude: 55.3, radiusMeters: 80000 });
  assert.deepStrictEqual(found, [
    { googlePlaceId: 'ChIJ1', name: 'Cafe One', address: 'Jumeirah, Dubai' },
    { googlePlaceId: 'ChIJ2', name: 'Cafe Two', address: '' },
  ]);
  const request = calls[0];
  assert.ok(request.url.endsWith('/v1/places:autocomplete'));
  assert.equal(request.options.headers['X-Goog-Api-Key'], 'TESTKEY');
  const body = JSON.parse(request.options.body);
  assert.equal(body.input, 'cafe');
  assert.equal(body.sessionToken, 'tok');
  assert.deepStrictEqual(body.locationBias.circle.center, { latitude: 25.2, longitude: 55.3 });
  assert.equal(body.locationBias.circle.radius, 50000, 'capped at Google\'s maximum');

  const details = await getPlaceDetails(found[0], 'tok');
  assert.deepStrictEqual(details, { googlePlaceId: 'ChIJ1', name: 'Cafe One', address: 'Street 1, Jumeirah, Dubai', latitude: 25.1, longitude: 55.2 });
  assert.ok(calls[1].url.includes('sessionToken=tok'));
  assert.equal(calls[1].options.headers['X-Goog-FieldMask'], 'id,displayName,formattedAddress,location');

  await assert.rejects(getPlaceDetails({ googlePlaceId: 'NOLOC', name: 'x', address: '' }, 't'), /location/);
  await assert.rejects(getPlaceDetails({ googlePlaceId: 'BAD', name: 'x', address: '' }, 't'), /403/);
});
