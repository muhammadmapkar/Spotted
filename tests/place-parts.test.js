// The smaller pieces of the Place page, run for real with recorders for the drawing parts:
// the hero picture, the action buttons, the influencer rows and the offer rows.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const mock = app('src/data/mock.js');
const rec = { scheme: 'light', reduce: false, pressables: [], images: [], gradients: [], icons: [], texts: [], shopFronts: [], shared: [], delays: [], repeats: [], insetTop: 0, views: [] };
const palette = new Proxy({}, { get: (_t, key) => `<${String(key)}>` });
const passChildren = (props) => props.children ?? null;

installFakes({
  '@/src/theme/shadows': { MONO_SHADOW: {}, cardShadow: () => 'shadow', partnerGlow: () => 'glow', PARTNER_BORDER: 'border' },
  'react-native': {
    StyleSheet: { create: (x) => x, absoluteFill: {} },
    View: (props) => { rec.views.push(JSON.stringify(props.style ?? null)); return props.children ?? null; },
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
    Image: (props) => { rec.images.push(props); return null; },
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: rec.insetTop, bottom: 0, left: 0, right: 0 }) },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: passChildren },
    Easing: { out: () => (t) => t, ease: 1 },
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
    withTiming: (to, config) => ({ __a: true, kind: 'timing', to, duration: config?.duration }),
    withDelay: (delay, animation) => { rec.delays.push(delay); return { ...animation, delay }; },
    withRepeat: (animation, times) => { rec.repeats.push(times); return { ...animation, times }; },
    withSequence: (...steps) => ({ __a: true, kind: 'sequence', steps }),
  },
  'react-native-svg': { __esModule: true, default: () => null, Circle: () => null, Path: () => null },
  'expo-linear-gradient': { LinearGradient: (props) => { rec.gradients.push(props); return props.children ?? null; } },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: rec.scheme }) },
  '@/src/components/ui/ui': { AppText: (props) => { rec.texts.push(props.children); return null; } },
  '@/src/components/icons/Icon': { Icon: (props) => { rec.icons.push(props); return null; } },
  '@/src/components/place/ShopFront': { ShopFront: (props) => { rec.shopFronts.push(props.place.id); return null; } },
  '@/src/place/placeData': app('src/place/placeData.js'),
});
const { PlaceHero } = app('src/components/place/PlaceHero.js');
const { ActionRow } = app('src/components/place/ActionRow.js');
const { InfluencerRecs } = app('src/components/place/InfluencerRecs.js');
const { OffersList } = app('src/components/place/OffersList.js');
const placeData = app('src/place/placeData.js');

test.beforeEach(() => Object.assign(rec, { scheme: 'light', reduce: false, pressables: [], images: [], gradients: [], icons: [], texts: [], shopFronts: [], shared: [], delays: [], repeats: [], insetTop: 0, views: [] }));
const flat = () => rec.texts.flat(Infinity).map(String);
// each piece of text on one line, e.g. ['@','capital.bites'] -> '@capital.bites'
const lines = () => rec.texts.map((t) => [t].flat(Infinity).join(''));
const place = (id) => mock.placeById(id);
const byLabel = (label) => rec.pressables.find((p) => p.accessibilityLabel === label);

// ---- hero ------------------------------------------------------------------------------------

test('hero: no photo means the drawn shop front, in the place colours', async () => {
  const screen = await mount(React.createElement(PlaceHero, { place: place('saffron'), onBack: () => {} }));
  assert.deepStrictEqual(rec.shopFronts, ['saffron']);
  assert.equal(rec.images.length, 0);
  await screen.unmount();
});

test('hero: a photo link is used when the place has one', async () => {
  const withPhoto = { ...place('saffron'), photoUrl: 'https://cdn.example.com/front.jpg' };
  const screen = await mount(React.createElement(PlaceHero, { place: withPhoto, onBack: () => {} }));
  assert.equal(rec.images[0].source.uri, 'https://cdn.example.com/front.jpg');
  assert.equal(rec.shopFronts.length, 0);
  await screen.unmount();
});

