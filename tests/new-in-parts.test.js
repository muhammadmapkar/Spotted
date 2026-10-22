// The pieces of the New In tab, run for real with recorders: the shimmering badge, the offer card,
// the new-influencer circle, the JUST JOINED badge on place cards, and the round profile picture.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount } = setupReact();

installFakes({});
const mock = app('src/data/mock.js');
const rec = { reduce: false, shared: [], delays: [], repeats: [], pressables: [], images: [], gradients: [], texts: [], views: [], badges: [], icons: [], scheme: 'light', tones: {} };
const palette = new Proxy({}, { get: (_t, key) => `<${String(key)}>` });
const passChildren = (props) => props.children ?? null;

installFakes({
  'react-native': {
    StyleSheet: { create: (x) => x, absoluteFill: { position: 'absolute' } },
    View: (props) => { rec.views.push(JSON.stringify(props.style)); return props.children ?? null; },
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
    Image: (props) => { rec.images.push(props); return null; },
  },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: (props) => { rec.views.push(JSON.stringify(props.style)); return props.children ?? null; } },
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
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: rec.scheme }) },
  '@/src/theme/shadows': { cardShadow: () => 'shadow', partnerGlow: () => 'glow', PARTNER_BORDER: 'border' },
  '@/src/components/ui/ui': { AppText: (props) => { const text = [props.children].flat(Infinity).join(''); rec.texts.push(text); rec.tones[text] = props.tone; return null; } },
  '@/src/components/icons/Icon': { Icon: (props) => { rec.icons.push(props.name); return null; } },
  '@/src/data/mock': mock,
  '@/src/home/homeData': app('src/home/homeData.js'),
  '@/src/place/placeData': app('src/place/placeData.js'),
  '@/src/newin/newInData': app('src/newin/newInData.js'),
});
installFakes({ '@/src/components/motion': app('src/components/motion.js') });
installFakes({ '@/src/components/NewBadge': app('src/components/NewBadge.js'), '@/src/components/place/OffersList': app('src/components/place/OffersList.js'), '@/src/components/home/InfluencerCard': app('src/components/home/InfluencerCard.js') });
const { NewBadge } = app('src/components/NewBadge.js');
const { OfferCard } = app('src/components/newin/OfferCard.js');
const { NewInfluencerCircle } = app('src/components/newin/NewInfluencerCircle.js');
const { InfluencerAvatar } = app('src/components/home/InfluencerCard.js');
const { PlaceInfoCard } = app('src/components/PlaceInfoCard.js');
const { SourceBadge } = app('src/components/place/OffersList.js');
const newIn = app('src/newin/newInData.js');

test.beforeEach(() => Object.assign(rec, { reduce: false, shared: [], delays: [], repeats: [], pressables: [], images: [], gradients: [], texts: [], views: [], icons: [], scheme: 'light', tones: {} }));
const RED_SHIMMER = '#D62839,#FF6B6B,#D62839,#FF6B6B,#D62839';

// ---- the badge -------------------------------------------------------------------------------

test('the NEW badge is red with a shimmer that loops for ever every 1.6 s (not with Reduce Motion)', async () => {
  let screen = await mount(React.createElement(NewBadge, { label: 'NEW' }));
  assert.ok(rec.texts.includes('NEW'));
  assert.ok(rec.gradients.some((g) => g.colors.join() === RED_SHIMMER), 'red to light red and back');
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration, rec.shared[0].animation.times], [1, 1600, -1]);
  const slid = rec.views.find((v) => v.includes('translateX'));
  assert.ok(slid.includes('"translateX":0') || slid.includes('"translateX":-0'), 'starts at the beginning');
  await screen.unmount();
  rec.shared = []; rec.reduce = true;
  screen = await mount(React.createElement(NewBadge, { label: 'JUST JOINED' }));
  assert.ok(rec.texts.includes('JUST JOINED'));
  assert.equal(rec.shared[0].animation, null);
  await screen.unmount();
});

test('the shimmer slides exactly one pattern length (120 px), so the loop has no jump', async () => {
  let redraw;
  function Host() { const [, set] = React.useState(0); redraw = () => set((n) => n + 1); return React.createElement(NewBadge, { label: 'NEW' }); }
  const screen = await mount(React.createElement(Host));
  rec.shared[0].value = 1; // the end of one loop
  rec.views = [];
  await require('react').act(async () => { redraw(); });
  assert.ok(rec.views.some((v) => v.includes('"translateX":-120')), 'moved by 120 px');
  assert.ok(rec.views.some((v) => v.includes('"width":240')), 'the strip is two pattern lengths wide, so it always covers the badge');
  await screen.unmount();
});

// ---- offer card ------------------------------------------------------------------------------

const card = (i = 0) => newIn.newOfferCards()[i];

