import assert from 'node:assert/strict';
import { test } from 'node:test';

import { distanceMeters, formatDistance } from '../src/location/distance';

test('distance between two Dubai landmarks is about right', () => {
  // Burj Khalifa to The Dubai Mall: roughly 600 m.
  const d = distanceMeters({ latitude: 25.1972, longitude: 55.2744 }, { latitude: 25.1972, longitude: 55.2797 });
  assert.ok(d > 500 && d < 650, `got ${d}`);
  assert.equal(distanceMeters({ latitude: 1, longitude: 1 }, { latitude: 1, longitude: 1 }), 0);
});

test('friendly distance text', () => {
  assert.equal(formatDistance(350), '350 m');
  assert.equal(formatDistance(1234), '1.2 km');
  assert.equal(formatDistance(14200), '14 km');
});
