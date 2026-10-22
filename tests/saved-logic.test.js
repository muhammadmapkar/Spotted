// The Saved tab's rules (folders, search, filters, labels) and how saved places are kept on the phone.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb } = require('./helpers/fakes');
installFakes({});
const mock = app('src/data/mock.js');
const home = app('src/home/homeData.js');
const rules = app('src/saved/savedData.js');
const store = app('src/state/saved.js');
const service = app('src/services/savedPlaces.js');
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');

const savedAtStart = () => new Set(mock.PLACES.filter((p) => p.saved).map((p) => p.id));
const ids = (list) => list.map((p) => p.id);
const ALL = () => rules.savedPlaces(savedAtStart());

test.beforeEach(async () => { await useTestDatabase(makeTestDb()); store.resetSaved(); });

// ---- folders and lists -----------------------------------------------------------------------

test('saved places are the ones the user saved, nearest first', () => {
  assert.deepStrictEqual(ids(ALL()), ['saffron', 'brew', 'taco', 'stack', 'luma', 'forno', 'starlight', 'kaze', 'thread', 'shawarma']);
  assert.deepStrictEqual(ids(rules.savedPlaces(new Set(['kiln', 'brew']))), ['brew', 'kiln']);
  assert.deepStrictEqual(rules.savedPlaces(new Set()), []);
});

test('four folders: All saved, Food, Shopping, Fun, with counts, up to 3 logos and staggered pop-in', () => {
  const tiles = rules.folderTiles(ALL());
  assert.deepStrictEqual(tiles.map((t) => t.name), ['All saved', 'Food', 'Shopping', 'Fun']);
  assert.deepStrictEqual(tiles.map((t) => t.count), [10, 7, 2, 1]);
  assert.deepStrictEqual(tiles.map((t) => t.countLabel), ['10 places', '7 places', '2 places', '1 place']);
  assert.deepStrictEqual(tiles.map((t) => ids(t.minis)), [['saffron', 'brew', 'taco'], ['saffron', 'brew', 'taco'], ['luma', 'thread'], ['starlight']]);
  assert.deepStrictEqual(tiles.map((t) => t.delay), [0, 80, 160, 240]);
  assert.deepStrictEqual(tiles.map((t) => t.colors), [['#9D4EDD', '#5A189A'], ['#F4A259', '#D62839'], ['#F15BB5', '#7209B7'], ['#4CC9F0', '#3451D1']]);
});

test('saving a place puts it in the folder of its group', () => {
  const withGlow = rules.folderTiles(rules.savedPlaces(new Set([...savedAtStart(), 'glow'])));
  assert.deepStrictEqual(withGlow.map((t) => t.count), [11, 7, 2, 2]);
  assert.deepStrictEqual(ids(withGlow[3].minis), ['glow', 'starlight'].sort((a, b) => mock.placeById(a).dist - mock.placeById(b).dist));
  const empty = rules.folderTiles([]);
  assert.deepStrictEqual(empty.map((t) => [t.count, t.countLabel, t.minis.length]), [[0, '0 places', 0], [0, '0 places', 0], [0, '0 places', 0], [0, '0 places', 0]]);
});

test('labels: the title line and the folder names', () => {
  assert.equal(rules.savedTotalLabel(12), "12 places you've spotted");
  assert.equal(rules.savedTotalLabel(1), "1 place you've spotted");
  assert.equal(rules.savedTotalLabel(0), "0 places you've spotted");
  assert.equal(rules.folderName('all'), 'All saved');
  assert.equal(rules.folderName('Shopping'), 'Shopping');
});

test('folder tiles are shown only with nothing typed, no filter on, and no folder open', () => {
  const none = home.NO_FILTERS;
  assert.equal(rules.showFolderTiles(null, '', none), true);
  assert.equal(rules.showFolderTiles(null, '   ', none), true, 'spaces are not a search');
  assert.equal(rules.showFolderTiles('Food', '', none), false);
  assert.equal(rules.showFolderTiles(null, 'x', none), false);
  assert.equal(rules.showFolderTiles(null, '', { ...none, infl: true }), false);
  assert.equal(rules.showFolderTiles(null, '', { ...none, budget: 100 }), false);
});

test('a folder shows only its own places', () => {
  const none = home.NO_FILTERS;
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), 'Shopping', '', none)), ['luma', 'thread']);
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), 'Fun', '', none)), ['starlight']);
  assert.equal(rules.visibleSaved(ALL(), 'all', '', none).length, 10);
  assert.equal(rules.visibleSaved(ALL(), null, '', none).length, 10);
});

test('searching looks ONLY at saved places: "shopping" shows only the saved shops', () => {
  const none = home.NO_FILTERS;
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, 'shopping', none)), ['luma', 'thread']);
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, 'indian', none)), ['saffron'], 'Masala Junction is Indian but not saved');
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, 'birria', none)), ['taco'], 'menu items are searched');
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, 'zzz', none)), []);
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), 'Food', 'shopping', none)), [], 'a search inside a folder stays inside it');
});

