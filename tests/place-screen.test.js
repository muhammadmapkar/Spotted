// The Place page itself. The REAL screen runs, with its drawing pieces swapped for recorders,
// so we can check what it shows and what every button does.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

installFakes({}); // the phone database pieces, so the saved-places store can load
const mock = app('src/data/mock.js');
const savedStore = app('src/state/saved.js');

const params = { id: 'saffron' };
const seen = { hero: null, action: null, dropdowns: {}, recs: null, offers: null, menu: null, toast: null, texts: [] };
const calls = { back: 0, push: [], links: [], linkFails: false };
const record = (key) => (props) => { seen[key] = props; return null; };
const palette = new Proxy({}, { get: () => '#000000' });

installFakes({
  'expo-router': {
    Stack: { Screen: () => null },
    useLocalSearchParams: () => params,
    useRouter: () => ({ back: () => { calls.back++; }, push: (path) => calls.push.push(path) }),
  },
  'react-native': {
    Linking: { openURL: async (url) => { calls.links.push(url); if (calls.linkFails) throw new Error('no app can open this'); } },
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    ScrollView: (props) => props.children ?? null,
    Pressable: (props) => { seen.pressables.push(props); return props.children ?? null; },
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: (props) => { seen.texts.push(props.children); return null; } },
  '@/src/components/place/PlaceHero': { PlaceHero: record('hero') },
  '@/src/components/place/ActionRow': { ActionRow: record('action') },
  '@/src/components/place/Dropdown': { Dropdown: (props) => { seen.dropdowns[props.title] = props; return props.children; } },
  '@/src/components/place/InfluencerRecs': { InfluencerRecs: record('recs') },
  '@/src/components/place/OffersList': { OffersList: record('offers') },
  '@/src/components/place/MenuSheet': { MenuSheet: record('menu') },
  '@/src/components/place/Toast': { Toast: (props) => { seen.toast = props.message; return null; } },
  '@/src/data/mock': mock,
  '@/src/place/placeData': app('src/place/placeData.js'),
  '@/src/state/saved': savedStore,
});
seen.pressables = [];
const VenueScreen = app('app/venue/[id].js').default;

test.beforeEach(() => {
  savedStore.resetSaved();
  Object.assign(params, { id: 'saffron' }); delete params.menu; delete params.offers;
  Object.assign(seen, { hero: null, action: null, dropdowns: {}, recs: null, offers: null, menu: null, toast: null, texts: [], pressables: [] });
  Object.assign(calls, { back: 0, push: [], links: [], linkFails: false });
});

const open = [];
async function show(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const real = await mount(React.createElement(VenueScreen));
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });

test('first look: name, line under it, both dropdowns, menu closed', async (t) => {
  const screen = await show(t);
  assert.equal(seen.hero.place.id, 'saffron');
  assert.ok(seen.texts.includes('Saffron Lane'));
  assert.ok(seen.texts.includes('Indian · AED 35–80 per person · 1.2 km away'));
  assert.equal(seen.action.saved, true, 'Saffron Lane is a saved sample place');
  // dropdown 1: recommendations, open by default, with the number of influencers
  const recs = seen.dropdowns['Influencer recommendations'];
  assert.equal(recs.count, 5);
  assert.equal(recs.open, true);
  // dropdown 2: offers, closed by default, with the number of offers
  const offers = seen.dropdowns['Offers'];
  assert.equal(offers.count, 4);
  assert.equal(offers.open, false);
  assert.equal(seen.recs.recs.length, 5);
  assert.equal(seen.offers.place.id, 'saffron');
  assert.equal(seen.menu.visible, false);
  assert.equal(seen.toast, null);
  await screen.unmount();
});

test('the dropdowns open and close on tap, independently', async (t) => {
  const screen = await show(t);
  await act(async () => { seen.dropdowns['Offers'].onToggle(); });
  assert.equal(seen.dropdowns['Offers'].open, true);
  assert.equal(seen.dropdowns['Influencer recommendations'].open, true, 'the other one is untouched');
  await act(async () => { seen.dropdowns['Influencer recommendations'].onToggle(); });
  assert.equal(seen.dropdowns['Influencer recommendations'].open, false);
  assert.equal(seen.dropdowns['Offers'].open, true);
  await act(async () => { seen.dropdowns['Offers'].onToggle(); });
  assert.equal(seen.dropdowns['Offers'].open, false);
  await screen.unmount();
});

