// The pieces of the Profile tab, run for real with recorders: savings card and coins, loyalty cards and stamps,
// the switch rows, the count-up, and the round profile picture with the rainbow ring.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

installFakes({});
const mock = app('src/data/mock.js');
const rec = { reduce: false, shared: [], delays: [], repeats: [], pressables: [], gradients: [], texts: [], views: [], switches: [], paths: [], images: [], animated: [] };
const palette = new Proxy({}, { get: (_t, key) => `<${String(key)}>` });

installFakes({
  '@/src/theme/shadows': { MONO_SHADOW: {}, cardShadow: () => 'shadow', partnerGlow: () => 'glow', PARTNER_BORDER: 'border' },
  'react-native': {
    StyleSheet: { create: (x) => x },
    View: (props) => { rec.views.push(props); return props.children ?? null; },
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
    Switch: (props) => { rec.switches.push(props); return null; },
    Image: (props) => { rec.images.push(props); return null; },
  },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: (props) => { rec.animated.push(props); return props.children ?? null; } },
    Easing: { bezier: () => (t) => t, out: () => (t) => t, ease: 1, inOut: () => (t) => t, linear: (t) => t },
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
    withRepeat: (animation, times, reverse) => { rec.repeats.push([times, reverse]); return { ...animation, times }; },
  },
  'react-native-svg': { __esModule: true, default: (props) => props.children ?? null, Path: (props) => { rec.paths.push(props); return null; } },
  'expo-linear-gradient': { LinearGradient: (props) => { rec.gradients.push(props); return props.children ?? null; } },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: (props) => {
    const children = [props.children].flat(Infinity);
    rec.texts.push(children.filter((c) => !React.isValidElement(c)).join(''));
    const nested = children.filter((c) => React.isValidElement(c)); // text inside text, like "Now <b>10% off</b>"
    return nested.length ? React.createElement(React.Fragment, null, ...nested) : null;
  } },
  '@/src/data/mock': mock,
  '@/src/place/placeData': app('src/place/placeData.js'),
  '@/src/profile/profileData': app('src/profile/profileData.js'),
});
installFakes({ '@/src/components/motion': app('src/components/motion.js') });
const { SavingsCard } = app('src/components/profile/SavingsCard.js');
const { LoyaltyCardView } = app('src/components/profile/LoyaltyCardView.js');
installFakes({ '@/src/components/ui/TapSwitch': app('src/components/ui/TapSwitch.js') });
const { ToggleRow } = app('src/components/profile/ToggleRow.js');
const { RingAvatar } = app('src/components/influencer/ProfileRing.js');
const { useCountUp } = app('src/profile/useCountUp.js');
const rules = app('src/profile/profileData.js');

test.beforeEach(() => Object.assign(rec, { reduce: false, shared: [], delays: [], repeats: [], pressables: [], gradients: [], texts: [], views: [], switches: [], paths: [], images: [], animated: [] }));

// ---- savings card ----------------------------------------------------------------------------

test('savings card: the big AED number, the split, and four coins that burst at their own moments', async () => {
  const screen = await mount(React.createElement(SavingsCard, { shown: 340, runKey: 1 }));
  for (const wanted of ["You've saved with Spotted", 'AED 340', 'Spotted', 'Esaad', 'Fazaa', 'AED 145', 'AED 120', 'AED 75']) assert.ok(rec.texts.includes(wanted), wanted);
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#9D4EDD,#5A189A,#3C096C'), 'purple card');
  assert.deepStrictEqual([...rec.delays].sort((a, b) => a - b), [900, 1000, 1050, 1100]);
  assert.ok(rec.shared.every((s) => s.animation.duration === 1400));
  await screen.unmount();
});

test('savings card: the numbers follow the count-up; no coins fly with Reduce Motion', async () => {
  rec.reduce = true;
  const screen = await mount(React.createElement(SavingsCard, { shown: 170, runKey: 1 }));
  assert.ok(rec.texts.includes('AED 170') && rec.texts.includes('AED 73'));
  assert.deepStrictEqual(rec.delays, []);
  await screen.unmount();
});

test('the savings number counts up each time the tab opens (and starts again when the key changes)', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  let value; let reopen;
  function Probe() { const [key, set] = React.useState(0); reopen = () => set((k) => k + 1); value = useCountUp(340, key, false); return null; }
  const screen = await mount(React.createElement(Probe));
  assert.equal(value, 0);
  await act(async () => { t.mock.timers.tick(28 * 5); });
  assert.equal(value, 55);
  await act(async () => { t.mock.timers.tick(28 * 60); });
  assert.equal(value, 340);
  await act(async () => { reopen(); });
  assert.equal(value, 0, 'counts again from 0');
  await act(async () => { t.mock.timers.tick(28 * 2); });
  assert.equal(value, 22);
  await screen.unmount();
});

// ---- loyalty cards ---------------------------------------------------------------------------

const view = (i = 0) => rules.loyaltyViews()[i];

