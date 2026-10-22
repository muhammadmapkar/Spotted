// The Map tab. The REAL screen runs with recorders for the drawing parts: which map it starts (the real
// Google map, or the drawn preview), what pins it gives them, and what a tap on a pin does.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

installFakes({});
const mock = app('src/data/mock.js');
const savedStore = app('src/state/saved.js');

const state = { os: 'android', keyInBuild: false, location: null, inset: 0 };
const seen = { real: null, sketch: null, header: null, card: null, realStarts: 0, sketchStarts: 0 };
const calls = { push: [] };
const palette = new Proxy({}, { get: () => '#000000' });

installFakes({
  'expo-router': { useRouter: () => ({ push: (path) => calls.push.push(path) }) },
  'react-native': { get Platform() { return { OS: state.os }; }, View: (props) => props.children ?? null },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 47, bottom: state.inset, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/tabBarMath': app('src/components/tabBarMath.js'),
  '@/src/config': { get GOOGLE_MAPS_KEY_IN_BUILD() { return state.keyInBuild; } },
  '@/src/location/useUserLocation': { useUserLocation: () => state.location },
  '@/src/components/map/RealMap': { RealMap: (props) => { seen.real = props; seen.realStarts++; return null; } },
  '@/src/components/map/SketchMap': { SketchMap: (props) => { seen.sketch = props; seen.sketchStarts++; return null; } },
  '@/src/components/map/MapHeader': { MapHeader: (props) => { seen.header = props; return null; } },
  '@/src/components/map/MapPlaceCard': { MapPlaceCard: (props) => { seen.card = props; return null; } },
  '@/src/data/mock': mock,
  '@/src/map/mapData': app('src/map/mapData.js'),
  '@/src/place/placeData': app('src/place/placeData.js'),
  '@/src/state/saved': savedStore,
});
const MapScreen = app('app/(tabs)/map.js').default;
const { barHeight } = app('src/components/tabBarMath.js');

test.beforeEach(() => {
  savedStore.resetSaved();
  Object.assign(state, { os: 'android', keyInBuild: false, location: null, inset: 0 });
  Object.assign(seen, { real: null, sketch: null, header: null, card: null, realStarts: 0, sketchStarts: 0 });
  calls.push.length = 0;
});
const open = [];
async function show() {
  const real = await mount(React.createElement(MapScreen));
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });
const current = () => seen.real ?? seen.sketch;

test('Android without a Google Maps key: the Google map is NEVER started; the drawn preview is shown with a note', async () => {
  const screen = await show();
  assert.equal(seen.realStarts, 0, 'ANDROID WITHOUT A KEY MUST NEVER START THE GOOGLE MAP');
  assert.ok(seen.sketchStarts >= 1);
  assert.match(seen.header.note, /Preview map/);
  await screen.unmount();
});

test('Android with a key built in: the real map, no preview note', async () => {
  state.keyInBuild = true;
  const screen = await show();
  assert.ok(seen.realStarts >= 1);
  assert.equal(seen.sketchStarts, 0);
  assert.equal(seen.header.note, undefined);
  await screen.unmount();
});

test('iPhone: the real map (Apple Maps needs no key)', async () => {
  state.os = 'ios';
  const screen = await show();
  assert.ok(seen.realStarts >= 1);
  assert.equal(seen.sketchStarts, 0);
  await screen.unmount();
});

test('the map gets the pins: saved places and unsaved partners', async () => {
  state.os = 'ios';
  const screen = await show();
  const kinds = Object.fromEntries(seen.real.pins.map((p) => [p.place.id, p.kind]));
  assert.equal(Object.keys(kinds).length, 13);
  assert.equal(kinds.saffron, 'saved');
  assert.equal(kinds.glow, 'partner');
  await act(async () => { savedStore.toggleSaved('glow'); });
  assert.equal(seen.real.pins.find((p) => p.place.id === 'glow').kind, 'saved', 'saving a place turns its pin red');
  await screen.unmount();
});

test('the map is centred on the user, or on the sample area when location is not allowed', async () => {
  state.os = 'ios';
  let screen = await show();
  assert.deepStrictEqual(seen.real.center, { latitude: 24.42, longitude: 54.58 });
  await screen.unmount();
  state.location = { latitude: 25.2, longitude: 55.27, accuracy: 10 };
  screen = await show();
  assert.deepStrictEqual(seen.real.center, { latitude: 25.2, longitude: 55.27 }, 'only latitude and longitude are passed on');
  await screen.unmount();
});

test('tapping a pin opens the card above the tab bar; Open goes to the place; tapping the map closes it', async () => {
  state.os = 'ios'; state.inset = 34;
  const screen = await show();
  assert.equal(seen.card, null, 'no card until a pin is tapped');
  await act(async () => { seen.real.onSelect('stack'); });
  assert.equal(seen.real.selectedId, 'stack');
  assert.equal(seen.card.place.id, 'stack');
  assert.equal(seen.card.bottom, barHeight(34) + 12, 'sits just above the tab bar');
  seen.card.onOpen();
  assert.deepStrictEqual(calls.push, ['/venue/stack']);
  await act(async () => { seen.real.onSelect('brew'); });
  assert.equal(seen.card.place.id, 'brew', 'another pin replaces the card');
  seen.card = null;
  await act(async () => { seen.real.onClear(); });
  assert.equal(seen.real.selectedId, null);
  assert.equal(seen.card, null);
  await screen.unmount();
});

test('the preview map behaves the same way', async () => {
  const screen = await show();
  await act(async () => { seen.sketch.onSelect('luma'); });
  assert.equal(seen.card.place.id, 'luma');
  await act(async () => { seen.sketch.onClear(); });
  assert.equal(seen.sketch.selectedId, null);
  await screen.unmount();
});

test('the floating card sits below the phone top edge', async () => {
  const screen = await show();
  assert.equal(seen.header.top, 47 + 12);
  await screen.unmount();
});