test('the same filters as Home apply to the saved list', () => {
  const f = (patch) => ({ ...home.NO_FILTERS, ...patch });
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, '', f({ dist: 5 }))), ['saffron', 'brew', 'taco', 'stack']);
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, '', f({ budget: 30 }))), ['brew', 'taco', 'shawarma'].sort((a, b) => mock.placeById(a).dist - mock.placeById(b).dist));
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, '', f({ cat: 'Fun' }))), ['starlight']);
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), 'Food', '', f({ offers: true, dist: 5 }))), ['saffron', 'brew', 'stack']);
  assert.deepStrictEqual(ids(rules.visibleSaved(ALL(), null, 'cafe', f({ infl: true }))), ['brew']);
});

test('the filter sheet counts saved places only (the search words do not matter)', () => {
  assert.equal(rules.savedMatchCount(ALL(), home.NO_FILTERS), 10);
  assert.equal(rules.savedMatchCount(ALL(), { ...home.NO_FILTERS, dist: 5 }), 4);
  assert.equal(rules.savedMatchCount([], home.NO_FILTERS), 0);
});

test('friendly messages', () => {
  assert.equal(rules.NO_SAVED_MATCH, 'No saved places match. Try another word or clear a filter.');
  assert.match(rules.NOTHING_SAVED_YET, /Nothing saved yet/);
});

// ---- kept on the phone -----------------------------------------------------------------------

test('the service stores ids, returns null when nothing was ever stored, and can clear', async () => {
  assert.equal(await service.loadSavedPlaceIds(), null);
  await service.storeSavedPlaceIds(['a', 'b']);
  assert.deepStrictEqual(await service.loadSavedPlaceIds(), ['a', 'b']);
  await service.storeSavedPlaceIds([]);
  assert.deepStrictEqual(await service.loadSavedPlaceIds(), [], 'an empty list is remembered as empty');
  await service.clearSavedPlaceIds();
  assert.equal(await service.loadSavedPlaceIds(), null);
});

test('damaged stored data never crashes: the service says "nothing stored"', async () => {
  const db = makeTestDb();
  await useTestDatabase(db);
  db.raw.prepare("INSERT INTO meta (key, value) VALUES ('savedPlaceIds', 'not json')").run();
  assert.equal(await service.loadSavedPlaceIds(), null);
  db.raw.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('savedPlaceIds', '{\"a\":1}')").run();
  assert.equal(await service.loadSavedPlaceIds(), null, 'not a list');
  db.raw.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('savedPlaceIds', '[\"a\", 5, null, \"b\"]')").run();
  assert.deepStrictEqual(await service.loadSavedPlaceIds(), ['a', 'b'], 'only text ids are kept');
});

test('saving and un-saving is written to the phone, and survives a restart', async () => {
  assert.equal(store.toggleSaved('glow'), true);
  assert.equal(store.toggleSaved('saffron'), false);
  await store.savedWritesDone();
  const written = await service.loadSavedPlaceIds();
  assert.ok(written.includes('glow') && !written.includes('saffron'));
  // "restart": the memory goes back to the starting list, then the app loads what is on the phone
  store.resetSaved();
  assert.ok(store.getSavedIds().has('saffron') && !store.getSavedIds().has('glow'));
  await store.hydrateSaved();
  assert.ok(store.getSavedIds().has('glow'));
  assert.ok(!store.getSavedIds().has('saffron'));
  assert.equal(store.getSavedIds().size, 10);
});

test('first start keeps the starting list; removing everything is remembered as empty', async () => {
  await store.hydrateSaved();
  assert.equal(store.getSavedIds().size, 10, 'nothing stored yet: the sample saved places');
  for (const id of [...store.getSavedIds()]) store.toggleSaved(id);
  await store.savedWritesDone();
  store.resetSaved();
  await store.hydrateSaved();
  assert.equal(store.getSavedIds().size, 0, 'the empty list is not replaced by the sample places');
});

test('unknown ids from the phone are ignored', async () => {
  await service.storeSavedPlaceIds(['brew', 'old-removed-place', 'kiln']);
  await store.hydrateSaved();
  assert.deepStrictEqual([...store.getSavedIds()].sort(), ['brew', 'kiln']);
});

test('a broken phone storage never breaks saving', async () => {
  await useTestDatabase({ ...makeTestDb(), runAsync: async () => { throw new Error('disk full'); }, getFirstAsync: async () => { throw new Error('disk full'); } });
  assert.equal(store.toggleSaved('glow'), true, 'still saved in memory');
  await store.savedWritesDone();
  await store.hydrateSaved();
  assert.ok(store.getSavedIds().has('glow'), 'loading failed quietly and kept the list');
});

test('Delete all my data forgets the saved places too', async () => {
  store.toggleSaved('glow');
  await store.savedWritesDone();
  assert.ok((await service.loadSavedPlaceIds()).includes('glow'));
  await data.deleteAllData();
  assert.equal(await service.loadSavedPlaceIds(), null);
});
