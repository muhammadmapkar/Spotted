// Nearby reminders against a pretend phone: refused permissions, watching rules,
// the background job (notify / no repeat / quiet hours / reminders off), delete-all.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb, createPhone, atTime } = require('./helpers/fakes');

const { phone, fakes } = createPhone();
installFakes(fakes);
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');
const permissions = app('src/permissions/index.js');
const savedService = app('src/services/savedPlaces.js');
const { syncGeofencing } = app('src/geofence/sync.js');
const { cancelAllReminders } = app('src/geofence/notify.js');
app('src/geofence/tasks.js'); // registers the background jobs with the pretend phone

const newPlace = (i) => ({ googlePlaceId: 'g' + i, name: 'Place ' + i, address: 'Dubai', latitude: 25.2 + i * 0.001, longitude: 55.27, category: 'food' });
const geofenceJob = () => phone.tasks['spotted-geofence'];
const enter = (id) => ({ data: { eventType: 1, region: { identifier: id } } });

test.beforeEach(async () => {
  phone.reset();
  await useTestDatabase(makeTestDb());
  await savedService.storeSavedPlaceIds([]); // these tests are about places saved from reels; no saved Spotted places
});

test('refused permissions: nothing is watched, nothing crashes', async () => {
  await data.addPlace(newPlace(1));
  for (const refused of [{ fg: 'denied' }, { bg: 'denied' }, { notif: 'denied' }]) {
    phone.reset();
    Object.assign(phone, refused);
    await syncGeofencing();
    assert.equal(phone.started, false, 'must not watch when a permission is refused: ' + JSON.stringify(refused));
  }
});

test('a broken phone (every call fails): no crash, permissions count as "no"', async () => {
  await data.addPlace(newPlace(1));
  phone.throwAll = true;
  await syncGeofencing();
  assert.deepStrictEqual(await permissions.getPermissionState(), { location: false, background: false, notifications: false });
  assert.equal(await permissions.requestLocation(), false);
  assert.equal(await permissions.requestBackgroundLocation(), false);
  assert.equal(await permissions.requestNotifications(), false);
});

test('everything allowed: watches with the chosen radius', async () => {
  await data.addPlace(newPlace(1));
  await data.saveSettings({ radiusMeters: 500 });
  await syncGeofencing();
  assert.equal(phone.started, true);
  assert.equal(phone.regions.length, 1);
  assert.equal(phone.regions[0].radius, 500);
  assert.equal(phone.regions[0].notifyOnEnter, true);
  assert.equal(phone.updates, false, 'no movement tracking needed with 20 or fewer places');
});

test('reminders switched off: stops watching', async () => {
  await data.addPlace(newPlace(1));
  await syncGeofencing();
  assert.equal(phone.started, true);
  await data.saveSettings({ remindersEnabled: false });
  await syncGeofencing();
  assert.equal(phone.started, false);
});

test('more than 20 places: only the 20 nearest, plus movement tracking; back to 15: tracking stops', async () => {
  for (let i = 1; i <= 25; i++) await data.addPlace(newPlace(i));
  await syncGeofencing();
  assert.equal(phone.regions.length, 20);
  assert.equal(phone.updates, true);

  const all = await data.listPlaces();
  for (const p of all.slice(0, 10)) await data.deletePlace(p.id);
  await syncGeofencing();
  assert.equal(phone.regions.length, 15);
  assert.equal(phone.updates, false);
});

test('walking into a circle: one notification with the right text; no repeat within 24 hours', async () => {
  const place = await data.addPlace(newPlace(1));
  await atTime(12, 0, async () => {
    await geofenceJob()(enter(place.id));
    assert.equal(phone.scheduled.length, 1, 'first time: notify');
    assert.equal(phone.scheduled[0].content.title, 'A place you saved is 110 m away', 'the real distance from where the phone is');
    assert.equal(phone.scheduled[0].content.body, place.name);
    assert.equal(phone.scheduled[0].content.data.placeId, place.id, 'tapping it can open this place');

    await geofenceJob()(enter(place.id));
    assert.equal(phone.scheduled.length, 1, 'second time within 24 hours: no repeat');
  });
});

