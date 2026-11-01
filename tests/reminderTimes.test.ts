import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addPlace, getPlace, updatePlace } from '../src/db';
import { formatReminderTime, hasUpcomingReminder, timeChoices } from '../src/reminderTimes';
import { freshDatabase } from './testDb';

// Dates below are local time. 2026-11-04 is a Wednesday.
const wednesdayMorning = new Date(2026, 10, 4, 10, 0);

test('in the morning there are 4 choices, starting with this evening', () => {
  const choices = timeChoices(wednesdayMorning);
  assert.deepEqual(choices.map((c) => c.label), ['This evening, 7 pm', 'Tomorrow, 7 pm', 'Saturday, 11 am', 'In a week, 7 pm']);
  assert.deepEqual(choices[0].date, new Date(2026, 10, 4, 19, 0));
  assert.deepEqual(choices[1].date, new Date(2026, 10, 5, 19, 0));
  assert.deepEqual(choices[2].date, new Date(2026, 10, 7, 11, 0));
  assert.deepEqual(choices[3].date, new Date(2026, 10, 11, 19, 0));
});

test('"this evening" is left out when it is too late', () => {
  const labels = timeChoices(new Date(2026, 10, 4, 18, 45)).map((c) => c.label);
  assert.equal(labels.includes('This evening, 7 pm'), false);
});

test('on a Saturday, "Saturday" means next Saturday', () => {
  const saturday = new Date(2026, 10, 7, 9, 0);
  const choice = timeChoices(saturday).find((c) => c.label === 'Saturday, 11 am')!;
  assert.deepEqual(choice.date, new Date(2026, 10, 14, 11, 0));
});

test('every choice is in the future', () => {
  for (let hour = 0; hour < 24; hour++) {
    const now = new Date(2026, 10, 4, hour, 30);
    assert.ok(timeChoices(now).every((c) => c.date.getTime() > now.getTime()));
  }
});

test('times are shown short and clear', () => {
  assert.equal(formatReminderTime(new Date(2026, 10, 7, 11, 0)), 'Sat 7 Nov, 11:00');
});

test('only a future reminder counts as upcoming', () => {
  assert.equal(hasUpcomingReminder(undefined, wednesdayMorning), false);
  assert.equal(hasUpcomingReminder(new Date(2026, 10, 4, 9).toISOString(), wednesdayMorning), false);
  assert.equal(hasUpcomingReminder(new Date(2026, 10, 4, 19).toISOString(), wednesdayMorning), true);
  assert.equal(hasUpcomingReminder('nonsense', wednesdayMorning), false);
});

test('a timed reminder is stored on the place and can be cleared', async () => {
  await freshDatabase();
  const place = await addPlace({ googlePlaceId: 'g1', name: 'Tea', address: 'Dubai', latitude: 25, longitude: 55, category: 'food' });
  await updatePlace(place.id, { remindAt: '2026-11-07T07:00:00.000Z', remindNotificationId: 'n1' });
  assert.equal((await getPlace(place.id))?.remindNotificationId, 'n1');
  await updatePlace(place.id, { note: 'changed' }); // other edits keep it
  assert.equal((await getPlace(place.id))?.remindAt, '2026-11-07T07:00:00.000Z');
  await updatePlace(place.id, { remindAt: undefined, remindNotificationId: undefined });
  assert.equal((await getPlace(place.id))?.remindAt, undefined);
});
