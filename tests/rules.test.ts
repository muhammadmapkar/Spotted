import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isQuietTime,
  nearestPlaces,
  notifiedRecently,
  remindablePlaces,
  remindersInLast24h,
  shouldNotify,
} from '../src/geofence/rules';
import { makePlace, makeSettings } from './helpers';

// Local-time helper: month is 1-12.
const at = (hour: number, minute = 0) => new Date(2026, 9, 19, hour, minute);

test('quiet hours work across midnight', () => {
  const settings = makeSettings({ quietStart: '22:00', quietEnd: '08:00' });
  assert.equal(isQuietTime(at(23, 30), settings), true);
  assert.equal(isQuietTime(at(3), settings), true);
  assert.equal(isQuietTime(at(8), settings), false); // the end time itself is not quiet
  assert.equal(isQuietTime(at(14), settings), false);
});

test('quiet hours work inside one day and can be turned off', () => {
  assert.equal(isQuietTime(at(14), makeSettings({ quietStart: '13:00', quietEnd: '15:00' })), true);
  assert.equal(isQuietTime(at(23), makeSettings({ quietHoursEnabled: false })), false);
});

test('a place that notified less than 24 hours ago counts as recent', () => {
  const now = at(12);
  const place = makePlace({ lastNotifiedAt: new Date(now.getTime() - 23 * 3600 * 1000).toISOString() });
  assert.equal(notifiedRecently(place, now), true);
  const old = makePlace({ lastNotifiedAt: new Date(now.getTime() - 25 * 3600 * 1000).toISOString() });
  assert.equal(notifiedRecently(old, now), false);
  assert.equal(notifiedRecently(makePlace(), now), false);
});

test('shouldNotify says yes in the normal case', () => {
  assert.equal(shouldNotify(makePlace(), at(12), makeSettings()), true);
});

test('shouldNotify says no when reminders are off, quiet, muted or visited', () => {
  const now = at(12);
  assert.equal(shouldNotify(makePlace(), now, makeSettings({ remindersEnabled: false })), false);
  assert.equal(shouldNotify(makePlace(), at(23), makeSettings()), false);
  assert.equal(shouldNotify(makePlace({ muted: true }), now, makeSettings()), false);
  assert.equal(shouldNotify(makePlace({ visitedAt: '2026-10-01T00:00:00.000Z' }), now, makeSettings()), false);
});

test('the daily limit stops extra reminders', () => {
  const now = at(12);
  const recent = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
  const all = [
    makePlace({ id: 'a', lastNotifiedAt: recent }),
    makePlace({ id: 'b', lastNotifiedAt: recent }),
    makePlace({ id: 'c' }),
  ];
  assert.equal(remindersInLast24h(all, now), 2);
  assert.equal(shouldNotify(all[2], now, makeSettings({ maxRemindersPerDay: 2 }), all), false);
  assert.equal(shouldNotify(all[2], now, makeSettings({ maxRemindersPerDay: 3 }), all), true);
  assert.equal(shouldNotify(all[2], now, makeSettings({ maxRemindersPerDay: 0 }), all), true); // 0 = no limit
});

test('muted and visited places are not watched', () => {
  const places = [makePlace({ id: 'a' }), makePlace({ id: 'b', muted: true }), makePlace({ id: 'c', visitedAt: '2026-10-01' })];
  assert.deepEqual(remindablePlaces(places).map((p) => p.id), ['a']);
});

test('the 20 nearest places are watched', () => {
  const places = Array.from({ length: 30 }, (_, i) =>
    makePlace({ id: `p${i}`, latitude: 25 + i * 0.01, longitude: 55 })
  );
  const nearest = nearestPlaces(places, { latitude: 25, longitude: 55 });
  assert.equal(nearest.length, 20);
  assert.equal(nearest[0].id, 'p0');
  assert.equal(nearest[19].id, 'p19');
  // Without a position we fall back to the first (newest) 20.
  assert.equal(nearestPlaces(places, null).length, 20);
});

test('a saved Spotted place (no muted / visited / pause info) still follows the 24 h rule and the daily limit', () => {
  const settings = makeSettings({ quietHoursEnabled: false, maxRemindersPerDay: 1 });
  const now = at(14);
  assert.equal(shouldNotify({}, now, settings), true);
  assert.equal(shouldNotify({ lastNotifiedAt: at(10).toISOString() }, now, settings), false);
  // One reminder already sent today for a place saved from a reel: the daily limit of 1 is reached.
  const sentToday = [makePlace({ lastNotifiedAt: at(9).toISOString() })];
  assert.equal(shouldNotify({}, now, settings, sentToday), false);
});