test('loyalty card: logo, "4 of 6 stamps", "Now 10% off" and the next level; a tap opens the place', async () => {
  let taps = 0;
  const screen = await mount(React.createElement(LoyaltyCardView, { view: view(0), onPress: () => { taps++; } }));
  for (const wanted of ['SL', 'Saffron Lane', '4 of 6 stamps', '10% off', '15% at 5 stamps · max 25%']) assert.ok(rec.texts.includes(wanted), wanted);
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#D9661A,#9C3D00'), 'the card colours');
  assert.match(rec.pressables[0].accessibilityLabel, /Saffron Lane, 4 of 6 stamps, now 10% off/);
  rec.pressables[0].onPress();
  assert.equal(taps, 1);
  await screen.unmount();
});

test('stamps: 4 filled ones press in one by one with a bounce, the next one glows gold, the others are dashed', async () => {
  const screen = await mount(React.createElement(LoyaltyCardView, { view: view(0), onPress: () => {} }));
  assert.deepStrictEqual(rec.delays, [300, 440, 580, 720], 'one by one, 140 ms apart');
  assert.equal(rec.paths.length, 4, 'four red bookmarks');
  assert.ok(rec.paths.every((p) => p.fill === '#D62839'));
  const filled = rec.animated.filter((a) => String(JSON.stringify(a.style)).includes('"scale":1.9'));
  assert.equal(filled.length, 4, 'each starts big and tilted (1.9 x, -25 degrees)');
  assert.ok(filled.every((a) => String(JSON.stringify(a.style)).includes('"rotate":"-25deg"')));
  assert.ok(rec.animated.some((v) => String(JSON.stringify(v.style)).includes('#FFD166')), 'the gold ring on the next slot');
  assert.deepStrictEqual(rec.repeats, [[-1, true]], 'the glow pulses for ever');
  assert.ok(rec.views.some((v) => String(JSON.stringify(v.style)).includes('"borderStyle":"dashed"')), 'the empty slot is dashed');
  assert.ok(rec.shared.some((s) => s.animation && s.animation.duration === 450), 'the stamp lasts 0.45 s');
  await screen.unmount();
});

test('stamps: with Reduce Motion they are simply there', async () => {
  rec.reduce = true;
  const screen = await mount(React.createElement(LoyaltyCardView, { view: view(1), onPress: () => {} }));
  assert.deepStrictEqual(rec.delays, []);
  assert.deepStrictEqual(rec.repeats, []);
  assert.equal(rec.paths.length, 5);
  await screen.unmount();
});

test('a full card has no glowing slot and says the maximum is reached', async () => {
  const full = rules.loyaltyView({ placeId: 'brew', stamps: 6, gradient: ['#000000', '#111111'] });
  const screen = await mount(React.createElement(LoyaltyCardView, { view: full, onPress: () => {} }));
  assert.ok(rec.texts.includes('Max 25% reached') && rec.texts.includes('25% off'));
  assert.equal(rec.paths.length, 6);
  assert.deepStrictEqual(rec.repeats, []);
  await screen.unmount();
});

// ---- switch row ------------------------------------------------------------------------------

test('switch row: title, line under it, and a switch with the chosen "on" colour', async () => {
  const changes = [];
  const screen = await mount(React.createElement(ToggleRow, { icon: null, iconBackground: '#DDF5E6', title: 'Get new offers on WhatsApp', subtitle: 'sent to +971', value: true, onChange: (v) => changes.push(v), onColor: '#1F8F4E' }));
  assert.ok(rec.texts.includes('Get new offers on WhatsApp') && rec.texts.includes('sent to +971'));
  const sw = rec.switches[0];
  assert.equal(sw.value, true);
  assert.equal(sw.trackColor.true, '#1F8F4E');
  const button = rec.pressables.find((p) => p.accessibilityRole === 'switch');
  assert.equal(button.accessibilityLabel, 'Get new offers on WhatsApp');
  assert.equal(button.accessibilityState.checked, true);
  button.onPress();
  assert.deepStrictEqual(changes, [false], 'tapping the bigger button flips the switch');
  changes.length = 0;
  sw.onValueChange(false);
  assert.deepStrictEqual(changes, [false]);
  await screen.unmount();
  rec.switches = [];
  const plain = await mount(React.createElement(ToggleRow, { icon: null, iconBackground: '#000000', title: 'Dark mode', value: false, onChange: () => {} }));
  assert.equal(rec.switches[0].trackColor.true, '#7B2CD6', 'purple by default');
  await plain.unmount();
});

// ---- profile circle --------------------------------------------------------------------------

test('profile circle: initial on the gradient inside the turning ring; no photo unless there is a web link', async () => {
  let screen = await mount(React.createElement(RingAvatar, { initial: 'A', gradient: ['#9D4EDD', '#D62839'], label: 'Your profile picture' }));
  assert.ok(rec.texts.includes('A'));
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#9D4EDD,#D62839'));
  assert.equal(rec.images.length, 0);
  await screen.unmount();
  rec.texts = [];
  screen = await mount(React.createElement(RingAvatar, { initial: 'A', gradient: ['#9D4EDD', '#D62839'], pictureUrl: 'file:///x.jpg', label: 'x' }));
  assert.equal(rec.images.length, 0, 'an unsafe link is ignored');
  assert.ok(rec.texts.includes('A'));
  await screen.unmount();
});
