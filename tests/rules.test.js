// Reminder rules: nearest 20 places, quiet hours, the 24-hour no-repeat rule, the notification text.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');
const rules = app('src/geofence/rules.js');

const SETTINGS = { remindersEnabled: true, radiusMeters: 300, quietHoursEnabled: true, quietStart: '22:00', quietEnd: '08:00' };
const at = (h, m = 0) => new Date(2026, 9, 19, h, m);
const place = (id, lat, lon, extra = {}) => ({
  id, name: id, googlePlaceId: id, address: '', latitude: lat, longitude: lon,
  category: 'food', createdAt: '2026-10-01T00:00:00.000Z', collectionIds: [], ...extra,
});
const hoursAgo = (now, h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

test('quiet hours: overnight span 22:00 to 08:00', () => {
  const quiet = (h, m) => rules.isQuietTime(at(h, m), SETTINGS);
  assert.equal(quiet(21, 59), false);
  assert.equal(quiet(22, 0), true);
  assert.equal(quiet(23, 30), true);
  assert.equal(quiet(0, 0), true);
  assert.equal(quiet(7, 59), true);
  assert.equal(quiet(8, 0), false);
  assert.equal(quiet(13, 0), false);
});

test('quiet hours: off switch, same-day span, and equal start/end', () => {
  assert.equal(rules.isQuietTime(at(23, 30), { ...SETTINGS, quietHoursEnabled: false }), false);
  const daytime = { ...SETTINGS, quietStart: '13:00', quietEnd: '15:00' };
  assert.equal(rules.isQuietTime(at(12, 59), daytime), false);
  assert.equal(rules.isQuietTime(at(14, 0), daytime), true);
  assert.equal(rules.isQuietTime(at(15, 0), daytime), false);
  assert.equal(rules.isQuietTime(at(3), { ...SETTINGS, quietStart: '08:00', quietEnd: '08:00' }), false);
});

test('24-hour rule: exactly 24 hours is allowed again, 23.9 is not', () => {
  const now = at(12);
  assert.equal(rules.notifiedRecently(place('a', 0, 0), now), false);
  assert.equal(rules.notifiedRecently(place('a', 0, 0, { lastNotifiedAt: hoursAgo(now, 23.9) }), now), true);
  assert.equal(rules.notifiedRecently(place('a', 0, 0, { lastNotifiedAt: hoursAgo(now, 24) }), now), false);
  assert.equal(rules.notifiedRecently(place('a', 0, 0, { lastNotifiedAt: 'garbage' }), now), false);
});

test('shouldNotify combines reminders switch, quiet hours and the 24-hour rule', () => {
  const p = place('a', 0, 0);
  assert.equal(rules.shouldNotify(p, at(12), SETTINGS), true);
  assert.equal(rules.shouldNotify(p, at(12), { ...SETTINGS, remindersEnabled: false }), false);
  assert.equal(rules.shouldNotify(p, at(23), SETTINGS), false);
  assert.equal(rules.shouldNotify(place('a', 0, 0, { lastNotifiedAt: hoursAgo(at(12), 2) }), at(12), SETTINGS), false);
  assert.equal(rules.shouldNotify(place('a', 0, 0, { lastNotifiedAt: hoursAgo(at(12), 30) }), at(12), SETTINGS), true);
});

test('alert text: "A place you saved is 1.2 km away" and "Name . N influencers recommend it"', () => {
  assert.equal(rules.alertTitle(1234), 'A place you saved is 1.2 km away');
  assert.equal(rules.alertTitle(280), 'A place you saved is 280 m away');
  assert.equal(rules.alertTitle(null), 'A place you saved is nearby', 'distance unknown');
  assert.equal(rules.alertBody('Saffron Lane', 5), 'Saffron Lane · 5 influencers recommend it');
  assert.equal(rules.alertBody('Saffron Lane', 1), 'Saffron Lane · 1 influencer recommends it');
  assert.equal(rules.alertBody('Kite Beach', 0), 'Kite Beach', 'no influencer line when nobody has recommended it');
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(rules.alertTitle(100) + rules.alertBody('x', 3)), 'no emoji');
});

test('distances are said the way people say them', () => {
  assert.equal(rules.formatAway(0), '10 m');
  assert.equal(rules.formatAway(284), '280 m');
  assert.equal(rules.formatAway(999), '1.0 km', 'never "1000 m"');
  assert.equal(rules.formatAway(994), '990 m');
  assert.equal(rules.formatAway(1000), '1.0 km');
  assert.equal(rules.formatAway(1249), '1.2 km');
  assert.equal(rules.formatAway(12600), '13 km');
});

test('the same rules work for saved Spotted places (24 hours, quiet hours) with only a "last alert" time', () => {
  assert.equal(rules.shouldNotify({}, at(12), SETTINGS), true);
  assert.equal(rules.shouldNotify({ lastNotifiedAt: hoursAgo(at(12), 2) }, at(12), SETTINGS), false);
  assert.equal(rules.shouldNotify({ lastNotifiedAt: hoursAgo(at(12), 25) }, at(12), SETTINGS), true);
  assert.equal(rules.shouldNotify({}, at(23), SETTINGS), false);
});

test('nearest 20 works for the mixed list of reel places and saved Spotted places', () => {
  const targets = [];
  for (let i = 0; i < 30; i++) targets.push({ identifier: i % 2 ? 'venue:v' + i : 'p' + i, latitude: 25 + i * 0.01, longitude: 55 });
  const nearest = rules.nearestTargets(targets, { latitude: 25, longitude: 55 });
  assert.equal(nearest.length, 20);
  assert.deepStrictEqual(nearest.slice(0, 3).map((t) => t.identifier), ['p0', 'venue:v1', 'p2']);
  assert.equal(rules.nearestTargets(targets, null)[0].identifier, 'p0', 'unknown position: the first 20 given');
  assert.equal(rules.nearestTargets(targets.slice(0, 4), { latitude: 25, longitude: 55 }).length, 4);
  assert.equal(rules.nearestTargets(targets, { latitude: 25, longitude: 55 }, 5).length, 5);
});

test('nearest 20: picks the closest, never reorders the original list', () => {
  const places = [];
  for (let i = 0; i < 30; i++) places.push(place('p' + i, 25 + i * 0.01, 55)); // p0 is closest to (25, 55)
  const here = { latitude: 25, longitude: 55 };

  const near = rules.nearestPlaces(places, here);
  assert.equal(near.length, 20);
  assert.equal(near[0].id, 'p0');
  assert.equal(near[19].id, 'p19');

  const far = rules.nearestPlaces(places, { latitude: 25.29, longitude: 55 }); // now p29 is closest
  assert.equal(far[0].id, 'p29');
  assert.ok(!far.some((p) => p.id === 'p0'));

  assert.equal(rules.nearestPlaces(places, null).length, 20, 'unknown position: newest 20');
  assert.equal(rules.nearestPlaces(places, null)[0].id, 'p0');
  assert.equal(rules.nearestPlaces(places.slice(0, 3), here).length, 3);
  assert.equal(places[0].id, 'p0');
});
