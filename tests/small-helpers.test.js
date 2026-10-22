// Small helpers: quiet-hours time steps, distance maths, the filter rule on My Places.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');

test('addMinutes moves a time by 30 minutes, wrapping around midnight', () => {
  const { addMinutes } = app('src/settings/time.js');
  assert.equal(addMinutes('22:00', 30), '22:30');
  assert.equal(addMinutes('22:30', 30), '23:00');
  assert.equal(addMinutes('23:45', 30), '00:15');
  assert.equal(addMinutes('00:00', -30), '23:30');
  assert.equal(addMinutes('08:00', -30), '07:30');
  assert.equal(addMinutes('00:15', -30), '23:45');
});

test('distance maths and friendly text', () => {
  const { distanceMeters, formatDistance } = app('src/location/distance.js');
  const mall = { latitude: 25.1972, longitude: 55.2797 };
  const kite = { latitude: 25.2121, longitude: 55.2142 };
  const km = distanceMeters(mall, kite) / 1000;
  assert.ok(km > 6 && km < 8, 'Dubai Mall to Kite Beach is about 7 km, got ' + km);
  assert.equal(distanceMeters(mall, mall), 0);
  assert.equal(formatDistance(4), '10 m');
  assert.equal(formatDistance(347), '350 m');
  assert.equal(formatDistance(1234), '1.2 km');
  assert.equal(formatDistance(14400), '14 km');
});

test('My Places filters: category and collection combine', () => {
  const { filterPlaces } = app('src/placeFilters.js');
  const P = (id, category, collectionIds) => ({ id, category, collectionIds });
  const all = [P('a', 'food', ['x']), P('b', 'food', ['y']), P('c', 'fun', ['x', 'y']), P('d', 'shopping', [])];
  const ids = (list) => list.map((p) => p.id).join('');
  assert.equal(ids(filterPlaces(all, 'all', 'all')), 'abcd');
  assert.equal(ids(filterPlaces(all, 'food', 'all')), 'ab');
  assert.equal(ids(filterPlaces(all, 'all', 'x')), 'ac');
  assert.equal(ids(filterPlaces(all, 'all', 'y')), 'bc');
  assert.equal(ids(filterPlaces(all, 'food', 'x')), 'a', 'both filters apply together');
  assert.equal(ids(filterPlaces(all, 'shopping', 'x')), '', 'no match gives an empty list, not an error');
  assert.equal(ids(filterPlaces(all, 'all', 'deleted-id')), '', 'an unknown collection matches nothing');
  assert.equal(ids(filterPlaces([], 'all', 'x')), '');
});
