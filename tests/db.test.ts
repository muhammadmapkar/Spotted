import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import {
  addCollection,
  addPlace,
  deleteAllData,
  deleteCollection,
  deletePlace,
  getPlace,
  getSettings,
  listCollections,
  listCollectionsWithCounts,
  listPlaces,
  renameCollection,
  saveSettings,
  setOnboardingDone,
  getOnboardingDone,
  updatePlace,
  DEFAULT_SETTINGS,
  NewPlace,
} from '../src/db';
import { freshDatabase } from './testDb';

// Every test starts with an empty database.
beforeEach(async () => {
  await freshDatabase();
});

const newPlace = (overrides: Partial<NewPlace> = {}): NewPlace => ({
  googlePlaceId: 'g1',
  name: 'Arabian Tea House',
  address: 'Al Fahidi, Dubai',
  latitude: 25.2635,
  longitude: 55.297,
  category: 'food',
  ...overrides,
});

// ---------- places ----------

test('a saved place can be read back with its defaults', async () => {
  const saved = await addPlace(newPlace({ note: 'try the karak', reelUrl: 'https://www.instagram.com/reel/abc/' }));
  assert.ok(saved.id);
  assert.equal(saved.muted, false);
  assert.equal(saved.visitedAt, undefined);
  assert.deepEqual(saved.collectionIds, []);

  const again = await getPlace(saved.id);
  assert.deepEqual(again, saved);
  assert.equal(again?.note, 'try the karak');
});

test('a place without a note or reel link comes back with them left out', async () => {
  const saved = await addPlace(newPlace());
  assert.equal(saved.note, undefined);
  assert.equal(saved.reelUrl, undefined);
});

test('getPlace gives null for an unknown id', async () => {
  assert.equal(await getPlace('nope'), null);
});

test('places are listed newest first', async () => {
  const first = await addPlace(newPlace({ name: 'First' }));
  await new Promise((resolve) => setTimeout(resolve, 5)); // make sure the dates differ
  const second = await addPlace(newPlace({ name: 'Second' }));
  assert.deepEqual((await listPlaces()).map((p) => p.id), [second.id, first.id]);
});

test('a place can be edited, muted and marked as visited', async () => {
  const saved = await addPlace(newPlace());
  const visitedAt = '2026-10-20T09:00:00.000Z';
  await updatePlace(saved.id, { category: 'fun', note: 'new note', muted: true, visitedAt });
  const changed = await getPlace(saved.id);
  assert.equal(changed?.category, 'fun');
  assert.equal(changed?.note, 'new note');
  assert.equal(changed?.muted, true);
  assert.equal(changed?.visitedAt, visitedAt);

  // Clearing them again.
  await updatePlace(saved.id, { note: undefined, muted: false, visitedAt: undefined });
  const cleared = await getPlace(saved.id);
  assert.equal(cleared?.note, undefined);
  assert.equal(cleared?.muted, false);
  assert.equal(cleared?.visitedAt, undefined);
});

test('updating a place that does not exist does nothing', async () => {
  await updatePlace('nope', { note: 'x' });
  assert.deepEqual(await listPlaces(), []);
});

test('a place can be deleted', async () => {
  const keep = await addPlace(newPlace({ name: 'Keep' }));
  const remove = await addPlace(newPlace({ name: 'Remove' }));
  await deletePlace(remove.id);
  assert.deepEqual((await listPlaces()).map((p) => p.id), [keep.id]);
  assert.equal(await getPlace(remove.id), null);
});

// ---------- collections ----------

test('collections are created, trimmed and not duplicated', async () => {
  const brunch = await addCollection('  Dubai   brunch ');
  assert.equal(brunch.name, 'Dubai brunch');
  const same = await addCollection('DUBAI BRUNCH');
  assert.equal(same.id, brunch.id);
  assert.equal((await listCollections()).length, 1);
});

test('an empty collection name is refused', async () => {
  await assert.rejects(() => addCollection('   '), /needs a name/);
});

test('collection names are limited to 40 characters', async () => {
  const long = await addCollection('x'.repeat(60));
  assert.equal(long.name.length, 40);
});

