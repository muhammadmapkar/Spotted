// The pieces of the Influencer page, run for real with recorders for the drawing parts:
// the rotating-ring profile circle, platform buttons, top-7 cards and recommendation rows.
// Also the entrance animations they use (zoom, pop, fan in, rise).
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const mock = app('src/data/mock.js');
const rec = { reduce: false, shared: [], delays: [], repeats: [], animatedViews: [], pressables: [], images: [], gradients: [], icons: [], texts: [] };
const palette = new Proxy({}, { get: (_t, key) => `<${String(key)}>` });

installFakes({
  'react-native': {
    StyleSheet: { create: (x) => x, absoluteFill: {} },
    View: (props) => props.children ?? null,
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
    Image: (props) => { rec.images.push(props); return null; },
  },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: (props) => { rec.animatedViews.push(JSON.stringify(props.style)); return props.children ?? null; } },
    Easing: { bezier: () => (t) => t, linear: (t) => t },
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
  'expo-linear-gradient': { LinearGradient: (props) => { rec.gradients.push(props); return props.children ?? null; } },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/theme/shadows': { MONO_SHADOW: {}, cardShadow: () => 'shadow' },
  '@/src/components/ui/ui': { AppText: (props) => { rec.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/components/icons/Icon': { Icon: (props) => { rec.icons.push(props); return null; } },
  '@/src/data/mock': mock,
  '@/src/place/placeData': app('src/place/placeData.js'),
  '@/src/influencer/influencerData': app('src/influencer/influencerData.js'),
});
// the real animation helpers, loaded once the pretend animation library is in place
installFakes({ '@/src/components/motion': app('src/components/motion.js') });
const { ProfileRing } = app('src/components/influencer/ProfileRing.js');
const { PlatformTile } = app('src/components/influencer/PlatformTile.js');
const { TopCard } = app('src/components/influencer/TopCard.js');
const { RecommendationRow } = app('src/components/influencer/RecommendationRow.js');
const data = app('src/influencer/influencerData.js');

test.beforeEach(() => Object.assign(rec, { reduce: false, shared: [], delays: [], repeats: [], animatedViews: [], pressables: [], images: [], gradients: [], icons: [], texts: [] }));
const capital = () => mock.INFLUENCERS[0];
const byLabel = (label) => rec.pressables.find((p) => p.accessibilityLabel === label);

// ---- profile circle --------------------------------------------------------------------------

test('profile circle: no picture means gradient + initial; zooms in over 0.6 s and the ring turns for ever', async () => {
  const screen = await mount(React.createElement(ProfileRing, { influencer: capital() }));
  assert.ok(rec.texts.includes('C'), 'the initial');
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#7B2CBF,#E5383B'), 'the influencer colours');
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#FF4D6D,#C77DFF,#7B2CBF,#FF9E00,#FF4D6D'), 'the rainbow ring');
  assert.equal(rec.images.length, 0);
  const [zoom, turn] = rec.shared;
  assert.deepStrictEqual([zoom.animation.to, zoom.animation.duration], [1, 600], 'zoom in');
  assert.deepStrictEqual([turn.animation.to, turn.animation.duration, turn.animation.times], [360, 6000, -1], 'a full turn every 6 s, repeating');
  await screen.unmount();
});

test('profile circle: their picture replaces the initial; an unsafe picture link is ignored', async () => {
  let screen = await mount(React.createElement(ProfileRing, { influencer: { ...capital(), profilePicUrl: 'https://cdn.example.com/c.jpg' } }));
  assert.deepStrictEqual(rec.images.map((i) => i.source.uri), ['https://cdn.example.com/c.jpg']);
  assert.ok(!rec.texts.includes('C'));
  await screen.unmount();
  rec.images = []; rec.texts = [];
  screen = await mount(React.createElement(ProfileRing, { influencer: { ...capital(), profilePicUrl: 'file:///private/x.jpg' } }));
  assert.equal(rec.images.length, 0);
  assert.ok(rec.texts.includes('C'));
  await screen.unmount();
});

test('profile circle: with Reduce Motion it is simply there and the ring does not turn', async () => {
  rec.reduce = true;
  const screen = await mount(React.createElement(ProfileRing, { influencer: capital() }));
  const [zoom, turn] = rec.shared;
  assert.equal(zoom._v, 1);
  assert.equal(zoom.animation, null);
  assert.equal(turn.animation, null);
  assert.deepStrictEqual(rec.repeats, []);
  await screen.unmount();
});

// ---- platform buttons ------------------------------------------------------------------------

test('platform button: icon, label, pops in at its own moment, and a tap opens the profile', async () => {
  let taps = 0;
  const screen = await mount(React.createElement(PlatformTile, { platform: 'ig', label: 'Instagram', delay: 420, onPress: () => { taps++; } }));
  assert.ok(rec.texts.includes('Instagram'));
  assert.deepStrictEqual(rec.icons.map((i) => [i.name, i.color]), [['camera', '#C13584']]);
  assert.deepStrictEqual(rec.delays, [420]);
  assert.equal(rec.shared[0].animation.duration, 400);
  byLabel('Open on Instagram').onPress();
  assert.equal(taps, 1);
  await screen.unmount();
});

test('platform buttons: the icon and colour fit each platform', async () => {
  const wanted = { tt: ['music', '<text>'], yt: ['video', '#E52D27'] };
  for (const platform of ['tt', 'yt']) {
    rec.icons = [];
    const screen = await mount(React.createElement(PlatformTile, { platform, label: platform, delay: 0, onPress: () => {} }));
    assert.deepStrictEqual([rec.icons[0].name, rec.icons[0].color], wanted[platform], platform);
    await screen.unmount();
  }
});

// ---- top 7 cards -----------------------------------------------------------------------------

const card = (rank = 1) => data.topSeven(capital())[rank - 1];

test('top 7 card: rank number, name, category, distance, and the items with prices', async () => {
  const c = card(3);
  const screen = await mount(React.createElement(TopCard, { card: c, onPress: () => {} }));
  for (const wanted of ['3', 'Sushi Kaze', 'Japanese · 10 km away']) assert.ok(rec.texts.includes(wanted), `shows "${wanted}"`);
  for (const item of c.items) assert.ok(rec.texts.includes(item.name) && rec.texts.includes(`AED ${item.price}`), item.name);
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#2A9D8F,#20444F'), 'the place colours');
  assert.match(byLabel('Number 3, Sushi Kaze, Japanese, 10 km away').accessibilityLabel, /Number 3/);
  await screen.unmount();
});

test('top 7 card: the place photo is used when there is one; a tap opens the place', async () => {
  const c = card(1);
  let taps = 0;
  const withPhoto = { ...c, place: { ...c.place, photoUrl: 'https://cdn.example.com/front.jpg' } };
  const screen = await mount(React.createElement(TopCard, { card: withPhoto, onPress: () => { taps++; } }));
  assert.deepStrictEqual(rec.images.map((i) => i.source.uri), ['https://cdn.example.com/front.jpg']);
  byLabel('Number 1, Saffron Lane, Indian, 1.2 km away').onPress();
  assert.equal(taps, 1);
  await screen.unmount();
});

test('top 7 card: fans in from the right at its own moment (and is simply there with Reduce Motion)', async () => {
  const c = card(4);
  let screen = await mount(React.createElement(TopCard, { card: c, onPress: () => {} }));
  assert.deepStrictEqual(rec.delays, [530]);
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration], [1, 600]);
  const style = rec.animatedViews.find((v) => v.includes('translateX'));
  assert.ok(style.includes('"translateX":120') && style.includes('"rotate":"6deg"'), 'starts 120 px to the right, tilted 6 degrees');
  await screen.unmount();
  rec.reduce = true; rec.animatedViews = []; rec.delays = [];
  screen = await mount(React.createElement(TopCard, { card: c, onPress: () => {} }));
  assert.ok(rec.animatedViews.join().includes('"translateX":0') && rec.animatedViews.join().includes('"rotate":"0deg"'));
  assert.deepStrictEqual(rec.delays, []);
  await screen.unmount();
});

