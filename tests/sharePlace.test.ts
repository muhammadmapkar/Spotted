import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mapsLink, placeShareText } from '../src/sharePlace';
import { makePlace } from './helpers';

test('a real place links to Google Maps with its place id', () => {
  const link = mapsLink(makePlace({ googlePlaceId: 'ChIJabc123', name: 'Arabian Tea House' }));
  assert.equal(
    link,
    'https://www.google.com/maps/search/?api=1&query=Arabian%20Tea%20House&query_place_id=ChIJabc123'
  );
});

test('a demo place (made-up id) links by position only', () => {
  const link = mapsLink(makePlace({ googlePlaceId: 'demo-arabian-tea-house', latitude: 25.2635, longitude: 55.297 }));
  assert.equal(link, 'https://www.google.com/maps/search/?api=1&query=25.2635,55.297');
});

test('the share text has the name, note, maps link and reel link', () => {
  const text = placeShareText(
    makePlace({ googlePlaceId: 'ChIJabc123', note: 'try the karak', reelUrl: 'https://www.instagram.com/reel/abc/' })
  );
  assert.match(text, /Arabian Tea House/);
  assert.match(text, /try the karak/);
  assert.match(text, /Google Maps: https:\/\/www\.google\.com\/maps\/search\//);
  assert.match(text, /Reel: https:\/\/www\.instagram\.com\/reel\/abc\//);
});

test('lines that do not apply are left out', () => {
  const text = placeShareText(makePlace({ note: undefined, reelUrl: undefined }));
  assert.doesNotMatch(text, /Reel:/);
  assert.doesNotMatch(text, /“/);
  assert.match(text, /Google Maps:/);
});
