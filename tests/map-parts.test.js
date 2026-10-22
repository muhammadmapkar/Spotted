// The pieces of the Map tab, run for real with recorders for the drawing parts.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const mock = app('src/data/mock.js');
const rules = app('src/map/mapData.js');
const rec = { reduce: false, shared: [], delays: [], repeats: [], animatedViews: [], views: [], texts: [], svgPaths: [], circles: [], pressables: [], mapView: null, markers: [], mapCircle: null, animateTo: [], gradients: [], layouts: [], scheme: 'light' };
const palette = new Proxy({}, { get: (_t, key) => `<${String(key)}>` });
const passChildren = (props) => props.children ?? null;

installFakes({
  'react-native': {
    StyleSheet: { create: (x) => x, absoluteFill: { position: 'absolute' } },
    View: (props) => { rec.views.push(props); return props.children ?? null; },
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
  },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: (props) => { rec.animatedViews.push(JSON.stringify(props.style)); return props.children ?? null; } },
    Easing: { bezier: () => (t) => t, out: () => (t) => t, ease: 1 },
    useReducedMotion: () => rec.reduce,
    useSharedValue: (initial) => {
      const ref = require('react').useRef(null);
      if (!ref.current) {
        ref.current = { _v: initial, animation: null, get value() { return this._v; }, set value(next) { if (next && next.__a) this.animation = next; else this._v = next; } };
        rec.shared.push(ref.current);
      }
      return ref.current;
    },
    useAnimatedStyle: (fn) => fn(),
    withTiming: (to, config) => ({ __a: true, to, duration: config?.duration }),
    withDelay: (delay, animation) => { rec.delays.push(delay); return { ...animation, delay }; },
    withRepeat: (animation, times) => { rec.repeats.push(times); return { ...animation, times }; },
  },
  'react-native-svg': {
    __esModule: true,
    default: (props) => props.children ?? null,
    Svg: (props) => props.children ?? null,
    Circle: (props) => { rec.circles.push(props); return null; },
    Defs: passChildren, LinearGradient: passChildren, Stop: () => null,
    Path: (props) => { rec.svgPaths.push(props); return null; },
    Rect: () => null,
  },
  'react-native-maps': {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      rec.mapView = props;
      React.useImperativeHandle(ref, () => ({ animateToRegion: (region, ms) => rec.animateTo.push([region, ms]) }));
      return props.children;
    }),
    Marker: (props) => { rec.markers.push(props); return props.children ?? null; },
    Circle: (props) => { rec.mapCircle = props; return null; },
  },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: rec.scheme }) },
  '@/src/theme/shadows': { MONO_SHADOW: {}, cardShadow: () => 'shadow' },
  '@/src/components/ui/ui': { AppText: (props) => { rec.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/components/PlaceLogo': { PlaceLogo: (props) => { rec.logo = props.place.id; return null; } },
  '@/src/data/mock': mock,
  '@/src/map/mapData': rules,
  '@/src/map/mapStyle': app('src/map/mapStyle.js'),
  '@/constants/Theme': app('constants/Theme.js'),
  '@/src/theme/fonts': { POPPINS: {} },
});
installFakes({ '@/src/components/motion': app('src/components/motion.js') });
installFakes({ '@/src/components/map/PinShape': app('src/components/map/PinShape.js'), '@/src/components/map/UserDot': app('src/components/map/UserDot.js') });
const { PinShape } = app('src/components/map/PinShape.js');
const { UserDot } = app('src/components/map/UserDot.js');
const { MapHeader } = app('src/components/map/MapHeader.js');
const { MapPlaceCard } = app('src/components/map/MapPlaceCard.js');
const { RealMap } = app('src/components/map/RealMap.js');
const { SketchMap } = app('src/components/map/SketchMap.js');

