import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rememberPendingShare, takePendingShare } from '../src/share/pendingShare';

test('nothing remembered gives null', () => {
  assert.equal(takePendingShare(), null);
});

test('a remembered link is given back once, then forgotten', () => {
  rememberPendingShare('https://www.instagram.com/reel/abc/');
  assert.equal(takePendingShare(), 'https://www.instagram.com/reel/abc/');
  assert.equal(takePendingShare(), null);
});

test('a newer shared link replaces the older one', () => {
  rememberPendingShare('https://www.instagram.com/reel/one/');
  rememberPendingShare('https://www.tiktok.com/@a/video/2');
  assert.equal(takePendingShare(), 'https://www.tiktok.com/@a/video/2');
});