test('collections can be renamed, but not to a name that is already used', async () => {
  const a = await addCollection('Date night');
  await addCollection('Coffee');
  await renameCollection(a.id, 'Dinner dates');
  assert.deepEqual((await listCollections()).map((c) => c.name), ['Dinner dates', 'Coffee']);
  await assert.rejects(() => renameCollection(a.id, 'coffee'), /already have/);
  await renameCollection(a.id, 'DINNER DATES'); // changing only the capital letters of its own name is fine
});

test('a place can be in several collections, and counts are right', async () => {
  const brunch = await addCollection('Brunch');
  const dates = await addCollection('Date night');
  const place = await addPlace(newPlace({ collectionIds: [brunch.id, dates.id] }));
  assert.deepEqual([...place.collectionIds].sort(), [brunch.id, dates.id].sort());

  const other = await addPlace(newPlace({ name: 'Other', collectionIds: [brunch.id] }));
  const counts = await listCollectionsWithCounts();
  assert.equal(counts.find((c) => c.id === brunch.id)?.placeCount, 2);
  assert.equal(counts.find((c) => c.id === dates.id)?.placeCount, 1);
  assert.deepEqual((await getPlace(other.id))?.collectionIds, [brunch.id]);
});

test('collection ids that do not exist are ignored when saving', async () => {
  const place = await addPlace(newPlace({ collectionIds: ['ghost'] }));
  assert.deepEqual(place.collectionIds, []);
});

test('changing a place keeps its collections unless new ones are given', async () => {
  const brunch = await addCollection('Brunch');
  const place = await addPlace(newPlace({ collectionIds: [brunch.id] }));
  await updatePlace(place.id, { note: 'hello' });
  assert.deepEqual((await getPlace(place.id))?.collectionIds, [brunch.id]);
  await updatePlace(place.id, { collectionIds: [] });
  assert.deepEqual((await getPlace(place.id))?.collectionIds, []);
});

test('deleting a collection keeps the places that were in it', async () => {
  const brunch = await addCollection('Brunch');
  const place = await addPlace(newPlace({ collectionIds: [brunch.id] }));
  await deleteCollection(brunch.id);
  assert.deepEqual(await listCollections(), []);
  assert.deepEqual((await getPlace(place.id))?.collectionIds, []);
  assert.equal((await listPlaces()).length, 1);
});

test('deleting a place removes it from its collections count', async () => {
  const brunch = await addCollection('Brunch');
  const place = await addPlace(newPlace({ collectionIds: [brunch.id] }));
  await deletePlace(place.id);
  assert.equal((await listCollectionsWithCounts())[0].placeCount, 0);
});

// ---------- settings ----------

test('settings start as the defaults and keep changes', async () => {
  assert.deepEqual(await getSettings(), DEFAULT_SETTINGS);
  await saveSettings({ radiusMeters: 500 });
  await saveSettings({ maxRemindersPerDay: 0 });
  const settings = await getSettings();
  assert.equal(settings.radiusMeters, 500);
  assert.equal(settings.maxRemindersPerDay, 0);
  assert.equal(settings.quietHoursEnabled, DEFAULT_SETTINGS.quietHoursEnabled);
});

// ---------- delete all my data ----------

test('"Delete all my data" removes places, collections and settings', async () => {
  const brunch = await addCollection('Brunch');
  await addPlace(newPlace({ collectionIds: [brunch.id] }));
  await saveSettings({ radiusMeters: 1000 });

  await deleteAllData();

  assert.deepEqual(await listPlaces(), []);
  assert.deepEqual(await listCollections(), []);
  assert.deepEqual(await getSettings(), DEFAULT_SETTINGS);
  // Nothing is left behind in the link table either.
  assert.deepEqual((await addPlace(newPlace())).collectionIds, []);
});

test('the app works normally after all data was deleted', async () => {
  await addPlace(newPlace());
  await deleteAllData();
  const again = await addPlace(newPlace({ name: 'After' }));
  assert.deepEqual((await listPlaces()).map((p) => p.id), [again.id]);
});

test('onboarding is remembered separately from the data', async () => {
  assert.equal(await getOnboardingDone(), false);
  await setOnboardingDone();
  assert.equal(await getOnboardingDone(), true);
});
