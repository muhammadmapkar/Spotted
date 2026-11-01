import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pickPlacesToTry } from '../src/planner';
import { makePlace } from './helpers';

const fixed = () => 0; // a "random" that always gives the same answer

test('visited places are never suggested', () => {
  const places = [makePlace({ id: 'a', visitedAt: '2026-10-01' }), makePlace({ id: 'b' })];
  assert.deepEqual(pickPlacesToTry(places, null, 3, fixed).map((p) => p.id), ['b']);
});

test('it mixes categories when it can', () => {
  const places = [
    makePlace({ id: 'f1', category: 'food' }),
    makePlace({ id: 'f2', category: 'food' }),
    makePlace({ id: 'f3', category: 'food' }),
    makePlace({ id: 's1', category: 'shopping' }),
    makePlace({ id: 'u1', category: 'fun' }),
  ];
  const categories = pickPlacesToTry(places, null, 3, fixed).map((p) => p.category).sort();
  assert.deepEqual(categories, ['food', 'fun', 'shopping']);
});

test('with a position it picks from close places and lists the closest first', () => {
  const here = { latitude: 25.2, longitude: 55.27 };
  const close = Array.from({ length: 10 }, (_, i) =>
    makePlace({ id: `c${i}`, latitude: 25.2 + i * 0.001, longitude: 55.27 })
  );
  const far = makePlace({ id: 'far', latitude: 24.4, longitude: 54.4 }); // Abu Dhabi
  const picks = pickPlacesToTry([far, ...close], here, 3, Math.random);
  assert.equal(picks.length, 3);
  assert.ok(picks.every((p) => p.id !== 'far'));
  const ids = picks.map((p) => Number(p.id.slice(1)));
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
});

test('fewer places than asked gives all of them, and none gives an empty list', () => {
  assert.equal(pickPlacesToTry([makePlace({ id: 'a' })], null, 3, fixed).length, 1);
  assert.deepEqual(pickPlacesToTry([], null), []);
});