test('hero: slowly zooms out for 6 s (not at all with Reduce Motion)', async () => {
  let screen = await mount(React.createElement(PlaceHero, { place: place('saffron'), onBack: () => {} }));
  assert.equal(rec.shared[0]._v, 1.16);
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration], [1, 6000]);
  await screen.unmount();
  rec.shared = []; rec.reduce = true;
  screen = await mount(React.createElement(PlaceHero, { place: place('saffron'), onBack: () => {} }));
  assert.equal(rec.shared[0]._v, 1);
  assert.equal(rec.shared[0].animation, null);
  await screen.unmount();
});

test('hero: the Spotted Partner badge only for partners; the back button goes back', async () => {
  let backs = 0;
  let screen = await mount(React.createElement(PlaceHero, { place: place('saffron'), onBack: () => { backs++; } }));
  assert.ok(flat().includes('Spotted Partner'));
  byLabel('Back').onPress();
  assert.equal(backs, 1);
  await screen.unmount();
  rec.texts = [];
  screen = await mount(React.createElement(PlaceHero, { place: place('taco'), onBack: () => {} }));
  assert.ok(!flat().includes('Spotted Partner'), 'Taco Norte is not a partner');
  await screen.unmount();
});

// ---- action row ------------------------------------------------------------------------------

function row(props) {
  return React.createElement(ActionRow, { placeName: 'Saffron Lane', saved: false, onLocation: () => {}, onMenu: () => {}, onToggleSave: () => {}, ...props });
}

test('action row: three buttons, each doing its own job', async () => {
  const log = [];
  const screen = await mount(row({ onLocation: () => log.push('location'), onMenu: () => log.push('menu'), onToggleSave: () => log.push('save') }));
  byLabel('Open Saffron Lane in Google Maps').onPress();
  byLabel('Open the menu of Saffron Lane').onPress();
  byLabel('Save this place').onPress();
  assert.deepStrictEqual(log, ['location', 'menu', 'save']);
  assert.ok(flat().includes('Location') && flat().includes('Menu'));
  await screen.unmount();
});

test('action row: the bookmark fills red when saved, and says what a tap will do', async () => {
  let screen = await mount(row({ saved: false }));
  assert.equal(byLabel('Save this place').accessibilityState.selected, false);
  assert.equal(rec.icons.find((i) => i.name === 'bookmark').filled, false);
  await screen.unmount();
  rec.pressables = []; rec.icons = [];
  screen = await mount(row({ saved: true }));
  assert.ok(byLabel('Remove from saved'));
  const mark = rec.icons.find((i) => i.name === 'bookmark');
  assert.equal(mark.filled, true);
  assert.equal(mark.color, '<red>');
  await screen.unmount();
});

test('action row: the pin bounces twice, starting 1 second after the page opens', async () => {
  const screen = await mount(row());
  assert.deepStrictEqual(rec.delays, [1000]);
  assert.deepStrictEqual(rec.repeats, [2]);
  await screen.unmount();
  rec.delays = []; rec.repeats = []; rec.reduce = true;
  const calm = await mount(row());
  assert.deepStrictEqual(rec.delays, [], 'Reduce Motion: no bounce');
  await calm.unmount();
});

// ---- influencer rows -------------------------------------------------------------------------

function recsFor(id) { return placeData.recommendationsFor(place(id)); }
function influencerRows(props) {
  return React.createElement(InfluencerRecs, { recs: recsFor('saffron'), onOpenInfluencer: () => {}, onOpenReel: () => {}, ...props });
}

test('influencers: handle, platform, followers, and every recommended item with its price', async () => {
  const screen = await mount(influencerRows());
  const texts = flat();
  assert.ok(lines().includes('@capital.bites'));
  assert.ok(lines().includes('Instagram · 48.2K followers'));
  assert.ok(lines().includes('TikTok · 92K followers'));
  const first = recsFor('saffron')[0];
  for (const item of first.items) assert.ok(texts.includes(item.name) && lines().includes(`AED ${item.price}`), item.name);
  await screen.unmount();
});

