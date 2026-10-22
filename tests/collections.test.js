// Collections: the user's own lists. Names, membership, rename, delete, delete-all.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb } = require('./helpers/fakes');
installFakes({});
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');

const place = (n, extra = {}) => ({ googlePlaceId: 'g' + n, name: 'Place ' + n, address: 'Dubai', latitude: 25 + n / 100, longitude: 55, category: 'food', ...extra });
const names = (list) => list.map((c) => c.name);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let db;

test.beforeEach(async () => {
  db = makeTestDb();
  await useTestDatabase(db);
});

test('making collections: tidy names, 40-character limit, no duplicates, no empty names', async () => {
  assert.deepStrictEqual(await data.listCollections(), []);
  const brunch = await data.addCollection('  Dubai   brunch spots ');
  assert.equal(brunch.name, 'Dubai brunch spots', 'extra spaces are tidied');
  await sleep(3);
  await data.addCollection('Date night');
  await sleep(3);
  await data.addCollection('x'.repeat(60));

  const all = await data.listCollections();
  assert.equal(all[2].name.length, 40, 'long names are cut to 40');
  assert.deepStrictEqual(names(all).slice(0, 2), ['Dubai brunch spots', 'Date night'], 'oldest first');

  const again = await data.addCollection('DUBAI BRUNCH SPOTS');
  assert.equal(again.id, brunch.id, 'the same name (any case) returns the existing one');
  assert.equal((await data.listCollections()).length, 3);
  await assert.rejects(data.addCollection('   '), /needs a name/);
});

test('places can be in none, one or many collections', async () => {
  const brunch = await data.addCollection('Brunch');
  const date = await data.addCollection('Date night');

  const p1 = await data.addPlace(place(1, { collectionIds: [brunch.id, date.id] }));
  const p2 = await data.addPlace(place(2, { collectionIds: [brunch.id, brunch.id, 'not-a-real-id'] }));
  const p3 = await data.addPlace(place(3));

  assert.deepStrictEqual([...p1.collectionIds].sort(), [brunch.id, date.id].sort());
  assert.deepStrictEqual(p2.collectionIds, [brunch.id], 'duplicates and unknown ids are ignored');
  assert.deepStrictEqual(p3.collectionIds, []);

  const all = await data.listPlaces();
  assert.equal(all.filter((p) => p.collectionIds.includes(brunch.id)).length, 2);

  const counts = Object.fromEntries((await data.listCollectionsWithCounts()).map((c) => [c.name, c.placeCount]));
  assert.equal(counts.Brunch, 2);
  assert.equal(counts['Date night'], 1);
});

test('editing a place\'s collections, and other edits leaving them alone', async () => {
  const brunch = await data.addCollection('Brunch');
  const date = await data.addCollection('Date night');
  const p = await data.addPlace(place(1, { collectionIds: [brunch.id] }));

  await data.updatePlace(p.id, { collectionIds: [date.id] });
  assert.deepStrictEqual((await data.getPlace(p.id)).collectionIds, [date.id]);
  await data.updatePlace(p.id, { collectionIds: [] });
  assert.deepStrictEqual((await data.getPlace(p.id)).collectionIds, [], 'can leave all collections');

  await data.updatePlace(p.id, { collectionIds: [brunch.id] });
  // This is exactly what the background reminder job does: it must not touch collections.
  await data.updatePlace(p.id, { lastNotifiedAt: '2026-10-19T10:00:00.000Z', note: 'hi' });
  const after = await data.getPlace(p.id);
  assert.deepStrictEqual(after.collectionIds, [brunch.id], 'editing other fields keeps collections');
  assert.equal(after.note, 'hi');
});

test('renaming: clashes are refused, changing only the case is fine', async () => {
  const brunch = await data.addCollection('Dubai brunch spots');
  const date = await data.addCollection('Date night');

  await data.renameCollection(date.id, '  Date   night out ');
  assert.ok(names(await data.listCollections()).includes('Date night out'));
  await assert.rejects(data.renameCollection(date.id, 'dubai brunch spots'), /already have/);
  await data.renameCollection(date.id, 'DATE NIGHT OUT');
  assert.ok(names(await data.listCollections()).includes('DATE NIGHT OUT'));
  await assert.rejects(data.renameCollection(date.id, ''), /needs a name/);
  assert.equal((await data.listCollections()).find((c) => c.id === brunch.id).name, 'Dubai brunch spots');
});

test('deleting a collection never deletes its places', async () => {
  const brunch = await data.addCollection('Brunch');
  const date = await data.addCollection('Date night');
  await data.addPlace(place(1, { collectionIds: [brunch.id] }));
  const p2 = await data.addPlace(place(2, { collectionIds: [brunch.id, date.id] }));

  await data.deleteCollection(brunch.id);
  const all = await data.listPlaces();
  assert.equal(all.length, 2, 'the places are still there');
  assert.ok(all.every((p) => !p.collectionIds.includes(brunch.id)));
  assert.deepStrictEqual((await data.getPlace(p2.id)).collectionIds, [date.id], 'other collections untouched');
});

test('deleting a place cleans up its collection links; delete-all clears collections too', async () => {
  const brunch = await data.addCollection('Brunch');
  const p = await data.addPlace(place(1, { collectionIds: [brunch.id] }));
  await data.deletePlace(p.id);
  assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM place_collections').get().n, 0);

  await data.addPlace(place(2, { collectionIds: [brunch.id] }));
  await data.deleteAllData();
  assert.equal((await data.listPlaces()).length, 0);
  assert.equal((await data.listCollections()).length, 0);
  assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM place_collections').get().n, 0);
});
