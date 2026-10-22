// The Influencer page itself. The REAL screen runs, with its drawing pieces swapped for recorders,
// so we can check what it shows and what every tap does.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const mock = app('src/data/mock.js');
const params = { id: 'capital' };
const seen = { ring: null, tiles: [], list: null, rows: [], toast: null, texts: [], pressables: [] };
const calls = { back: 0, push: [], links: [], failApp: false, failAll: false };
const palette = new Proxy({}, { get: () => '#000000' });

installFakes({
  'expo-router': {
    Stack: { Screen: () => null },
    useLocalSearchParams: () => params,
    useRouter: () => ({ back: () => { calls.back++; }, push: (path) => calls.push.push(path) }),
  },
  'react-native': {
    Linking: { openURL: async (url) => {
      calls.links.push(url);
      if (calls.failAll || (calls.failApp && url.startsWith('instagram:'))) throw new Error('cannot open');
    } },
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    ScrollView: (props) => props.children ?? null,
    Pressable: (props) => { seen.pressables.push(props); return props.children ?? null; },
    FlatList: (props) => { seen.list = props; return React.createElement(React.Fragment, null, props.data.map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item, index) }, props.renderItem({ item, index })))); },
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: (props) => { seen.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/components/icons/Icon': { Icon: () => null },
  '@/src/components/influencer/ProfileRing': { ProfileRing: (props) => { seen.ring = props; return null; } },
  '@/src/components/influencer/PlatformTile': { PlatformTile: (props) => { seen.tiles.push(props); return null; } },
  '@/src/components/influencer/TopCard': { TopCard: (props) => { seen.cards.push(props); return null; }, TOP_CARD_WIDTH: 236 },
  '@/src/components/influencer/RecommendationRow': { RecommendationRow: (props) => { seen.rows.push(props); return null; } },
  '@/src/components/place/Toast': { Toast: (props) => { seen.toast = props.message; return null; } },
  '@/src/influencer/influencerData': app('src/influencer/influencerData.js'),
});
seen.cards = [];
const Screen = app('app/influencer/[id].js').default;

test.beforeEach(() => {
  params.id = 'capital';
  Object.assign(seen, { ring: null, tiles: [], cards: [], list: null, rows: [], toast: null, texts: [], pressables: [] });
  Object.assign(calls, { back: 0, push: [], links: [], failApp: false, failAll: false });
});

const open = [];
async function show(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const real = await mount(React.createElement(Screen));
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

test('first look: handle, followers and niche, platform buttons, top 7, all recommendations', async (t) => {
  const screen = await show(t);
  assert.equal(seen.ring.influencer.id, 'capital');
  for (const wanted of ['@capital.bites', '48.2K followers · Food in Abu Dhabi', "This month's top 7", 'All recommendations']) assert.ok(seen.texts.includes(wanted), `shows "${wanted}"`);
  assert.ok(seen.texts.includes(require('../.test-build/src/influencer/influencerData.js').monthLabel()), 'the month chip');
  assert.deepStrictEqual(seen.tiles.map((x) => x.label), ['Instagram', 'TikTok']);
  assert.deepStrictEqual(seen.cards.map((c) => [c.card.rank, c.card.place.id]), [[1, 'saffron'], [2, 'stack'], [3, 'kaze'], [4, 'brew'], [5, 'taco'], [6, 'forno'], [7, 'shawarma']]);
  assert.deepStrictEqual(seen.rows.map((r) => r.row.place.id), ['saffron', 'stack', 'kaze', 'brew', 'taco', 'forno', 'shawarma', 'masala', 'kiln', 'casa']);
  assert.equal(seen.list.horizontal, true, 'the top 7 swipe sideways');
  assert.equal(seen.list.snapToInterval, 250, 'one card at a time (236 + 14 gap)');
  await screen.unmount();
});

test('a platform button opens the profile in the app, or the website when the app is missing', async (t) => {
  const screen = await show(t);
  await act(async () => { seen.tiles[0].onPress(); });
  await flush();
  assert.deepStrictEqual(calls.links, ['instagram://user?username=capital.bites']);
  calls.links.length = 0; calls.failApp = true;
  await act(async () => { seen.tiles[0].onPress(); });
  await flush();
  assert.deepStrictEqual(calls.links, ['instagram://user?username=capital.bites', 'https://www.instagram.com/capital.bites/']);
  assert.equal(seen.toast, null, 'the website worked, so no error message');
  calls.links.length = 0;
  await act(async () => { seen.tiles[1].onPress(); });
  await flush();
  assert.deepStrictEqual(calls.links, ['https://www.tiktok.com/@capital.bites']);
  await screen.unmount();
});

test('if nothing can open the profile, a friendly message appears (no crash)', async (t) => {
  calls.failAll = true;
  const screen = await show(t);
  await act(async () => { seen.tiles[0].onPress(); });
  await flush();
  assert.equal(seen.toast, "Couldn't open that link");
  await act(async () => { t.mock.timers.tick(2300); });
  assert.equal(seen.toast, null, 'and it goes away');
  await screen.unmount();
});

test('tapping a top-7 card or a recommendation opens that Place page', async (t) => {
  const screen = await show(t);
  seen.cards[2].onPress();
  seen.rows[9].onOpenPlace();
  assert.deepStrictEqual(calls.push, ['/venue/kaze', '/venue/casa']);
  await screen.unmount();
});

test('the play button opens that reel; with no link it says so', async (t) => {
  const screen = await show(t);
  await act(async () => { seen.rows[0].onOpenReel(); });
  assert.deepStrictEqual(calls.links, ['https://www.instagram.com/capital.bites/']);
  seen.rows[0].row.reelUrl = null;
  await act(async () => { seen.rows[0].onOpenReel(); });
  assert.equal(calls.links.length, 1);
  assert.equal(seen.toast, "Couldn't open that link");
  await screen.unmount();
});

test('the back button goes back', async (t) => {
  const screen = await show(t);
  seen.pressables.find((p) => p.accessibilityLabel === 'Back').onPress();
  assert.equal(calls.back, 1);
  await screen.unmount();
});

test('a TikTok-only influencer has one button and TikTok reels', async (t) => {
  params.id = 'lunchmap';
  const screen = await show(t);
  assert.deepStrictEqual(seen.tiles.map((x) => x.label), ['TikTok']);
  assert.equal(seen.rows[0].row.platform, 'tt');
  await screen.unmount();
});

test('an unknown influencer shows a message and a way back instead of crashing', async (t) => {
  params.id = 'nobody';
  const screen = await show(t);
  assert.ok(seen.texts.includes('This influencer was not found.'));
  assert.equal(seen.ring, null);
  seen.pressables.find((p) => p.accessibilityLabel === 'Back').onPress();
  assert.equal(calls.back, 1);
  await screen.unmount();
});
