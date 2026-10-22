// Turning on "Nearby saved-place alerts": the phone's questions come in the right order, "all the time" is only
// asked after our own explanation and only when the user turns alerts on, and refusals are handled kindly.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb } = require('./helpers/fakes');

installFakes({});
const asked = [];
const phone = { location: false, background: false, notifications: false, grant: { location: true, background: true, notifications: true } };
installFakes({
  '../permissions': {
    getPermissionState: async () => ({ location: phone.location, background: phone.background, notifications: phone.notifications }),
    requestLocation: async () => { asked.push('location'); if (phone.grant.location) phone.location = true; return phone.grant.location; },
    requestBackgroundLocation: async () => { asked.push('background'); if (phone.grant.background) phone.background = true; return phone.grant.background; },
    requestNotifications: async () => { asked.push('notifications'); if (phone.grant.notifications) phone.notifications = true; return phone.grant.notifications; },
  },
});
const flow = app('src/alerts/enableAlerts.js');
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');

test.beforeEach(async () => {
  asked.length = 0;
  Object.assign(phone, { location: false, background: false, notifications: false, grant: { location: true, background: true, notifications: true } });
  await useTestDatabase(makeTestDb());
  await data.saveSettings({ remindersEnabled: false });
});
const yes = async () => { asked.push('explained'); return true; };

test('the questions come in order: while using, then our explanation, then all the time, then notifications', async () => {
  assert.equal(await flow.turnOnNearbyAlerts(yes), 'on');
  assert.deepStrictEqual(asked, ['location', 'explained', 'background', 'notifications']);
  assert.equal((await data.getSettings()).remindersEnabled, true, 'the alerts are switched on');
});

test('what was already allowed is not asked again', async () => {
  Object.assign(phone, { location: true, background: true, notifications: true });
  assert.equal(await flow.turnOnNearbyAlerts(yes), 'on');
  assert.deepStrictEqual(asked, []);
  asked.length = 0; Object.assign(phone, { location: true, background: false, notifications: true });
  assert.equal(await flow.turnOnNearbyAlerts(yes), 'on');
  assert.deepStrictEqual(asked, ['explained', 'background'], 'only "all the time" is missing');
});

test('"all the time" is never asked if the user says no to our explanation', async () => {
  phone.location = true;
  assert.equal(await flow.turnOnNearbyAlerts(async () => { asked.push('explained'); return false; }), 'declined');
  assert.deepStrictEqual(asked, ['explained']);
  assert.equal((await data.getSettings()).remindersEnabled, false, 'nothing was switched on');
});

test('refusing location while using stops there', async () => {
  phone.grant.location = false;
  assert.equal(await flow.turnOnNearbyAlerts(yes), 'declined');
  assert.deepStrictEqual(asked, ['location']);
  assert.equal((await data.getSettings()).remindersEnabled, false);
});

test('refusing "all the time" says so, switches nothing on, and does not ask for notifications yet', async () => {
  phone.location = true; phone.grant.background = false;
  assert.equal(await flow.turnOnNearbyAlerts(yes), 'need-always');
  assert.ok(!asked.includes('notifications'));
  assert.equal((await data.getSettings()).remindersEnabled, false);
});

test('refusing notifications says so and switches nothing on', async () => {
  Object.assign(phone, { location: true, background: true }); phone.grant.notifications = false;
  assert.equal(await flow.turnOnNearbyAlerts(yes), 'need-notifications');
  assert.equal((await data.getSettings()).remindersEnabled, false);
});

test('friendly messages for each outcome', () => {
  assert.equal(flow.missingMessage('on'), null);
  assert.match(flow.missingMessage('need-always'), /Allow all the time/);
  assert.match(flow.missingMessage('need-notifications'), /notifications/);
  assert.match(flow.missingMessage('declined'), /stay off/);
  assert.match(flow.ALWAYS_EXPLANATION, /even when Spotted is closed/);
  assert.match(flow.ALWAYS_EXPLANATION, /stays on your phone/);
});