test('influencers: no profile picture means gradient + initial; a picture is used when we have one', async () => {
  let screen = await mount(influencerRows());
  assert.ok(rec.gradients.some((g) => g.colors.join() === mock.INFLUENCERS[0].gradient.join()), 'the first influencer gradient');
  assert.ok(flat().includes('C'), 'their initial');
  assert.equal(rec.images.length, 0);
  await screen.unmount();
  rec.images = []; rec.texts = [];
  const withPic = recsFor('saffron').map((r, i) => (i === 0 ? { ...r, profilePicUrl: 'https://cdn.example.com/c.jpg' } : r));
  screen = await mount(influencerRows({ recs: withPic }));
  assert.deepStrictEqual(rec.images.map((i) => i.source.uri), ['https://cdn.example.com/c.jpg']);
  assert.ok(!flat().includes('C'), 'the picture replaces the initial');
  await screen.unmount();
});

test('influencers: the circle and the handle open the Influencer page; the small icon opens that reel', async () => {
  const opened = []; const reels = [];
  const screen = await mount(influencerRows({ onOpenInfluencer: (id) => opened.push(id), onOpenReel: (r) => reels.push(r.reelUrl) }));
  const pages = rec.pressables.filter((p) => p.accessibilityLabel === "Open @capital.bites's page");
  assert.equal(pages.length, 2, 'the circle and the handle');
  pages.forEach((p) => p.onPress());
  assert.deepStrictEqual(opened, ['capital', 'capital']);
  byLabel("Watch @capital.bites's reel on Instagram").onPress();
  byLabel("Watch @thelunchmap's reel on TikTok").onPress();
  assert.deepStrictEqual(reels, ['https://www.instagram.com/capital.bites/', 'https://www.tiktok.com/@thelunchmap']);
  await screen.unmount();
});

test('influencers: the reel button is coloured by platform, and there is a friendly empty message', async () => {
  const screen = await mount(influencerRows());
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#F58529,#DD2A7B,#8134AF'), 'Instagram gradient');
  const iconsByName = rec.icons.map((i) => i.name);
  assert.ok(iconsByName.includes('camera') && iconsByName.includes('music'), 'Instagram and TikTok icons');
  await screen.unmount();
  rec.texts = [];
  const empty = await mount(influencerRows({ recs: [] }));
  assert.deepStrictEqual(flat(), ['No influencer has spotted this place yet.']);
  await empty.unmount();
});

// ---- offers ----------------------------------------------------------------------------------

test('offers: partner discounts and Spotted offers, each row with its badge', async () => {
  const screen = await mount(React.createElement(OffersList, { place: place('saffron') }));
  const texts = flat();
  for (const wanted of ['PARTNER DISCOUNTS', 'SPOTTED OFFERS', 'Esaad', 'Fazaa', '15% off the total bill', '10% off dine-in', 'Stamp card', 'Lunch deal', 'Collect stamps, discount rises up to 25%']) {
    assert.ok(texts.includes(wanted), `shows "${wanted}"`);
  }
  assert.ok(!texts.includes('No Fazaa or Esaad discount here yet.'));
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#6A1FB0,#9D4EDD'), 'Spotted badge is purple');
  await screen.unmount();
});

test('offers: friendly messages when there are none', async () => {
  const screen = await mount(React.createElement(OffersList, { place: place('taco') }));
  const texts = flat();
  assert.ok(texts.includes('No Fazaa or Esaad discount here yet.'));
  assert.ok(texts.includes('Spotted offers appear once this place becomes a Spotted Partner.'));
  await screen.unmount();
  rec.texts = [];
  const half = await mount(React.createElement(OffersList, { place: place('luma') })); // a Fazaa discount, no Spotted offers
  assert.ok(!flat().includes('No Fazaa or Esaad discount here yet.'));
  assert.ok(flat().includes('Spotted offers appear once this place becomes a Spotted Partner.'));
  await half.unmount();
});

test('offers: the badge colours follow light and dark mode', async () => {
  const colours = {};
  for (const scheme of ['light', 'dark']) {
    rec.scheme = scheme; rec.views = [];
    const screen = await mount(React.createElement(OffersList, { place: place('saffron') }));
    colours[scheme] = rec.views.join(' ');
    await screen.unmount();
  }
  assert.ok(colours.light.includes('#DFF3EA') && colours.light.includes('#E2ECFB'), 'light: green Esaad, blue Fazaa');
  assert.ok(colours.dark.includes('#113D2A') && colours.dark.includes('#14284A'), 'dark: darker Esaad and Fazaa');
  assert.ok(!colours.dark.includes('#DFF3EA'));
});
