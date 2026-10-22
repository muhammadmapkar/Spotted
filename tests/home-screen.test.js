// The Home screen itself. The REAL screen runs, with its drawing pieces swapped for recorders,
// so we can check exactly what it asks them to show and what each tap does.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();
global.__DEV__ = true;

installFakes({}); // the phone database pieces, so the saved-places store can load
const mock = app('src/data/mock.js');
const filtersStore = app('src/state/filters.js');
const savedStore = app('src/state/saved.js');

// What the screen showed on its latest drawing.
const seen = { sheet: null, stories: [], placeCards: [], influencerCards: [], searchBar: null, chips: null, texts: [], flatLists: [] };
const calls = { push: [], alerts: [] };
const record = (key) => (props) => { seen[key].push(props); return null; };
const text = (props) => { seen.texts.push(props.children); return null; };
const palette = new Proxy({}, { get: () => '#000000' });

// both lists (the circles row and the main list) are drawn the same way
function listFake(props) {
  if (!props.horizontal) { // the main list is drawn first: start a fresh record
    seen.stories.length = 0; seen.placeCards.length = 0; seen.influencerCards.length = 0; seen.texts.length = 0; seen.chips = null;
    seen.flatLists = [props];
  }
  const items = (props.data ?? []).map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item, index) }, props.renderItem({ item, index })));
  return React.createElement(React.Fragment, null, props.ListHeaderComponent, items);
}

installFakes({
  'expo-router': { useIsFocused: () => true, useRouter: () => ({ push: (path) => calls.push.push(path) }) },
  'react-native': {
    Alert: { alert: (...args) => calls.alerts.push(args) },
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    FlatList: listFake,
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: text },
  '@/src/components/motion': { Animated: { FlatList: listFake }, useListLayout: () => 'LIST_LAYOUT' },
  '@/src/components/filters/FilterSheet': { FilterSheet: (props) => { seen.sheet = props; return null; } },
  '@/src/components/home/SavedStory': { SavedStory: record('stories') },
  '@/src/components/PlaceInfoCard': { PlaceInfoCard: record('placeCards') },
  '@/src/components/home/InfluencerCard': { InfluencerCard: record('influencerCards') },
  '@/src/components/home/LocationRow': { LocationRow: () => null },
  '@/src/components/home/HomeSearchBar': { HomeSearchBar: (props) => { seen.searchBar = props; return null; } },
  '@/src/components/home/FilterChipsRow': { FilterChipsRow: (props) => { seen.chips = props; return null; } },
  '@/src/data/mock': mock,
  '@/src/home/homeData': app('src/home/homeData.js'),
  '@/src/home/useTypingPlaceholder': app('src/home/useTypingPlaceholder.js'),
  '@/src/state/filters': filtersStore,
  '@/src/state/saved': savedStore,
});
const HomeScreen = app('app/(tabs)/index.js').default;
const ids = (list) => list.map((c) => c.place.id);

test.beforeEach(() => { filtersStore.resetFilters(); savedStore.resetSaved(); calls.push.length = 0; calls.alerts.length = 0; });

// Every screen is closed after its test, EVEN IF THE TEST FAILS. (An open screen keeps the typing timer
// running, which would stop the test program from ever finishing.)
const open = [];
async function show() {
  const real = await mount(React.createElement(HomeScreen));
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });
const type = (screen, query) => act(async () => { seen.searchBar.onChangeText(query); });

test('first look: the circles row, the search bar, and the Explore nearby feed', async () => {
  const screen = await show();
  // the circles: the 10 saved places within 15 km, nearest first, bright ring under 5 km
  assert.deepStrictEqual(seen.stories.map((s) => s.place.id), ['saffron', 'brew', 'taco', 'stack', 'luma', 'forno', 'starlight', 'kaze', 'thread', 'shawarma']);
  assert.deepStrictEqual(seen.stories.map((s) => s.ring), ['hot', 'hot', 'hot', 'hot', 'soft', 'soft', 'soft', 'soft', 'soft', 'soft']);
  assert.deepStrictEqual(seen.stories.map((s) => s.index), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'each circle pops in after the one before');
  // the headings
  for (const wanted of ['Saved places near you', 'Explore nearby', 'Every place within 15 km, Spotted Partners first']) assert.ok(seen.texts.includes(wanted), `shows "${wanted}"`);
  assert.ok(seen.texts.includes('Within 15 km') || seen.texts.some((t) => Array.isArray(t) && t.join('').includes('Within 15 km')), 'the 15 km chip');
  // the feed: partners first, then nearest first
  assert.deepStrictEqual(ids(seen.placeCards), ['saffron', 'brew', 'stack', 'glow', 'casa', 'kaze', 'dune', 'taco', 'luma', 'masala', 'forno', 'starlight', 'thread', 'shawarma', 'kiln']);
  // saved places show the red bookmark
  const savedFlags = Object.fromEntries(seen.placeCards.map((c) => [c.place.id, c.saved]));
  assert.equal(savedFlags.saffron, true);
  assert.equal(savedFlags.glow, false);
  assert.equal(savedFlags.masala, false);
  // search bar starts empty, with a typed example, and no filters on
  assert.equal(seen.searchBar.value, '');
  assert.equal(typeof seen.searchBar.typedExample, 'string');
  assert.equal(seen.searchBar.filterCount, 0);
  await screen.unmount();
});

