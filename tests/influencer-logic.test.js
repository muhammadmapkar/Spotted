// The rules behind the Influencer page: platform buttons and profile links (with the website as a
// fallback), "This month's top 7", "All recommendations", and the month chip.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');
const mock = app('src/data/mock.js');
const rules = app('src/influencer/influencerData.js');
const find = (id) => rules.findInfluencer(id);

test('an influencer is found by id; an unknown id finds nothing', () => {
  assert.equal(find('capital').handle, 'capital.bites');
  assert.equal(find('nobody'), undefined);
  assert.equal(find(undefined), undefined);
});

test('the month chip names the month in English', () => {
  assert.equal(rules.monthLabel(new Date(2026, 9, 22)), 'October');
  assert.equal(rules.monthLabel(new Date(2026, 0, 1)), 'January');
  assert.equal(rules.monthLabel(new Date(2026, 11, 31)), 'December');
});

test('the line under the handle: followers and niche', () => {
  assert.equal(rules.followersLine(find('capital')), '48.2K followers · Food in Abu Dhabi');
});

test('platform buttons: one per platform, in order, popping in 120 ms apart', () => {
  const buttons = rules.platformButtons(find('spice'));
  assert.deepStrictEqual(buttons.map((b) => b.platform), ['ig', 'tt', 'yt']);
  assert.deepStrictEqual(buttons.map((b) => b.label), ['Instagram', 'TikTok', 'YouTube']);
  assert.deepStrictEqual(buttons.map((b) => b.delay), [300, 420, 540]);
  assert.equal(rules.platformButtons(find('lunchmap')).length, 1);
});

test('profile links: Instagram has an app link; all have a website link', () => {
  assert.deepStrictEqual(rules.profileLinks('capital.bites', 'ig'), { app: 'instagram://user?username=capital.bites', web: 'https://www.instagram.com/capital.bites/' });
  assert.deepStrictEqual(rules.profileLinks('capital.bites', 'tt'), { app: null, web: 'https://www.tiktok.com/@capital.bites' });
  assert.deepStrictEqual(rules.profileLinks('capital.bites', 'yt'), { app: null, web: 'https://www.youtube.com/@capital.bites' });
  assert.equal(rules.profileLinks('odd name&x', 'ig').app, 'instagram://user?username=odd%20name%26x');
});

test('opening a profile: the app first, the website if the app is missing', async () => {
  const links = rules.profileLinks('capital.bites', 'ig');
  const opened = [];
  assert.equal(await rules.openWithFallback(links, async (url) => { opened.push(url); }), 'app');
  assert.deepStrictEqual(opened, [links.app]);

  opened.length = 0;
  const noApp = async (url) => { opened.push(url); if (url.startsWith('instagram:')) throw new Error('no app'); };
  assert.equal(await rules.openWithFallback(links, noApp), 'web');
  assert.deepStrictEqual(opened, [links.app, links.web], 'tried the app, then the website');
});

test('opening a profile: platforms without an app link go straight to the website; nothing works means "failed"', async () => {
  const links = rules.profileLinks('thelunchmap', 'tt');
  const opened = [];
  assert.equal(await rules.openWithFallback(links, async (url) => { opened.push(url); }), 'web');
  assert.deepStrictEqual(opened, ['https://www.tiktok.com/@thelunchmap']);
  assert.equal(await rules.openWithFallback(links, async () => { throw new Error('nothing can open it'); }), 'failed');
  assert.equal(await rules.openWithFallback(rules.profileLinks('x', 'ig'), async () => { throw new Error('no'); }), 'failed');
});

