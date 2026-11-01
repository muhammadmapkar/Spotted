import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { addPlace, addToInbox, deleteAllData, listInbox, removeFromInbox } from '../src/db';
import { extractAllReelLinks } from '../src/share/links';
import { freshDatabase } from './testDb';

beforeEach(async () => {
  await freshDatabase();
});

test('every link is found in pasted text, tidied, without repeats', () => {
  const text = `Brunch: https://www.instagram.com/reel/AAA/?igsh=xyz
    Shoes (https://www.instagram.com/reel/BBB/).
    again https://www.instagram.com/reel/AAA/?igsh=other
    https://vm.tiktok.com/ZMabc/`;
  assert.deepEqual(extractAllReelLinks(text), [
    'https://www.instagram.com/reel/AAA/',
    'https://www.instagram.com/reel/BBB/',
    'https://vm.tiktok.com/ZMabc/',
  ]);
  assert.deepEqual(extractAllReelLinks('no links here'), []);
});

test('links wait in order, and repeats are not added twice', async () => {
  assert.equal(await addToInbox(['https://a/', 'https://b/']), 2);
  assert.equal(await addToInbox(['https://b/', 'https://c/']), 1);
  assert.deepEqual((await listInbox()).map((r) => r.url), ['https://a/', 'https://b/', 'https://c/']);
});

test('a link already saved on a place is skipped', async () => {
  await addPlace({
    googlePlaceId: 'g1', name: 'Tea', address: 'Dubai', latitude: 25, longitude: 55, category: 'food',
    reelUrl: 'https://www.instagram.com/reel/AAA/',
  });
  assert.equal(await addToInbox(['https://www.instagram.com/reel/AAA/']), 0);
});

test('a sorted link leaves the list, and delete all data empties it', async () => {
  await addToInbox(['https://a/', 'https://b/']);
  const [first] = await listInbox();
  await removeFromInbox(first.id);
  assert.deepEqual((await listInbox()).map((r) => r.url), ['https://b/']);
  await deleteAllData();
  assert.deepEqual(await listInbox(), []);
});