// ---- all recommendations ---------------------------------------------------------------------

const row = (index = 0) => data.allRecommendations(capital())[index];

test('recommendation row: the place and a play button; each opens its own thing', async () => {
  const log = [];
  const screen = await mount(React.createElement(RecommendationRow, { row: row(1), onOpenPlace: () => log.push('place'), onOpenReel: () => log.push('reel') }));
  assert.ok(rec.texts.includes('Stack Burger Co.') && rec.texts.includes('Burgers · 4.6 km away'));
  byLabel('Stack Burger Co., Burgers, 4.6 km away').onPress();
  byLabel('Watch the reel about Stack Burger Co.').onPress();
  assert.deepStrictEqual(log, ['place', 'reel']);
  await screen.unmount();
});

test('recommendation row: the play button is coloured by platform; rows rise in one after another', async () => {
  let screen = await mount(React.createElement(RecommendationRow, { row: row(2), onOpenPlace: () => {}, onOpenReel: () => {} }));
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#F58529,#DD2A7B,#8134AF'), 'Instagram');
  assert.deepStrictEqual(rec.delays, [100], 'the third row waits 100 ms');
  await screen.unmount();
  rec.gradients = []; rec.delays = [];
  const tiktok = { ...row(0), platform: 'tt', delay: 0 };
  screen = await mount(React.createElement(RecommendationRow, { row: tiktok, onOpenPlace: () => {}, onOpenReel: () => {} }));
  assert.ok(!rec.gradients.some((g) => g.colors.join() === '#F58529,#DD2A7B,#8134AF'), 'not the Instagram gradient');
  await screen.unmount();
});

// ---- the fan-in animation itself -------------------------------------------------------------

test('fanIn: at the start the card is invisible, 120 px right and tilted; at the end it is straight', async () => {
  const { useFanIn } = app('src/components/motion.js');
  let style;
  function Probe() { style = useFanIn(0); return null; }
  const screen = await mount(React.createElement(Probe));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(style)), { opacity: 0, transform: [{ translateX: 120 }, { rotate: '6deg' }] });
  rec.shared[0].value = 1;
  await act(async () => {});
  await screen.unmount();
  const done = await mount(React.createElement(function Probe2() { rec.reduce = true; style = useFanIn(0); return null; }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(style)), { opacity: 1, transform: [{ translateX: 0 }, { rotate: '0deg' }] });
  await done.unmount();
});