test('leaving a circle, job errors and deleted places are ignored safely', async () => {
  const place = await data.addPlace(newPlace(1));
  await atTime(12, 0, async () => {
    await geofenceJob()({ data: { eventType: 2, region: { identifier: place.id } } });
    await geofenceJob()({ error: new Error('x') });
    await geofenceJob()(enter('a-place-that-was-deleted'));
    assert.equal(phone.scheduled.length, 0);
  });
});

test('quiet hours and the reminders switch silence the job', async () => {
  const place = await data.addPlace(newPlace(1));
  await atTime(23, 30, async () => {
    await geofenceJob()(enter(place.id));
    assert.equal(phone.scheduled.length, 0, 'quiet hours: no notification');
  });
  await data.saveSettings({ remindersEnabled: false });
  await atTime(12, 0, async () => {
    await geofenceJob()(enter(place.id));
    assert.equal(phone.scheduled.length, 0, 'reminders off: no notification');
  });
});

test('delete all my data: everything is gone, watching stops, waiting reminders are removed', async () => {
  const place = await data.addPlace(newPlace(1));
  await syncGeofencing();
  assert.equal(phone.started, true);
  await atTime(12, 0, async () => geofenceJob()(enter(place.id)));
  assert.equal(phone.scheduled.length, 1);

  await data.deleteAllData();
  await cancelAllReminders();
  assert.equal((await data.listPlaces()).length, 0);
  assert.deepStrictEqual(await data.getSettings(), data.DEFAULT_SETTINGS);
  assert.equal(phone.scheduled.length, 0, 'waiting reminders are removed');
  await syncGeofencing();
  // The places saved from reels are gone. (The sample saved Spotted places come back with the starting list.)
  assert.ok((phone.regions ?? []).every((r) => r.identifier.startsWith('venue:')), 'no place saved from a reel is watched any more');
});


// ---- saved Spotted places (the Saved tab) -----------------------------------------------------

const venueEnter = (id) => enter('venue:' + id);

test('saved Spotted places are watched too, as "venue:<id>" circles with the chosen radius', async () => {
  await savedService.storeSavedPlaceIds(['saffron', 'brew']);
  await data.saveSettings({ radiusMeters: 500 });
  await syncGeofencing();
  assert.equal(phone.started, true);
  assert.deepStrictEqual(phone.regions.map((r) => r.identifier).sort(), ['venue:brew', 'venue:saffron']);
  assert.ok(phone.regions.every((r) => r.radius === 500 && r.notifyOnEnter === true && r.notifyOnExit === false));
  const saffron = phone.regions.find((r) => r.identifier === 'venue:saffron');
  assert.ok(Math.abs(saffron.latitude - 24.42) < 0.1 && Math.abs(saffron.longitude - 54.58) < 0.1, 'around the sample area');
});

test('never saved or removed anything yet: the starting saved places are watched', async () => {
  await savedService.clearSavedPlaceIds();
  await syncGeofencing();
  assert.equal(phone.regions.length, 10);
});

test('reel places and saved Spotted places share the limit of 20; only the nearest 20 are watched', async () => {
  for (let i = 1; i <= 15; i++) await data.addPlace(newPlace(i));
  await savedService.storeSavedPlaceIds(['saffron', 'brew', 'taco', 'stack', 'luma', 'forno', 'starlight', 'kaze', 'thread', 'shawarma']);
  await syncGeofencing();
  assert.equal(phone.regions.length, 20);
  assert.equal(phone.updates, true, 'more than 20 in total: movement tracking refreshes the list');
  // the phone is near Dubai (25.2, 55.27): the 15 reel places there beat the Abu Dhabi ones
  assert.equal(phone.regions.filter((r) => !r.identifier.startsWith('venue:')).length, 15);
  assert.equal(phone.regions.filter((r) => r.identifier.startsWith('venue:')).length, 5);
});

