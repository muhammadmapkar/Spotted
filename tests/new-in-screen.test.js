// The New In tab. The REAL screen runs with recorders for the drawing parts.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const mock = app('src/data/mock.js');
const newInStore = app('src/state/newIn.js');
const seen = { offers: [], influencers: [], places: [], sections: [], texts: [], lists: [], rises: [] };
const calls = { push: [] };
const palette = new Proxy({}, { get: (_t, key) => `<${String(key)}>` });
let focusRuns = 0;

installFakes({});
const savedStore = app('src/state/saved.js');
installFakes({
  'expo-router': {
    useRouter: () => ({ push: (path) => calls.push.push(path) }),
    useFocusEffect: (effect) => { React.useEffect(() => { focusRuns++; return effect(); }, [effect]); },
  },
  'react-native': {
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    ScrollView: (props) => props.children ?? null,
    FlatList: (props) => { seen.lists.push(props); return React.createElement(React.Fragment, null, (props.data ?? []).map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item, index) }, props.renderItem({ item, index })))); },
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: (props) => { seen.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/components/icons/Icon': { Icon: (props) => { seen.sections.push(props.name); return null; } },
  '@/src/components/motion': { Animated: { View: (props) => props.children ?? null }, useRiseIn: (delay) => { seen.rises.push(delay); return {}; } },
  '@/src/components/newin/OfferCard': { OfferCard: (props) => { seen.offers.push(props); return null; }, OFFER_CARD_WIDTH: 250 },
  '@/src/components/newin/NewInfluencerCircle': { NewInfluencerCircle: (props) => { seen.influencers.push(props); return null; } },
  '@/src/components/PlaceInfoCard': { PlaceInfoCard: (props) => { seen.places.push(props); return null; } },
  '@/src/data/mock': mock,
  '@/src/newin/newInData': app('src/newin/newInData.js'),
  '@/src/state/newIn': newInStore,
  '@/src/state/saved': savedStore,
});
const NewInScreen = app('app/(tabs)/new.js').default;

test.beforeEach(() => {
  Object.assign(seen, { offers: [], influencers: [], places: [], sections: [], texts: [], lists: [], rises: [] });
  calls.push.length = 0; focusRuns = 0;
  newInStore.resetNewInSeen(); savedStore.resetSaved();
});
const open = [];
async function show() {
  const real = await mount(React.createElement(NewInScreen));
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });

test('first look: the title, the three sections in order, and what is in each', async () => {
  const screen = await show();
  const order = ['New in', 'Fresh within 15 km of you', 'New offers', 'New influencers on Spotted', 'New places on Spotted'].map((t) => seen.texts.indexOf(t));
  assert.ok(order.every((i) => i >= 0), 'all headings are shown');
  assert.deepStrictEqual([...order].sort((a, b) => a - b), order, 'in this order');
  assert.deepStrictEqual(seen.offers.map((o) => o.card.place.id), ['saffron', 'stack', 'luma', 'casa']);
  assert.deepStrictEqual(seen.influencers.map((i) => i.item.influencer.id), ['weekend', 'sweet']);
  assert.deepStrictEqual(seen.places.map((p) => p.place.id), ['glow', 'casa', 'dune']);
  assert.ok(seen.places.every((p) => p.justJoined === true), 'new places carry the JUST JOINED badge');
  assert.deepStrictEqual(seen.sections.slice(0, 3), ['tag', 'star', 'home']);
  await screen.unmount();
});

test('the title and the three sections slide in one after another', async () => {
  const screen = await show();
  const delays = seen.rises.slice(0, 4);
  assert.deepStrictEqual(delays, [0, 150, 300, 450]);
  await screen.unmount();
});

test('offer cards swipe sideways, one card at a time', async () => {
  const screen = await show();
  const list = seen.lists[0];
  assert.equal(list.horizontal, true);
  assert.equal(list.snapToInterval, 264);
  await screen.unmount();
});

test('tapping an offer opens the Place page with the Offers dropdown open', async () => {
  const screen = await show();
  seen.offers[1].onPress();
  assert.deepStrictEqual(calls.push, ['/venue/stack?offers=1']);
  await screen.unmount();
});

test('tapping a new influencer opens their page; tapping a new place opens the place (Menu with the menu up)', async () => {
  const screen = await show();
  seen.influencers[0].onPress();
  seen.places[0].onPress();
  seen.places[1].onMenuPress();
  assert.deepStrictEqual(calls.push, ['/influencer/weekend', '/venue/glow', '/venue/casa?menu=1']);
  await screen.unmount();
});

test('new places show the red bookmark only for saved ones', async () => {
  const screen = await show();
  assert.deepStrictEqual(seen.places.map((p) => p.saved), [false, false, false]);
  await act(async () => { savedStore.toggleSaved('casa'); });
  assert.equal([...seen.places].reverse().find((p) => p.place.id === 'casa').saved, true);
  await screen.unmount();
});

test('opening the tab clears the red dot on the tab icon', async () => {
  assert.equal(newInStore.hasSeenNewIn(), false);
  const screen = await show();
  assert.equal(newInStore.hasSeenNewIn(), true);
  await screen.unmount();
});