test.beforeEach(() => Object.assign(rec, { reduce: false, shared: [], delays: [], repeats: [], animatedViews: [], views: [], texts: [], svgPaths: [], circles: [], pressables: [], mapView: null, markers: [], mapCircle: null, animateTo: [], gradients: [], layouts: [], scheme: 'light' }));
const lines = () => rec.texts;
const pins = () => rules.mapPins(new Set(mock.PLACES.filter((p) => p.saved).map((p) => p.id)));
const center = { latitude: 25.2, longitude: 55.27 };

// ---- pins and the blue dot -------------------------------------------------------------------

test('a saved pin is the red bookmark; a partner pin is the purple teardrop', async () => {
  let screen = await mount(React.createElement(PinShape, { kind: 'saved', selected: false, delay: 0 }));
  assert.ok(rec.svgPaths.some((p) => p.d === 'M0 0H22V30L11 23.4 0 30Z'), 'bookmark shape');
  assert.ok(!rec.svgPaths.some((p) => p.fill === '#7B2CD6'));
  await screen.unmount();
  rec.svgPaths = [];
  screen = await mount(React.createElement(PinShape, { kind: 'partner', selected: false, delay: 0 }));
  assert.ok(rec.svgPaths.some((p) => p.fill === '#7B2CD6'), 'purple');
  assert.ok(!rec.svgPaths.some((p) => p.d === 'M0 0H22V30L11 23.4 0 30Z'));
  await screen.unmount();
});

test('a pin drops in at its own moment, and a selected pin is 30% bigger with its tip kept in place', async () => {
  let screen = await mount(React.createElement(PinShape, { kind: 'saved', selected: false, delay: 340 }));
  assert.deepStrictEqual(rec.delays, [340]);
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration], [1, 500]);
  assert.ok(rec.animatedViews.some((v) => v.includes('"translateY":-30') && v.includes('"scale":0.2') && v.includes('"opacity":0')), 'starts small, invisible and 30 px above its spot');
  const normal = rec.views.map((v) => JSON.stringify(v.style)).find((s) => s && s.includes('"scale"'));
  assert.ok(normal.includes('"scale":1') && normal.includes('"translateY":0'));
  await screen.unmount();
  rec.views = [];
  screen = await mount(React.createElement(PinShape, { kind: 'saved', selected: true, delay: 0 }));
  const big = rec.views.map((v) => JSON.stringify(v.style)).find((s) => s && s.includes('"scale"'));
  assert.ok(big.includes('"scale":1.3'), 'bigger');
  assert.ok(big.includes('"translateY":7.2'), 'pushed down by half the growth (48 x 0.3 / 2), so the tip stays on the spot');
  await screen.unmount();
});

test('with Reduce Motion pins are simply there', async () => {
  rec.reduce = true;
  const screen = await mount(React.createElement(PinShape, { kind: 'partner', selected: false, delay: 500 }));
  assert.deepStrictEqual(rec.delays, []);
  assert.equal(rec.shared[0]._v, 1);
  await screen.unmount();
});

test('the blue dot has a ring that pulses for ever (not with Reduce Motion)', async () => {
  let screen = await mount(React.createElement(UserDot));
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration, rec.shared[0].animation.times], [1, 1800, -1]);
  assert.ok(rec.views.some((v) => JSON.stringify(v.style).includes('#2F80ED')));
  await screen.unmount();
  rec.shared = []; rec.reduce = true;
  screen = await mount(React.createElement(UserDot));
  assert.equal(rec.shared[0].animation, null);
  await screen.unmount();
});

// ---- the top card and the place card ---------------------------------------------------------

test('the floating card: "Map", the 15 km chip, and the legend', async () => {
  const screen = await mount(React.createElement(MapHeader, { top: 59 }));
  for (const wanted of ['Map', '15 km around you', 'Saved', 'Spotted Partner', 'You']) assert.ok(lines().includes(wanted), wanted);
  assert.ok(rec.animatedViews.some((v) => v.includes('"top":59')));
  assert.ok(!lines().some((t) => t.includes('Preview')));
  await screen.unmount();
  rec.texts = [];
  const noted = await mount(React.createElement(MapHeader, { top: 0, note: 'Preview map. x' }));
  assert.ok(lines().includes('Preview map. x'));
  await noted.unmount();
});