test('Location opens Google Maps at the place', async (t) => {
  const screen = await show(t);
  await act(async () => { seen.action.onLocation(); });
  assert.equal(calls.links.length, 1);
  assert.match(calls.links[0], /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=24\.\d+,54\.\d+$/);
  await screen.unmount();
});

test('if the link cannot be opened, a friendly message appears (no crash)', async (t) => {
  calls.linkFails = true;
  const screen = await show(t);
  await act(async () => { seen.action.onLocation(); });
  assert.equal(seen.toast, "Couldn't open that link");
  await screen.unmount();
});

test('Menu opens the menu sheet; the close button closes it', async (t) => {
  const screen = await show(t);
  await act(async () => { seen.action.onMenu(); });
  assert.equal(seen.menu.visible, true);
  assert.equal(seen.menu.place.id, 'saffron');
  await act(async () => { seen.menu.onClose(); });
  assert.equal(seen.menu.visible, false);
  await screen.unmount();
});

test('arriving from the Menu button on a Home card shows the menu at once', async (t) => {
  params.menu = '1';
  const screen = await show(t);
  assert.equal(seen.menu.visible, true);
  await screen.unmount();
});

test('arriving from an offer on New In opens the Offers dropdown and folds the recommendations', async (t) => {
  params.offers = '1';
  const screen = await show(t);
  assert.equal(seen.dropdowns['Offers'].open, true);
  assert.equal(seen.dropdowns['Influencer recommendations'].open, false);
  assert.equal(seen.menu.visible, false, 'the menu stays closed');
  await screen.unmount();
});

test('the bookmark saves and unsaves, with a short message that goes away', async (t) => {
  const screen = await show(t);
  await act(async () => { seen.action.onToggleSave(); });
  assert.equal(seen.action.saved, false);
  assert.equal(savedStore.getSavedIds().has('saffron'), false);
  assert.equal(seen.toast, 'Removed from saved');
  await act(async () => { seen.action.onToggleSave(); });
  assert.equal(seen.action.saved, true);
  assert.equal(seen.toast, 'Saved to Food');
  await act(async () => { t.mock.timers.tick(2299); });
  assert.equal(seen.toast, 'Saved to Food', 'still there just before 2.3 s');
  await act(async () => { t.mock.timers.tick(1); });
  assert.equal(seen.toast, null, 'gone after 2.3 s');
  await screen.unmount();
});

test('influencers: the profile opens the Influencer page, the reel button opens that reel', async (t) => {
  const screen = await show(t);
  seen.recs.onOpenInfluencer('capital');
  assert.deepStrictEqual(calls.push, ['/influencer/capital']);
  await act(async () => { seen.recs.onOpenReel(seen.recs.recs[0]); });
  assert.deepStrictEqual(calls.links, [seen.recs.recs[0].reelUrl]);
  assert.match(calls.links[0], /^https:\/\//);
  await act(async () => { seen.recs.onOpenReel({ reelUrl: null }); });
  assert.equal(calls.links.length, 1, 'no link, nothing opened');
  assert.equal(seen.toast, "Couldn't open that link");
  await screen.unmount();
});

test('the back button goes back', async (t) => {
  const screen = await show(t);
  seen.hero.onBack();
  assert.equal(calls.back, 1);
  await screen.unmount();
});

test('a place with no influencers and no offers shows zero counts', async (t) => {
  params.id = 'taco';
  const screen = await show(t);
  assert.equal(seen.dropdowns['Influencer recommendations'].count, mock.recsFor('taco').length);
  assert.equal(seen.dropdowns['Offers'].count, 0);
  assert.equal(seen.action.saved, true);
  await screen.unmount();
});

test('an unknown place shows a message and a way back instead of crashing', async (t) => {
  params.id = 'no-such-place';
  const screen = await show(t);
  assert.ok(seen.texts.includes('This place was not found.'));
  assert.equal(seen.hero, null);
  const back = seen.pressables.find((p) => p.accessibilityRole === 'button');
  back.onPress();
  assert.equal(calls.back, 1);
  await screen.unmount();
});
