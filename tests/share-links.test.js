// Finding and tidying a reel link inside shared or pasted text.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');
const { reelLinkFromText, extractFirstUrl, cleanReelUrl } = app('src/share/links.js');

test('removes Instagram tracking codes', () => {
  assert.equal(reelLinkFromText('https://www.instagram.com/reel/C9abc123/?igsh=MWx4ZHN0'), 'https://www.instagram.com/reel/C9abc123/');
  assert.equal(reelLinkFromText('https://instagr.am/p/ABC/?igsh=1#top'), 'https://instagr.am/p/ABC/');
});

test('finds the link inside a whole message', () => {
  assert.equal(
    reelLinkFromText('Look at this place! https://www.instagram.com/reel/XYZ/?utm_source=ig_web_copy_link#top thanks'),
    'https://www.instagram.com/reel/XYZ/'
  );
  assert.equal(extractFirstUrl('(https://example.com/page).'), 'https://example.com/page', 'drops punctuation stuck to the end');
});

test('other sites are kept as they are', () => {
  assert.equal(cleanReelUrl('https://www.tiktok.com/@a/video/1?lang=en'), 'https://www.tiktok.com/@a/video/1?lang=en');
});

test('no usable link gives null', () => {
  assert.equal(reelLinkFromText('no link here'), null);
  assert.equal(reelLinkFromText(''), null);
  assert.equal(reelLinkFromText('www.instagram.com/reel/x'), null, 'a link needs http(s)');
});