test('the place card: logo, name, category and price, distance, and Open', async () => {
  let opened = 0;
  const place = mock.placeById('saffron');
  const screen = await mount(React.createElement(MapPlaceCard, { place, bottom: 96, onOpen: () => { opened++; } }));
  assert.equal(rec.logo, 'saffron');
  for (const wanted of ['Saffron Lane', 'Indian · AED 35–80 pp', '1.2 km away', 'Open']) assert.ok(lines().includes(wanted), wanted);
  assert.ok(rec.animatedViews.some((v) => v.includes('"bottom":96')));
  const button = rec.pressables.find((p) => p.accessibilityLabel === 'Open Saffron Lane');
  button.onPress();
  assert.equal(opened, 1);
  await screen.unmount();
});

// ---- the real map ----------------------------------------------------------------------------

async function showReal(extra = {}) {
  const props = { center, pins: pins(), selectedId: null, onSelect: () => {}, onClear: () => {}, ...extra };
  return mount(React.createElement(RealMap, props));
}

test('real map: a dashed purple 15 km circle around the user, and a blue dot', async () => {
  const screen = await showReal();
  assert.deepStrictEqual(rec.mapCircle.center, center);
  assert.equal(rec.mapCircle.radius, 15000);
  assert.deepStrictEqual(rec.mapCircle.lineDashPattern, [12, 8]);
  assert.match(rec.mapCircle.strokeColor, /160,97,240/);
  assert.match(rec.mapCircle.fillColor, /160,97,240/);
  const dot = rec.markers.find((m) => m.accessibilityLabel === 'Your location');
  assert.deepStrictEqual(dot.coordinate, center);
  await screen.unmount();
});

test('real map: one marker per pin, at the right distance from the user, with the tip as the anchor', async () => {
  const screen = await showReal();
  const placeMarkers = rec.markers.filter((m) => m.accessibilityLabel !== 'Your location');
  assert.equal(placeMarkers.length, 13);
  const saffron = placeMarkers.find((m) => m.accessibilityLabel === 'Saffron Lane');
  const km = Math.hypot((saffron.coordinate.latitude - center.latitude) * 111, (saffron.coordinate.longitude - center.longitude) * 111 * Math.cos((25.2 * Math.PI) / 180));
  assert.ok(Math.abs(km - 1.2) < 0.05);
  assert.deepStrictEqual(saffron.anchor, { x: 0.5, y: 1 });
  await screen.unmount();
});

test('real map: tapping a pin selects it without counting as a map tap; tapping the map clears', async () => {
  const log = [];
  const screen = await showReal({ onSelect: (id) => log.push('select ' + id), onClear: () => log.push('clear') });
  let stopped = 0;
  rec.markers.find((m) => m.accessibilityLabel === 'Brew Theory').onPress({ stopPropagation: () => { stopped++; } });
  rec.mapView.onPress();
  assert.deepStrictEqual(log, ['select brew', 'clear']);
  assert.equal(stopped, 1);
  await screen.unmount();
});

test('real map: the selected pin is drawn on top', async () => {
  const screen = await showReal({ selectedId: 'brew' });
  const zIndexes = Object.fromEntries(rec.markers.filter((m) => m.accessibilityLabel !== 'Your location').slice(-13).map((m) => [m.accessibilityLabel, m.zIndex]));
  assert.equal(zIndexes['Brew Theory'], 2);
  assert.equal(zIndexes['Saffron Lane'], 1);
  await screen.unmount();
});

