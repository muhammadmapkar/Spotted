import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import {
  addCollection,
  addPlace,
  deleteAllData,
  exportBackup,
  getSettings,
  listCollections,
  listPlaces,
  parseBackup,
  restoreBackup,
  saveSettings,
  updatePlace,
  NewPlace,
} from '../src/db';
import { freshDatabase } from './testDb';

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

test('a backup can be restored on an empty phone with everything kept', async () => {
  const brunch = await addCollection('Brunch');
  const a = await addPlace(newPlace({ note: 'karak', reelUrl: 'https://www.instagram.com/reel/abc/', collectionIds: [brunch.id] }));
  await addPlace(newPlace({ googlePlaceId: 'g2', name: 'Dubai Mall', category: 'shopping' }));
  await updatePlace(a.id, { muted: true, visitedAt: '2026-10-20T09:00:00.000Z' });
  await saveSettings({ radiusMeters: 500, maxRemindersPerDay: 3 });
  const before = await listPlaces();

  const text = await exportBackup();
  await deleteAllData(); // like a new phone
  const result = await restoreBackup(text);

  assert.deepEqual(result, { placesAdded: 2, placesSkipped: 0, collectionsAdded: 1 });
  assert.deepEqual(await listPlaces(), before);
  assert.equal((await listCollections())[0].name, 'Brunch');
  assert.equal((await getSettings()).radiusMeters, 500);
  assert.equal((await getSettings()).maxRemindersPerDay, 3);
});

test('restoring twice does not copy places or collections twice', async () => {
  await addCollection('Brunch');
  await addPlace(newPlace());
  const text = await exportBackup();
  const result = await restoreBackup(text);
  assert.deepEqual(result, { placesAdded: 0, placesSkipped: 1, collectionsAdded: 0 });
  assert.equal((await listPlaces()).length, 1);
  assert.equal((await listCollections()).length, 1);
});

test('a place saved again by hand on the new phone is not doubled', async () => {
  await addPlace(newPlace());
  const text = await exportBackup();
  await deleteAllData();
  await addPlace(newPlace()); // same Google place, new id
  const result = await restoreBackup(text);
  assert.equal(result.placesSkipped, 1);
  assert.equal((await listPlaces()).length, 1);
});

test('a collection with the same name is reused and the place joins it', async () => {
  await addCollection('Brunch');
  const fileText = JSON.stringify({
    app: 'spotted',
    version: 1,
    places: [{ id: 'x1', googlePlaceId: 'g9', name: 'Tom & Serg', latitude: 25.1, longitude: 55.2, category: 'food', collectionIds: ['c-old'] }],
    collections: [{ id: 'c-old', name: 'brunch', createdAt: '2026-01-01T00:00:00.000Z' }],
  });
  const result = await restoreBackup(fileText);
  assert.equal(result.collectionsAdded, 0);
  const [phoneCollection] = await listCollections();
  const [place] = await listPlaces();
  assert.deepEqual(place.collectionIds, [phoneCollection.id]);
});

test('damaged places are skipped and the good ones are kept', async () => {
  const fileText = JSON.stringify({
    app: 'spotted',
    version: 1,
    places: [
      { id: 'ok', name: 'Good', latitude: 25, longitude: 55, category: 'fun' },
      { id: 'bad1', name: 'No location', category: 'fun' },
      { id: 'bad2', name: 'Odd category', latitude: 25, longitude: 55, category: 'cars' },
      'nonsense',
    ],
  });
  const result = await restoreBackup(fileText);
  assert.equal(result.placesAdded, 1);
  assert.equal(result.placesSkipped, 3);
});

test('odd settings in a file fall back to the defaults', () => {
  const backup = parseBackup(
    JSON.stringify({ app: 'spotted', version: 1, places: [], settings: { radiusMeters: 7, quietStart: '99:00', remindersEnabled: false } })
  );
  assert.equal(backup.settings.radiusMeters, 300);
  assert.equal(backup.settings.quietStart, '22:00');
  assert.equal(backup.settings.remindersEnabled, false);
});

test('a file that is not a Spotted backup is refused and nothing changes', async () => {
  await addPlace(newPlace());
  await assert.rejects(restoreBackup('hello'), /Spotted backup/);
  await assert.rejects(restoreBackup('{"places": []}'), /Spotted backup/);
  await assert.rejects(restoreBackup('{"app":"spotted","version":99,"places":[]}'), /newer version/);
  assert.equal((await listPlaces()).length, 1);
});