test('top 7: the first seven picks, best first, numbered 1 to 7, fanning in 110 ms apart', () => {
  const cards = rules.topSeven(find('capital'));
  assert.deepStrictEqual(cards.map((c) => c.place.id), ['saffron', 'stack', 'kaze', 'brew', 'taco', 'forno', 'shawarma']);
  assert.deepStrictEqual(cards.map((c) => c.rank), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepStrictEqual(cards.map((c) => c.delay), [200, 310, 420, 530, 640, 750, 860]);
  for (const card of cards) {
    assert.ok(card.items.length >= 1 && card.items.length <= 2, 'one or two items');
    for (const item of card.items) assert.ok(card.place.menu.some((m) => m.name === item.name && m.price === item.price), `${item.name} is on the menu at its menu price`);
  }
  // the 'more' places are not in the top 7
  assert.ok(!cards.some((c) => ['masala', 'kiln', 'casa'].includes(c.place.id)));
});

test('top 7: never more than seven, and a missing place is skipped without a gap in the numbers', () => {
  const big = { ...find('capital'), picks: ['saffron', 'brew', 'taco', 'stack', 'luma', 'forno', 'starlight', 'kaze', 'thread'] };
  assert.equal(rules.topSeven(big).length, 7);
  const gap = { ...find('capital'), picks: ['saffron', 'no-such-place', 'brew'] };
  assert.deepStrictEqual(rules.topSeven(gap).map((c) => [c.place.id, c.rank]), [['saffron', 1], ['brew', 2]]);
});

test('all recommendations: picks first, then the others, each with a reel link', () => {
  const rows = rules.allRecommendations(find('capital'));
  assert.deepStrictEqual(rows.map((r) => r.place.id), ['saffron', 'stack', 'kaze', 'brew', 'taco', 'forno', 'shawarma', 'masala', 'kiln', 'casa']);
  assert.deepStrictEqual(rows.map((r) => r.delay), [0, 50, 100, 150, 200, 250, 300, 350, 400, 450]);
  assert.ok(rows.every((r) => r.platform === 'ig' && r.reelUrl === 'https://www.instagram.com/capital.bites/'));
  const tiktok = rules.allRecommendations(find('lunchmap'));
  assert.ok(tiktok.every((r) => r.platform === 'tt' && r.reelUrl === 'https://www.tiktok.com/@thelunchmap'));
});

test('all recommendations: an exact reel link is used for that place only; duplicates and missing places are dropped', () => {
  const influencer = { ...find('capital'), picks: ['saffron', 'saffron', 'nope'], more: ['brew', 'saffron'], reels: { brew: 'https://www.instagram.com/reel/XYZ/' } };
  const rows = rules.allRecommendations(influencer);
  assert.deepStrictEqual(rows.map((r) => r.place.id), ['saffron', 'brew']);
  assert.equal(rows[0].reelUrl, 'https://www.instagram.com/capital.bites/');
  assert.equal(rows[1].reelUrl, 'https://www.instagram.com/reel/XYZ/');
  const unsafe = rules.allRecommendations({ ...influencer, reels: { saffron: 'javascript:alert(1)' } });
  assert.equal(unsafe[0].reelUrl, 'https://www.instagram.com/capital.bites/', 'an unsafe link is replaced');
});

test('every sample influencer has a full page of data', () => {
  for (const influencer of mock.INFLUENCERS) {
    assert.ok(rules.topSeven(influencer).length >= 1, influencer.id);
    assert.equal(rules.allRecommendations(influencer).length, influencer.picks.length + influencer.more.length, influencer.id);
    assert.ok(rules.platformButtons(influencer).length >= 1, influencer.id);
  }
});

test('a place with no menu items still shows up, with no items (no crash)', () => {
  const real = mock.PLACES.find((p) => p.id === 'taco');
  const original = real.menu;
  real.menu = [];
  try {
    const card = rules.topSeven(find('capital')).find((c) => c.place.id === 'taco');
    assert.deepStrictEqual(card.items, []);
    const recs = app('src/place/placeData.js').recommendationsFor(real);
    assert.ok(recs.length > 0 && recs.every((r) => r.items.length === 0));
  } finally {
    real.menu = original;
  }
});
