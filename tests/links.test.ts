import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cleanReelUrl, extractFirstUrl, reelLinkFromText } from '../src/share/links';
import { isTikTokUrl } from '../src/share/tiktok';

test('finds a link inside a message', () => {
  assert.equal(extractFirstUrl('Look at this! https://www.instagram.com/reel/ABC/?igsh=xyz'), 'https://www.instagram.com/reel/ABC/?igsh=xyz');
  assert.equal(extractFirstUrl('(see https://example.com/a).'), 'https://example.com/a');
  assert.equal(extractFirstUrl('no link here'), null);
});

test('removes the Instagram tracking code but leaves other links alone', () => {
  assert.equal(cleanReelUrl('https://www.instagram.com/reel/ABC/?igsh=xyz'), 'https://www.instagram.com/reel/ABC/');
  assert.equal(cleanReelUrl('https://www.tiktok.com/@a/video/1?lang=en'), 'https://www.tiktok.com/@a/video/1?lang=en');
});

test('reelLinkFromText finds and tidies in one step', () => {
  assert.equal(reelLinkFromText('wow https://instagram.com/reel/XYZ/?igsh=1 amazing'), 'https://instagram.com/reel/XYZ/');
  assert.equal(reelLinkFromText('nothing'), null);
});

test('recognises TikTok links', () => {
  assert.equal(isTikTokUrl('https://www.tiktok.com/@a/video/1'), true);
  assert.equal(isTikTokUrl('https://vm.tiktok.com/ZMabc/'), true);
  assert.equal(isTikTokUrl('https://www.instagram.com/reel/ABC/'), false);
  assert.equal(isTikTokUrl('https://nottiktok.com/x'), false);
});
