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
const { syncGeofencing } = app('src/geofence/sync.js');
const { cancelAllReminders } = app('src/geofence/notify.js');
app('src/geofence/tasks.js'); // registers the background jobs with the pretend phone

const newPlace = (i) => ({ googlePlaceId: 'g' + i, name: 'Place ' + i, address: 'Dubai', latitude: 25.2 + i * 0.001, longitude: 55.27, category: 'food' });
const geofenceJob = () => phone.tasks['spotted-geofence'];
const enter = (id) => ({ data: { eventType: 1, region: { identifier: id } } });

test.beforeEach(async () => {
  phone.reset();
  await useTestDatabase(makeTestDb());
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
    assert.equal(phone.scheduled[0].content.body, `You're near ${place.name} — you saved it from a reel 👀`);
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
  assert.equal(phone.started, false, 'nothing left to watch');
});
