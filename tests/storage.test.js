// On-phone storage: places, settings, the "welcome done" note, change announcements, delete all.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb } = require('./helpers/fakes');
installFakes({});
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');

const cafe = { googlePlaceId: 'g1', name: 'Cafe A', address: 'Dubai', latitude: 25.2, longitude: 55.27, category: 'food', note: 'pistachio croissant', reelUrl: 'https://instagram.com/reel/1' };
const shop = { googlePlaceId: 'g2', name: 'Shop B', address: 'Dubai', latitude: 25.1, longitude: 55.1, category: 'shopping' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test.beforeEach(async () => {
  await useTestDatabase(makeTestDb()); // a fresh, empty database for every test
});

test('add, list (newest first), edit, delete', async () => {
  const a = await data.addPlace(cafe);
  await sleep(5);
  const b = await data.addPlace(shop);

  const list = await data.listPlaces();
  assert.deepStrictEqual(list.map((p) => p.name), ['Shop B', 'Cafe A'], 'newest first');
  assert.equal(list[0].note, undefined);
  assert.equal(list[1].note, 'pistachio croissant');
  assert.equal(list[1].latitude, 25.2);

  await data.updatePlace(a.id, { category: 'fun', note: undefined });
  const edited = await data.getPlace(a.id);
  assert.equal(edited.category, 'fun');
  assert.equal(edited.note, undefined, 'a note can be cleared');
  assert.equal(edited.name, 'Cafe A', 'other fields stay');

  await data.updatePlace(a.id, { lastNotifiedAt: '2026-10-18T10:00:00.000Z' });
  assert.equal((await data.getPlace(a.id)).lastNotifiedAt, '2026-10-18T10:00:00.000Z');

  await data.deletePlace(b.id);
  assert.equal((await data.listPlaces()).length, 1);
  assert.equal(await data.getPlace(b.id), null);
});

test('settings start with the defaults and keep changes', async () => {
  const defaults = await data.getSettings();
  assert.deepStrictEqual(defaults, data.DEFAULT_SETTINGS);
  assert.equal(defaults.radiusMeters, 300);

  const saved = await data.saveSettings({ radiusMeters: 500, quietHoursEnabled: false });
  assert.equal(saved.radiusMeters, 500);
  const again = await data.getSettings();
  assert.equal(again.radiusMeters, 500);
  assert.equal(again.quietHoursEnabled, false);
  assert.equal(again.quietStart, '22:00', 'untouched settings keep their defaults');
});

test('"welcome done" note survives delete-all; delete-all clears places and settings', async () => {
  assert.equal(await data.getOnboardingDone(), false);
  await data.setOnboardingDone();
  assert.equal(await data.getOnboardingDone(), true);
  await data.resetOnboarding();
  assert.equal(await data.getOnboardingDone(), false);
  await data.setOnboardingDone();

  await data.addPlace(cafe);
  await data.saveSettings({ radiusMeters: 1000 });
  await data.deleteAllData();
  assert.equal((await data.listPlaces()).length, 0);
  assert.deepStrictEqual(await data.getSettings(), data.DEFAULT_SETTINGS);
  assert.equal(await data.getOnboardingDone(), true, 'the user does not see the welcome screens again');
});

test('every change is announced (the reminder watcher relies on this)', async () => {
  let announced = 0;
  const stop = data.onDataChanged(() => announced++);
  const a = await data.addPlace(cafe);                 // 1
  await data.updatePlace(a.id, { note: 'x' });         // 2
  await data.saveSettings({ radiusMeters: 200 });      // 3
  await data.deletePlace(a.id);                        // 4
  await data.deleteAllData();                          // 5
  assert.equal(announced, 5);
  stop();
  await data.addPlace(cafe);
  assert.equal(announced, 5, 'stops listening after unsubscribing');
});

test('damaged settings never crash the app', async () => {
  const db = makeTestDb();
  await useTestDatabase(db);
  db.raw.prepare("INSERT INTO settings (id, json) VALUES (1, 'this is not json')").run();
  assert.deepStrictEqual(await data.getSettings(), data.DEFAULT_SETTINGS);
});
