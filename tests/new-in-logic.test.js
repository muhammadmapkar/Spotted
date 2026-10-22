// The New In tab's rules: new offers, new influencers and new places, all within 15 km.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');
const mock = app('src/data/mock.js');
const rules = app('src/newin/newInData.js');

test('words and timing of the sections', () => {
  assert.equal(rules.SUBTITLE, 'Fresh within 15 km of you');
  assert.deepStrictEqual(rules.SECTION_TITLES, { offers: 'New offers', influencers: 'New influencers on Spotted', places: 'New places on Spotted' });
  const { offers, influencers, places } = rules.SECTION_DELAYS;
  assert.ok(offers < influencers && influencers < places, 'the sections slide in one after another');
  assert.equal(rules.NEW_BADGE, 'NEW');
  assert.equal(rules.JUST_JOINED, 'JUST JOINED');
});

test('new offers: the four sample offers, each with its place, popping in 90 ms apart', () => {
  const cards = rules.newOfferCards();
  assert.deepStrictEqual(cards.map((c) => c.place.id), ['saffron', 'stack', 'luma', 'casa']);
  assert.deepStrictEqual(cards.map((c) => c.offer.source), ['Esaad', 'Spotted', 'Fazaa', 'Spotted']);
  assert.deepStrictEqual(cards.map((c) => c.offer.ends), ['Ends in 3 days', 'Ends Sunday', '5 days left', 'This week only']);
  assert.deepStrictEqual(cards.map((c) => c.delay), [0, 90, 180, 270]);
});

test('new offers: places farther than 15 km and unknown places are left out, and delays have no gaps', () => {
  const far = { placeId: 'kiln', source: 'Fazaa', text: 'far', ends: 'x' }; // kiln is 14.1 km: still near
  const farther = { placeId: 'saffron', source: 'Fazaa', text: 'x', ends: 'x' };
  const nowhere = { placeId: 'no-such-place', source: 'Esaad', text: 'x', ends: 'x' };
  const real = mock.placeById('kiln');
  const originalDist = real.dist;
  real.dist = 15.5;
  try {
    const cards = rules.newOfferCards([far, nowhere, farther]);
    assert.deepStrictEqual(cards.map((c) => c.place.id), ['saffron']);
    assert.deepStrictEqual(cards.map((c) => c.delay), [0]);
  } finally {
    real.dist = originalDist;
  }
});

test('new influencers: only the ones that just joined, popping in 100 ms apart', () => {
  const items = rules.newInfluencers();
  assert.deepStrictEqual(items.map((i) => i.influencer.id), ['weekend', 'sweet']);
  assert.deepStrictEqual(items.map((i) => i.delay), [300, 400]);
});

test('new places: places that just joined within 15 km, nearest first', () => {
  const items = rules.newPlaces();
  assert.deepStrictEqual(items.map((i) => i.place.id), ['glow', 'casa', 'dune']);
  assert.deepStrictEqual(items.map((i) => i.index), [0, 1, 2]);
  const shuffled = [mock.placeById('dune'), mock.placeById('glow'), mock.placeById('casa')];
  assert.deepStrictEqual(rules.newPlaces(shuffled).map((i) => i.place.id), ['glow', 'casa', 'dune'], 'nearest first, whatever the order they come in');
  assert.ok(items.every((i) => i.place.partner), 'they joined as Spotted Partners');
  const farNew = { ...mock.placeById('glow'), id: 'far-new', dist: 16 };
  assert.ok(!rules.newPlaces([farNew]).length, 'too far');
  assert.deepStrictEqual(rules.newPlaces([mock.placeById('saffron')]), [], 'not new');
});
