import assert from 'node:assert/strict';
import { test } from 'node:test';

import { filterPlaces, searchSavedPlaces, sortPlaces } from '../src/placeFilters';
import { makePlace } from './helpers';

const food = makePlace({ id: 'food1', category: 'food', collectionIds: ['brunch'] });
const shop = makePlace({ id: 'shop1', category: 'shopping', collectionIds: ['brunch', 'dates'] });
const fun = makePlace({ id: 'fun1', category: 'fun', collectionIds: [] });
const all = [food, shop, fun];
const ids = (places: { id: string }[]) => places.map((p) => p.id);

test('"all" and "all" keep every place, in the same order', () => {
  assert.deepEqual(ids(filterPlaces(all, 'all', 'all')), ['food1', 'shop1', 'fun1']);
});

test('the category chip keeps only that category', () => {
  assert.deepEqual(ids(filterPlaces(all, 'shopping', 'all')), ['shop1']);
  assert.deepEqual(ids(filterPlaces(all, 'fun', 'all')), ['fun1']);
});

test('the collection chip keeps only places in that collection', () => {
  assert.deepEqual(ids(filterPlaces(all, 'all', 'brunch')), ['food1', 'shop1']);
  assert.deepEqual(ids(filterPlaces(all, 'all', 'dates')), ['shop1']);
});

test('category and collection filters combine', () => {
  assert.deepEqual(ids(filterPlaces(all, 'food', 'brunch')), ['food1']);
  assert.deepEqual(ids(filterPlaces(all, 'fun', 'brunch')), []);
});

test('an unknown collection matches nothing, and an empty list stays empty', () => {
  assert.deepEqual(filterPlaces(all, 'all', 'ghost'), []);
  assert.deepEqual(filterPlaces([], 'food', 'all'), []);
});

test('the filter does not change the original list', () => {
  const copy = [...all];
  filterPlaces(all, 'food', 'all');
  assert.deepEqual(all, copy);
});

// ---------- search ----------

const tea = makePlace({ id: 'tea', name: 'Arabian Tea House', address: 'Al Fahidi, Dubai', note: 'try the karak' });
const cafe = makePlace({ id: 'cafe', name: 'Nightjar Coffee', address: 'Al Quoz, Dubai', note: undefined });
const mall = makePlace({ id: 'mall', name: 'Dubai Mall', address: 'Downtown, Dubai', note: 'Pistachio croissant at the cafe' });
const searchable = [tea, cafe, mall];

test('an empty search keeps every place', () => {
  assert.deepEqual(ids(searchSavedPlaces(searchable, '')), ['tea', 'cafe', 'mall']);
  assert.deepEqual(ids(searchSavedPlaces(searchable, '   ')), ['tea', 'cafe', 'mall']);
});

test('search looks in the name, the area and the note, ignoring capital letters', () => {
  assert.deepEqual(ids(searchSavedPlaces(searchable, 'NIGHTJAR')), ['cafe']); // name
  assert.deepEqual(ids(searchSavedPlaces(searchable, 'fahidi')), ['tea']); // area
  assert.deepEqual(ids(searchSavedPlaces(searchable, 'karak')), ['tea']); // note
  assert.deepEqual(ids(searchSavedPlaces(searchable, 'dubai')), ['tea', 'cafe', 'mall']);
});

test('search with several words needs all of them, in any order', () => {
  assert.deepEqual(ids(searchSavedPlaces(searchable, 'tea dubai')), ['tea']);
  assert.deepEqual(ids(searchSavedPlaces(searchable, 'dubai tea')), ['tea']);
  assert.deepEqual(ids(searchSavedPlaces(searchable, 'tea mall')), []);
});

test('a search with no match gives an empty list', () => {
  assert.deepEqual(searchSavedPlaces(searchable, 'sushi'), []);
});

// ---------- sort ----------

// Three places in a line east of the user, closest is the OLDEST one.
const user = { latitude: 25.2, longitude: 55.27 };
const near = makePlace({ id: 'near', latitude: 25.2, longitude: 55.271, createdAt: '2026-10-01T10:00:00.000Z' });
const mid = makePlace({ id: 'mid', latitude: 25.2, longitude: 55.28, createdAt: '2026-10-02T10:00:00.000Z' });
const far = makePlace({ id: 'far', latitude: 25.2, longitude: 55.4, createdAt: '2026-10-03T10:00:00.000Z' });

test('"newest" puts the most recently saved place first, whatever order the list came in', () => {
  assert.deepEqual(ids(sortPlaces([mid, near, far], 'newest', user)), ['far', 'mid', 'near']);
  assert.deepEqual(ids(sortPlaces([mid, near, far], 'newest', null)), ['far', 'mid', 'near']);
});

test('"nearest" puts the closest place first', () => {
  assert.deepEqual(ids(sortPlaces([far, mid, near], 'nearest', user)), ['near', 'mid', 'far']);
});

test('"nearest" without a position falls back to newest first', () => {
  assert.deepEqual(ids(sortPlaces([near, mid, far], 'nearest', null)), ['far', 'mid', 'near']);
});

test('places at the same distance stay newest first', () => {
  const a = makePlace({ id: 'a', latitude: 25.2, longitude: 55.28, createdAt: '2026-10-05T10:00:00.000Z' });
  const b = makePlace({ id: 'b', latitude: 25.2, longitude: 55.28, createdAt: '2026-10-06T10:00:00.000Z' });
  assert.deepEqual(ids(sortPlaces([a, b], 'nearest', user)), ['b', 'a']);
});

test('sorting does not change the list you give it', () => {
  const list = [far, near, mid];
  sortPlaces(list, 'nearest', user);
  assert.deepEqual(ids(list), ['far', 'near', 'mid']);
});