test('real map: pin pictures stop being redrawn after the drop-in (saves battery)', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const screen = await showReal();
  const label = 'Saffron Lane';
  const latest = () => [...rec.markers].reverse().find((m) => m.accessibilityLabel === label);
  assert.equal(latest().tracksViewChanges, true);
  await act(async () => { t.mock.timers.tick(200 + 900 + 5000); });
  assert.equal(latest().tracksViewChanges, false);
  await screen.unmount();
});

test('real map: starts on the whole circle; dark mode uses the dark style; light mode does not', async () => {
  let screen = await showReal();
  assert.deepStrictEqual(rec.mapView.initialRegion, rules.startRegion(center));
  assert.equal(rec.mapView.customMapStyle, undefined);
  assert.equal(rec.mapView.toolbarEnabled, false);
  await screen.unmount();
  rec.scheme = 'dark';
  screen = await showReal();
  assert.ok(Array.isArray(rec.mapView.customMapStyle) && JSON.stringify(rec.mapView.customMapStyle).includes('#14284A'));
  assert.equal(rec.mapView.userInterfaceStyle, 'dark');
  await screen.unmount();
});

test('real map: when the user\'s real position arrives, the map glides there', async () => {
  let setCenter;
  function Host() { const [c, set] = React.useState(center); setCenter = set; return React.createElement(RealMap, { center: c, pins: pins(), selectedId: null, onSelect: () => {}, onClear: () => {} }); }
  const screen = await mount(React.createElement(Host));
  assert.deepStrictEqual(rec.animateTo, [], 'not at the start');
  await act(async () => { setCenter({ latitude: 24.4, longitude: 54.6 }); });
  assert.equal(rec.animateTo.length, 1);
  assert.equal(rec.animateTo[0][0].latitude, 24.4);
  assert.equal(rec.animateTo[0][1], 600, 'a gentle glide, not a jump');
  await screen.unmount();
});

// ---- the drawn preview map -------------------------------------------------------------------

test('preview map: nothing is drawn until it knows its size; then the circle, dot and pins appear', async () => {
  const screen = await mount(React.createElement(SketchMap, { pins: pins(), selectedId: null, onSelect: () => {}, onClear: () => {} }));
  assert.equal(rec.pressables.filter((p) => p.accessibilityRole === 'button').length, 0);
  const root = rec.pressables[0];
  await act(async () => { root.onLayout({ nativeEvent: { layout: { width: 390, height: 760 } } }); });
  const buttons = rec.pressables.filter((p) => p.accessibilityRole === 'button');
  assert.ok(buttons.length >= 13);
  const last = (label) => [...rec.pressables].reverse().find((p) => p.accessibilityLabel === label);
  // Saffron Lane: 1.2 km from the dot, angle -35 degrees
  const radius = Math.min(390 * 0.41, 760 * 0.34);
  const offset = rules.sketchOffset(mock.placeById('saffron'), radius);
  assert.equal(last('Saffron Lane, 1.2 km away').style.left, 195 + offset.x - 22);
  assert.equal(last('Saffron Lane, 1.2 km away').style.top, 760 * 0.49 + offset.y - 48);
  const circle = rec.views.map((v) => Object.assign({}, ...[v.style].flat(Infinity).filter(Boolean))).find((s) => s.borderStyle === 'dashed' && s.left !== undefined);
  assert.equal(circle.width, radius * 2);
  assert.equal(circle.left, 195 - radius);
  await screen.unmount();
});

test('preview map: tapping a pin selects it; tapping empty ground clears', async () => {
  const log = [];
  const screen = await mount(React.createElement(SketchMap, { pins: pins(), selectedId: null, onSelect: (id) => log.push(id), onClear: () => log.push('clear') }));
  await act(async () => { rec.pressables[0].onLayout({ nativeEvent: { layout: { width: 390, height: 760 } } }); });
  [...rec.pressables].reverse().find((p) => p.accessibilityLabel === 'Sushi Kaze, 10.2 km away').onPress();
  rec.pressables[0].onPress();
  assert.deepStrictEqual(log, ['kaze', 'clear']);
  await screen.unmount();
});
