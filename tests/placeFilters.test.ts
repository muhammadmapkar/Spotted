import assert from 'node:assert/strict';
import { test } from 'node:test';

import { filterPlaces } from '../src/placeFilters';
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