test('offer card: NEW badge, source, offer text, place and distance, and the time left', async () => {
  let taps = 0;
  const screen = await mount(React.createElement(OfferCard, { card: card(0), onPress: () => { taps++; } }));
  for (const wanted of ['NEW', '15% off the whole bill', 'Saffron Lane · 1.2 km away', 'Ends in 3 days', 'Esaad']) assert.ok(rec.texts.includes(wanted), wanted);
  assert.ok(rec.gradients.some((g) => g.colors.join() === mock.thumbColors(mock.placeById('saffron')).join()), 'the place colours on top');
  assert.equal(rec.tones['Ends in 3 days'], 'red', 'the time left is red');
  const press = rec.pressables[0];
  assert.match(press.accessibilityLabel, /15% off the whole bill, Saffron Lane, 1.2 km away, Ends in 3 days/);
  press.onPress();
  assert.equal(taps, 1);
  await screen.unmount();
});

test('offer card: a Spotted offer shows the Spotted source; the place photo replaces the colours when there is one', async () => {
  const stack = card(1);
  assert.equal(stack.offer.source, 'Spotted');
  const withPhoto = { ...stack, place: { ...stack.place, photoUrl: 'https://cdn.example.com/stack.jpg' } };
  const screen = await mount(React.createElement(OfferCard, { card: withPhoto, onPress: () => {} }));
  assert.ok(rec.texts.includes('Free truffle fries with any burger'));
  assert.ok(rec.texts.includes('Spotted'), 'the Spotted offers have no title in New In, so the source name shows');
  assert.deepStrictEqual(rec.images.map((i) => i.source.uri), ['https://cdn.example.com/stack.jpg']);
  await screen.unmount();
});

test('offer card: slides up at its own moment', async () => {
  const screen = await mount(React.createElement(OfferCard, { card: card(2), onPress: () => {} }));
  assert.deepStrictEqual(rec.delays, [180]);
  await screen.unmount();
});

test('source badges: Esaad green, Fazaa blue, Spotted purple; darker in dark mode', async () => {
  const draw = async (source, scheme) => {
    rec.scheme = scheme; rec.views = []; rec.gradients = [];
    const screen = await mount(React.createElement(SourceBadge, { offer: { source, text: 'x' } }));
    await screen.unmount();
    return rec.views.join(' ') + JSON.stringify(rec.gradients.map((g) => g.colors));
  };
  assert.ok((await draw('Esaad', 'light')).includes('#DFF3EA'));
  assert.ok((await draw('Fazaa', 'light')).includes('#E2ECFB'));
  assert.ok((await draw('Esaad', 'dark')).includes('#113D2A'));
  assert.ok((await draw('Spotted', 'light')).includes('#6A1FB0'));
});

// ---- new influencer circle -------------------------------------------------------------------

test('new influencer: initial circle, @handle and JUST JOINED; pops in; tap opens the page', async () => {
  let taps = 0;
  const item = newIn.newInfluencers()[1];
  const screen = await mount(React.createElement(NewInfluencerCircle, { item, onPress: () => { taps++; } }));
  for (const wanted of ['T', '@the.sweet.stop', 'JUST JOINED']) assert.ok(rec.texts.includes(wanted), wanted);
  assert.deepStrictEqual(rec.delays, [400]);
  assert.equal(rec.pressables[0].accessibilityLabel, '@the.sweet.stop, just joined Spotted');
  rec.pressables[0].onPress();
  assert.equal(taps, 1);
  await screen.unmount();
});

test('the round profile picture: the influencer picture when we have one (web links only), otherwise colours and initial', async () => {
  const influencer = mock.INFLUENCERS[5];
  let screen = await mount(React.createElement(InfluencerAvatar, { influencer: { ...influencer, profilePicUrl: 'https://cdn.example.com/w.jpg' }, size: 62 }));
  assert.deepStrictEqual(rec.images.map((i) => [i.source.uri, i.style.width, i.style.borderRadius]), [['https://cdn.example.com/w.jpg', 62, 31]]);
  assert.ok(!rec.texts.includes('W'));
  await screen.unmount();
  rec.images = [];
  screen = await mount(React.createElement(InfluencerAvatar, { influencer: { ...influencer, profilePicUrl: 'file:///x.jpg' }, size: 62 }));
  assert.equal(rec.images.length, 0);
  assert.ok(rec.texts.includes('W'));
  assert.ok(rec.gradients.some((g) => g.colors.join() === influencer.gradient.join()));
  await screen.unmount();
});

// ---- JUST JOINED on a place card -------------------------------------------------------------

test('a place card shows JUST JOINED before the Spotted Partner badge only when asked', async () => {
  const glow = mock.placeById('glow');
  const props = { place: glow, saved: false, index: 0, onPress: () => {}, onMenuPress: () => {} };
  let screen = await mount(React.createElement(PlaceInfoCard, { ...props, justJoined: true }));
  assert.ok(rec.texts.includes('JUST JOINED') && rec.texts.includes('Spotted Partner'));
  assert.ok(rec.texts.indexOf('JUST JOINED') < rec.texts.indexOf('Spotted Partner'));
  await screen.unmount();
  rec.texts = [];
  screen = await mount(React.createElement(PlaceInfoCard, props));
  assert.ok(!rec.texts.includes('JUST JOINED'));
  assert.ok(rec.texts.includes('Spotted Partner'));
  await screen.unmount();
});
