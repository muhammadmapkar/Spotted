import assert from 'node:assert/strict';
import { test } from 'node:test';

import { categoryFromTypes } from '../src/places/categoryFromTypes';
import { extractPlaceClues } from '../src/places/clues';

test('reads a 📍 line first', () => {
  const clues = extractPlaceClues('Best breakfast ever 😍\n📍 Arabian Tea House, Al Fahidi\n#dubaifood #brunch');
  assert.equal(clues[0].kind, 'pin');
  assert.match(clues[0].text, /^Arabian Tea House/);
  assert.ok(!clues[0].text.includes('#'));
});

test('reads "at <Place>" and adds the area', () => {
  const clues = extractPlaceClues('Dinner at Zuma Dubai in DIFC was unreal');
  assert.equal(clues[0].kind, 'at');
  assert.equal(clues[0].text, 'Zuma Dubai DIFC');
});

test('turns @tags into words', () => {
  const clues = extractPlaceClues('Follow @arabian_tea.house for more');
  assert.equal(clues[0].kind, 'tag');
  assert.equal(clues[0].text, 'arabian tea house');
});

test('ignores links, hashtags and things that are not places', () => {
  assert.deepEqual(extractPlaceClues('so good omg #foodie https://example.com'), []);
  assert.deepEqual(extractPlaceClues('Waiting at Home all day'), []);
  assert.deepEqual(extractPlaceClues(''), []);
});

test('puts the pin first, removes duplicates and keeps at most 4', () => {
  const caption = [
    '📍 Bu Qtair',
    'Go to Bu Qtair, then at Kite Beach, at La Mer, at City Walk, at Alserkal Avenue',
    '@bu_qtair',
  ].join('\n');
  const clues = extractPlaceClues(caption);
  assert.ok(clues.length <= 4);
  assert.equal(clues[0].kind, 'pin');
  const texts = clues.map((c) => c.text.toLowerCase());
  assert.equal(new Set(texts).size, texts.length);
});

test('maps Google place types to our categories', () => {
  assert.equal(categoryFromTypes(['cafe', 'food', 'establishment']), 'food');
  assert.equal(categoryFromTypes(['shopping_mall']), 'shopping');
  assert.equal(categoryFromTypes(['tourist_attraction']), 'fun');
  assert.equal(categoryFromTypes(['establishment']), undefined);
  assert.equal(categoryFromTypes(undefined), undefined);
});