test('saving or un-saving a Spotted place makes the phone watch the new list', async () => {
  await savedService.storeSavedPlaceIds(['saffron']);
  await syncGeofencing();
  assert.equal(phone.regions.length, 1);
  const store = app('src/state/saved.js');
  store.resetSaved();
  let announced = 0;
  const stop = data.onDataChanged(() => announced++);
  store.toggleSaved('glow');
  await store.savedWritesDone();
  assert.ok(announced >= 1, 'saving announces a change, so the watcher syncs');
  stop();
  await syncGeofencing();
  assert.ok(phone.regions.some((r) => r.identifier === 'venue:glow'));
});

test('walking into a saved Spotted place: the alert has the right words and opens the Place page', async () => {
  await savedService.storeSavedPlaceIds(['saffron']);
  await atTime(12, 0, async () => {
    await geofenceJob()(venueEnter('saffron'));
    assert.equal(phone.scheduled.length, 1);
    const { title, body, data: payload } = phone.scheduled[0].content;
    assert.match(title, /^A place you saved is (\d+ m|\d+(\.\d)? km) away$/);
    assert.equal(body, 'Saffron Lane · 5 influencers recommend it');
    assert.deepStrictEqual(payload, { venueId: 'saffron' });
  });
});

test('a saved Spotted place never alerts twice within 24 hours', async () => {
  await atTime(12, 0, async () => {
    await geofenceJob()(venueEnter('saffron'));
    await geofenceJob()(venueEnter('saffron'));
    assert.equal(phone.scheduled.length, 1, 'the second time is silent');
    await geofenceJob()(venueEnter('brew'));
    assert.equal(phone.scheduled.length, 2, 'another place still alerts');
  });
  const stamp = await data.getLastAlertAt('saffron');
  assert.ok(stamp, 'the time is written down');
  const later = new Date(new Date(stamp).getTime() + 25 * 3600 * 1000);
  const RealDate = Date;
  global.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(later.getTime()); } static now() { return later.getTime(); } };
  try {
    phone.scheduled.length = 0;
    await geofenceJob()(venueEnter('saffron'));
    assert.equal(phone.scheduled.length, 1, 'but 25 hours later (13:00 the next day) it alerts again');
  } finally { global.Date = RealDate; }
});

test('quiet hours, the reminders switch, unknown places and leaving a circle silence saved Spotted places', async () => {
  await atTime(23, 30, async () => { await geofenceJob()(venueEnter('saffron')); });
  assert.equal(phone.scheduled.length, 0, 'quiet hours');
  await atTime(12, 0, async () => {
    await geofenceJob()({ data: { eventType: 2, region: { identifier: 'venue:saffron' } } });
    await geofenceJob()(venueEnter('no-such-place'));
    assert.equal(phone.scheduled.length, 0, 'leaving, and a place that no longer exists');
    await data.saveSettings({ remindersEnabled: false });
    await geofenceJob()(venueEnter('saffron'));
    assert.equal(phone.scheduled.length, 0, 'reminders off');
  });
});

test('if the phone cannot tell where the user is, the alert says the place is nearby', async () => {
  const known = phone.position;
  phone.position = null;
  try {
    await atTime(12, 0, async () => { await geofenceJob()(venueEnter('saffron')); });
  } finally {
    phone.position = known;
  }
  assert.equal(phone.scheduled.length, 1);
  assert.equal(phone.scheduled[0].content.title, 'A place you saved is nearby');
});

test('Delete all my data forgets when places last alerted', async () => {
  await atTime(12, 0, async () => { await geofenceJob()(venueEnter('saffron')); });
  assert.ok(await data.getLastAlertAt('saffron'));
  await data.deleteAllData();
  assert.equal(await data.getLastAlertAt('saffron'), undefined);
});