test('typing searches ALL nearby places: partners first, then nearest', async () => {
  const screen = await show();
  await type(screen, 'indian');
  assert.deepStrictEqual(ids(seen.placeCards), ['saffron', 'masala'], 'masala is not saved but is still found');
  assert.ok(seen.texts.includes('Places · 2 results'));
  assert.equal(seen.influencerCards.length, 0);
  assert.ok(!seen.texts.includes('Explore nearby'), 'the feed is replaced by the results');
  assert.equal(seen.searchBar.value, 'indian');
  await type(screen, 'clothes');
  assert.deepStrictEqual(ids(seen.placeCards), ['luma', 'thread']);
  await type(screen, 'mexican');
  assert.deepStrictEqual(ids(seen.placeCards), ['casa', 'taco'], 'the partner is first even though it is farther');
  await type(screen, 'birria');
  assert.deepStrictEqual(ids(seen.placeCards), ['taco'], 'menu items are searched');
  await type(screen, '');
  assert.ok(seen.texts.includes('Explore nearby'), 'clearing the box brings the feed back');
  assert.equal(seen.placeCards.length, 15);
  await screen.unmount();
});

test('influencers come first in the results, found by handle', async () => {
  const screen = await show();
  await type(screen, 'capital');
  assert.deepStrictEqual(seen.influencerCards.map((c) => c.influencer.id), ['capital']);
  assert.ok(seen.texts.includes('Influencers'));
  assert.ok(seen.texts.includes('Places · 0 results'));
  assert.ok(!seen.texts.includes('Nothing nearby matches that yet. Try another word or loosen your filters.'), 'something matched, so no "nothing" message');
  // heading order: Influencers first, then Places
  assert.ok(seen.texts.indexOf('Influencers') < seen.texts.indexOf('Places · 0 results'));
  await screen.unmount();
});

test('nothing matches: a friendly message', async () => {
  const screen = await show();
  await type(screen, 'zzzzz');
  assert.equal(seen.placeCards.length, 0);
  assert.ok(seen.texts.includes('Nothing nearby matches that yet. Try another word or loosen your filters.'));
  assert.ok(seen.texts.includes('Places · 0 results'));
  await type(screen, 'sushi');
  assert.ok(seen.texts.includes('Places · 1 result'), 'singular for one result');
  await screen.unmount();
});

test('filters: the badge counts them, the chips can be removed, and the feed follows', async () => {
  const screen = await show();
  await act(async () => { filtersStore.setFilters({ dist: 5, cat: 'Food' }); });
  assert.equal(seen.searchBar.filterCount, 2);
  assert.deepStrictEqual(seen.chips.chips.map((c) => c.label), ['Within 5 km', 'Food']);
  assert.deepStrictEqual(ids(seen.placeCards), ['saffron', 'brew', 'stack', 'taco'], '4 places within 5 km');
  // removing the "Food" chip
  await act(async () => { seen.chips.onClear(seen.chips.chips.find((c) => c.label === 'Food')); });
  assert.deepStrictEqual(seen.chips.chips.map((c) => c.label), ['Within 5 km']);
  assert.equal(seen.searchBar.filterCount, 1);
  // filters apply to search results too
  await act(async () => { filtersStore.setFilters({ budget: 25 }); });
  await type(screen, 'indian');
  assert.deepStrictEqual(ids(seen.placeCards), [], 'saffron starts at AED 35 and masala is farther than 5 km');
  await screen.unmount();
});

test('saving a place changes the circles and the bookmark', async () => {
  const screen = await show();
  await act(async () => { savedStore.toggleSaved('glow'); });
  assert.ok(seen.stories.some((s) => s.place.id === 'glow'), 'a newly saved place gets a circle');
  assert.equal(seen.stories.length, 10, 'but never more than 10');
  assert.equal(seen.placeCards.find((c) => c.place.id === 'glow').saved, true);
  await act(async () => { savedStore.toggleSaved('glow'); savedStore.toggleSaved('saffron'); });
  assert.ok(!seen.stories.some((s) => s.place.id === 'saffron'));
  assert.equal(seen.placeCards.find((c) => c.place.id === 'saffron').saved, false);
  await screen.unmount();
});

test('taps: a circle or a card opens the place, an influencer opens the influencer, Menu opens the place with its menu', async () => {
  const screen = await show();
  seen.stories[0].onPress();
  seen.placeCards[3].onPress();
  assert.deepStrictEqual(calls.push, ['/venue/saffron', '/venue/glow']);
  seen.placeCards[0].onMenuPress();
  assert.equal(calls.push.at(-1), '/venue/saffron?menu=1', 'the Menu button opens the place page with the menu sheet up');
  assert.equal(calls.alerts.length, 0);
  await type(screen, 'capital');
  seen.influencerCards[0].onPress();
  assert.equal(calls.push.at(-1), '/influencer/capital');
  await screen.unmount();
});

test('the filter button opens the filter sheet, which counts nearby places for its button', async () => {
  const screen = await show();
  const presented = [];
  seen.sheet.sheetRef.current = { present: () => presented.push('present') };
  seen.searchBar.onFilterPress();
  assert.deepStrictEqual(presented, ['present']);
  assert.equal(seen.sheet.matchCount(app('src/home/homeData.js').NO_FILTERS), 15, 'all 15 nearby places');
  assert.equal(seen.sheet.matchCount({ ...app('src/home/homeData.js').NO_FILTERS, dist: 5, cat: 'Food' }), 4);
  assert.equal(seen.searchBar.onLongPress, undefined);
  await screen.unmount();
});

test('the results glide to their new places when a filter changes', async () => {
  const screen = await show();
  assert.equal(seen.flatLists[0].itemLayoutAnimation, 'LIST_LAYOUT');
  await screen.unmount();
});

