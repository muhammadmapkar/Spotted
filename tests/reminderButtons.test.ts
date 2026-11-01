import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { addPlace, getPlace } from '../src/db';
import { ACTION_NOT_NOW, ACTION_VISITED, handleReminderAction } from '../src/geofence/actions';
import { isSnoozed, shouldNotify } from '../src/geofence/rules';
import { makePlace, makeSettings } from './helpers';
import { freshDatabase } from './testDb';

beforeEach(async () => {
  await freshDatabase();
});

const save = () =>
  addPlace({ googlePlaceId: 'g1', name: 'Tea House', address: 'Dubai', latitude: 25, longitude: 55, category: 'food' });
const noon = new Date(2026, 9, 20, 12, 0);

test('"I\'ve been here" on a reminder marks the place as visited', async () => {
  const place = await save();
  assert.equal(await handleReminderAction(ACTION_VISITED, place.id, noon), true);
  assert.equal((await getPlace(place.id))?.visitedAt, noon.toISOString());
});

test('tapping "I\'ve been here" twice keeps the first date', async () => {
  const place = await save();
  await handleReminderAction(ACTION_VISITED, place.id, noon);
  await handleReminderAction(ACTION_VISITED, place.id, new Date(2026, 9, 21));
  assert.equal((await getPlace(place.id))?.visitedAt, noon.toISOString());
});

test('"Not now" pauses reminders for this place for 7 days', async () => {
  const place = await save();
  await handleReminderAction(ACTION_NOT_NOW, place.id, noon);
  const paused = (await getPlace(place.id))!;
  const sixDaysLater = new Date(noon.getTime() + 6 * 24 * 3600 * 1000);
  const eightDaysLater = new Date(noon.getTime() + 8 * 24 * 3600 * 1000);
  assert.equal(isSnoozed(paused, sixDaysLater), true);
  assert.equal(shouldNotify(paused, sixDaysLater, makeSettings({ quietHoursEnabled: false })), false);
  assert.equal(isSnoozed(paused, eightDaysLater), false);
  assert.equal(shouldNotify(paused, eightDaysLater, makeSettings({ quietHoursEnabled: false })), true);
});

test('other taps are not handled as buttons, and a deleted place does nothing', async () => {
  const place = await save();
  assert.equal(await handleReminderAction('expo.modules.notifications.actions.DEFAULT', place.id, noon), false);
  assert.equal(await handleReminderAction(ACTION_VISITED, 'gone', noon), true);
});

test('a broken pause date never blocks reminders', () => {
  assert.equal(isSnoozed(makePlace({ snoozedUntil: 'nonsense' }), noon), false);
});
