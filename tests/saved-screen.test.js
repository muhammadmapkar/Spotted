// The Saved tab itself. The REAL screen runs, with its drawing pieces swapped for recorders,
// so we can check what it shows (folders, results) and what every tap does.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();
global.__DEV__ = true;

installFakes({}); // the phone database pieces, so the saved-places store can load
const mock = app('src/data/mock.js');
const filtersStore = app('src/state/filters.js');
const savedStore = app('src/state/saved.js');

const seen = { tiles: [], cards: [], searchBar: null, chips: null, sheet: null, texts: [], list: null, pressables: [], focusCleanup: null, back: [] };
const calls = { push: [] };
const palette = new Proxy({}, { get: () => '#000000' });

function listFake(props) {
  Object.assign(seen, { tiles: [], cards: [], texts: [], chips: null, list: props, pressables: [] });
  const items = (props.data ?? []).map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item, index) }, props.renderItem({ item, index })));
  return React.createElement(React.Fragment, null, props.ListHeaderComponent, items);
}

installFakes({
  'expo-router': {
    useRouter: () => ({ push: (path) => calls.push.push(path) }),
    useFocusEffect: (effect) => { React.useEffect(() => { seen.focusCleanup = effect(); return seen.focusCleanup; }, [effect]); },
  },
  'react-native': {
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    Pressable: (props) => { seen.pressables.push(props); return props.children ?? null; },
    BackHandler: { addEventListener: (_name, handler) => { const entry = { handler, removed: false }; seen.back.push(entry); return { remove: () => { entry.removed = true; } }; } },
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: (props) => { seen.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/components/icons/Icon': { Icon: () => null },
  '@/src/components/motion': { Animated: { FlatList: listFake }, useListLayout: () => 'LIST_LAYOUT' },
  '@/src/components/filters/FilterSheet': { FilterSheet: (props) => { seen.sheet = props; return null; } },
  '@/src/components/home/HomeSearchBar': { HomeSearchBar: (props) => { seen.searchBar = props; return null; } },
  '@/src/components/home/FilterChipsRow': { FilterChipsRow: (props) => { seen.chips = props; return null; } },
  '@/src/components/PlaceInfoCard': { PlaceInfoCard: (props) => { seen.cards.push(props); return null; } },
  '@/src/components/saved/FolderTile': { FolderTile: (props) => { seen.tiles.push(props); return null; } },
  '@/src/data/mock': mock,
  '@/src/home/homeData': app('src/home/homeData.js'),
  '@/src/saved/savedData': app('src/saved/savedData.js'),
  '@/src/state/filters': filtersStore,
  '@/src/state/saved': savedStore,
});
const SavedScreen = app('app/(tabs)/saved.js').default;
const ids = () => seen.cards.map((c) => c.place.id);

test.beforeEach(() => { filtersStore.resetFilters(); savedStore.resetSaved(); calls.push.length = 0; seen.back.length = 0; });

const open = [];
async function show() {
  const real = await mount(React.createElement(SavedScreen));
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });
const type = (query) => act(async () => { seen.searchBar.onChangeText(query); });
const openFolder = (name) => act(async () => { seen.tiles.find((t) => t.tile.name === name).onPress(); });

test('first look: title, how many places, search bar, and four folder tiles', async () => {
  const screen = await show();
  assert.ok(seen.texts.includes('Saved'));
  assert.ok(seen.texts.includes("10 places you've spotted"));
  assert.equal(seen.searchBar.placeholder, 'Search your saved places…');
  assert.equal(seen.searchBar.accessibilityLabel, 'Search your saved places');
  assert.equal(seen.searchBar.typedExample, undefined, 'a plain placeholder, no typing animation');
  assert.equal(seen.searchBar.filterCount, 0);
  assert.deepStrictEqual(seen.tiles.map((t) => [t.tile.name, t.tile.count]), [['All saved', 10], ['Food', 7], ['Shopping', 2], ['Fun', 1]]);
  assert.equal(seen.cards.length, 0, 'no place cards until a folder is open or something is typed');
  assert.equal(seen.list.itemLayoutAnimation, 'LIST_LAYOUT');
  await screen.unmount();
});

test('opening a folder shows its places with a back arrow and the folder name', async () => {
  const screen = await show();
  await openFolder('Shopping');
  assert.deepStrictEqual(ids(), ['luma', 'thread']);
  assert.equal(seen.tiles.length, 0, 'the folder tiles are hidden');
  assert.ok(seen.texts.includes('Shopping') && seen.texts.includes('2 places'));
  assert.ok(seen.cards.every((c) => c.saved === true));
  const back = seen.pressables.find((p) => p.accessibilityLabel === 'Back to folders');
  await act(async () => { back.onPress(); });
  assert.equal(seen.tiles.length, 4, 'back to the folders');
  assert.equal(seen.cards.length, 0);
  await openFolder('All saved');
  assert.equal(seen.cards.length, 10);
  assert.ok(seen.texts.includes('All saved'));
  await screen.unmount();
});

test('the phone back button closes an open folder first', async () => {
  const screen = await show();
  assert.equal(seen.back.filter((b) => !b.removed).length, 0, 'nothing to close yet, so the phone back button is left alone');
  await openFolder('Food');
  const entry = seen.back.filter((b) => !b.removed).at(-1);
  let handled;
  await act(async () => { handled = entry.handler(); });
  assert.equal(handled, true);
  assert.equal(seen.tiles.length, 4);
  assert.ok(seen.back.every((b) => b.removed), 'and the listener is removed again');
  await screen.unmount();
});

test('leaving the tab closes the open folder', async () => {
  const screen = await show();
  await openFolder('Fun');
  assert.deepStrictEqual(ids(), ['starlight']);
  await act(async () => { seen.focusCleanup(); });
  assert.equal(seen.tiles.length, 4);
  await screen.unmount();
});

test('typing searches ONLY saved places: "shopping" shows the two saved shops', async () => {
  const screen = await show();
  await type('shopping');
  assert.deepStrictEqual(ids(), ['luma', 'thread']);
  assert.ok(seen.texts.includes('Results'));
  assert.ok(seen.texts.includes('2 places'));
  await type('indian');
  assert.deepStrictEqual(ids(), ['saffron'], 'the unsaved Masala Junction is not listed');
  await type('zzzz');
  assert.ok(seen.texts.includes('No saved places match. Try another word or clear a filter.'));
  await type('');
  assert.equal(seen.tiles.length, 4, 'clearing the box brings the folders back');
  await screen.unmount();
});

test('filters: the badge, removable chips, and the list follow the shared filter state', async () => {
  const screen = await show();
  await act(async () => { filtersStore.setFilters({ dist: 5, cat: 'Food' }); });
  assert.equal(seen.searchBar.filterCount, 2);
  assert.deepStrictEqual(seen.chips.chips.map((c) => c.label), ['Within 5 km', 'Food']);
  assert.deepStrictEqual(ids(), ['saffron', 'brew', 'taco', 'stack'], 'a filter switches from folders to results');
  await act(async () => { seen.chips.onClear(seen.chips.chips[1]); });
  assert.deepStrictEqual(seen.chips.chips.map((c) => c.label), ['Within 5 km']);
  await act(async () => { filtersStore.resetFilters(); });
  assert.equal(seen.tiles.length, 4);
  await screen.unmount();
});

test('the filter button opens the same sheet, counting saved places', async () => {
  const screen = await show();
  const presented = [];
  seen.sheet.sheetRef.current = { present: () => presented.push(1) };
  seen.searchBar.onFilterPress();
  assert.equal(presented.length, 1);
  const none = app('src/home/homeData.js').NO_FILTERS;
  assert.equal(seen.sheet.matchCount(none), 10);
  assert.equal(seen.sheet.matchCount({ ...none, dist: 5 }), 4);
  await screen.unmount();
});

test('saving elsewhere changes the folders at once; an empty list says so', async () => {
  const screen = await show();
  await act(async () => { savedStore.toggleSaved('glow'); });
  assert.ok(seen.texts.includes("11 places you've spotted"));
  assert.deepStrictEqual(seen.tiles.map((t) => t.tile.count), [11, 7, 2, 2]);
  await act(async () => { for (const id of [...savedStore.getSavedIds()]) savedStore.toggleSaved(id); });
  assert.ok(seen.texts.includes("0 places you've spotted"));
  await type('x');
  assert.ok(seen.texts.includes('Nothing saved yet. Tap the bookmark on a place to keep it here.'));
  await screen.unmount();
});

test('taps: a card opens its place (Menu opens it with the menu up); the reels link opens the old list', async () => {
  const screen = await show();
  await openFolder('All saved');
  seen.cards[0].onPress();
  seen.cards[1].onMenuPress();
  assert.deepStrictEqual(calls.push, ['/venue/saffron', '/venue/brew?menu=1']);
  await act(async () => { seen.pressables.find((p) => p.accessibilityLabel === 'Back to folders').onPress(); });
  seen.pressables.find((p) => typeof p.onPress === 'function' && !p.accessibilityLabel).onPress();
  assert.equal(calls.push.at(-1), '/reel-places');
  await screen.unmount();
});
