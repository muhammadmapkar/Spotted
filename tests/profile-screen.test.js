// The Profile tab. The REAL screen runs with recorders for the drawing parts: it checks the header, that the
// savings number counts up each time the tab opens, the loyalty cards, and what each switch saves.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

installFakes({});
const mock = app('src/data/mock.js');
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');

const seen = { focus: new Set(), icons: [], labels: [], ring: null, savings: [], list: null, cards: [], toggles: [], texts: [], pressables: [], toast: null };
const calls = { push: [], signOut: 0, theme: [] };
const state = { scheme: 'light', reduce: false, user: { phone: '+971501234567', name: 'Aisha Rahman', email: 'aisha@example.com', createdAt: 'x' } };
const palette = new Proxy({}, { get: () => '#000000' });

installFakes({
  'expo-router': {
    useRouter: () => ({ push: (path) => calls.push.push(path) }),
    useFocusEffect: (effect) => { seen.focus.add(effect); React.useEffect(() => effect(), [effect]); },
  },
  'react-native': {
    StyleSheet: { create: (x) => x },
    View: (props) => { if (props.accessibilityLabel) seen.labels.push(props.accessibilityLabel); return props.children ?? null; },
    ScrollView: (props) => props.children ?? null,
    Pressable: (props) => { seen.pressables.push(props); return props.children ?? null; },
    FlatList: (props) => { seen.list = props; return React.createElement(React.Fragment, null, props.data.map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item, index) }, props.renderItem({ item, index })))); },
  },
  'react-native-reanimated': { useReducedMotion: () => state.reduce },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: state.scheme, setPreference: (p) => calls.theme.push(p) }) },
  '@/src/auth/AuthContext': { useAuth: () => ({ user: state.user, signOut: async () => { calls.signOut++; } }) },
  '@/src/auth/phone': app('src/auth/phone.js'),
  '@/src/components/ui/ui': { AppText: (props) => { seen.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/components/icons/Icon': { Icon: (props) => { seen.icons.push(props.name); return null; } },
  '@/src/components/influencer/ProfileRing': { RingAvatar: (props) => { seen.ring = props; return null; } },
  '@/src/components/place/Toast': { Toast: (props) => { seen.toast = props.message; return null; } },
  '@/src/components/profile/SavingsCard': { SavingsCard: (props) => { seen.savings.push(props); return null; } },
  '@/src/components/profile/LoyaltyCardView': { LoyaltyCardView: (props) => { seen.cards.push(props); return null; }, LOYALTY_CARD_WIDTH: 270 },
  '@/src/components/profile/ToggleRow': { ToggleRow: (props) => { seen.toggles.push(props); return null; } },
  '@/src/db': data,
  '@/src/profile/profileData': app('src/profile/profileData.js'),
  '@/src/profile/useCountUp': app('src/profile/useCountUp.js'),
});
const ProfileScreen = app('app/(tabs)/profile.js').default;

test.beforeEach(async (t) => {
  await useTestDatabase(makeTestDb());
  Object.assign(seen, { icons: [], labels: [], ring: null, savings: [], list: null, cards: [], toggles: [], texts: [], pressables: [], toast: null });
  Object.assign(calls, { push: [], signOut: 0, theme: [] });
  Object.assign(state, { scheme: 'light', reduce: false });
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
});
const open = [];
async function show() {
  const real = await mount(React.createElement(ProfileScreen));
  await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });
const toggle = (title) => [...seen.toggles].reverse().find((t) => t.title === title);
const latestSavings = () => seen.savings.at(-1);

test('header: initial on a purple-to-red gradient, name, email, phone with a verified tick', async () => {
  const screen = await show();
  assert.deepStrictEqual([seen.ring.initial, seen.ring.gradient, seen.ring.pictureUrl], ['A', ['#9D4EDD', '#D62839'], undefined], 'no photo');
  for (const wanted of ['Aisha Rahman', 'aisha@example.com', '+971 50 123 4567']) assert.ok(seen.texts.includes(wanted), wanted);
  assert.ok(seen.labels.includes('Verified') && seen.icons.includes('check'), 'the green tick next to the phone number');
  await screen.unmount();
});

test('the savings number counts up from 0 to AED 340 when the tab opens', async (t) => {
  const screen = await show();
  assert.equal(latestSavings().shown, 0);
  await act(async () => { t.mock.timers.tick(28 * 3); });
  assert.equal(latestSavings().shown, 33);
  await act(async () => { t.mock.timers.tick(28 * 40); });
  assert.equal(latestSavings().shown, 340);
  await screen.unmount();
});

test('with Reduce Motion the savings number is simply AED 340 (from the very first drawing)', async () => {
  state.reduce = true;
  const screen = await show();
  assert.equal(seen.savings[0].shown, 340, 'it never flashes 0');
  assert.equal(latestSavings().shown, 340);
  await screen.unmount();
});

test('opening the tab again counts up again, with a new coin burst', async (t) => {
  const screen = await show();
  await act(async () => { t.mock.timers.tick(28 * 60); });
  assert.equal(latestSavings().shown, 340);
  const firstKey = latestSavings().runKey;
  await act(async () => { for (const effect of seen.focus) effect(); }); // the tab gets focus again
  assert.equal(latestSavings().shown, 0, 'starts from 0 again');
  assert.equal(latestSavings().runKey, firstKey + 1, 'a new key makes the coins burst again');
  await act(async () => { t.mock.timers.tick(28 * 60); });
  assert.equal(latestSavings().shown, 340);
  await screen.unmount();
});

test('loyalty cards: one per restaurant, swipeable, and a tap opens the place', async () => {
  const screen = await show();
  const latest = seen.cards.slice(-3); // the cards from the most recent drawing
  assert.deepStrictEqual(latest.map((c) => c.view.place.id), ['saffron', 'brew', 'stack']);
  assert.equal(seen.list.horizontal, true);
  assert.equal(seen.list.snapToInterval, 284);
  latest[1].onPress();
  assert.deepStrictEqual(calls.push, ['/venue/brew']);
  await screen.unmount();
});

test('WhatsApp: off at first, green when on, saves the choice with the profile, and says so', async () => {
  const screen = await show();
  const row = toggle('Get new offers on WhatsApp');
  assert.equal(row.value, false);
  assert.equal(row.onColor, '#1F8F4E');
  assert.equal(row.subtitle, 'New deals within 15 km, sent to +971 50 123 4567');
  await act(async () => { row.onChange(true); });
  assert.equal(toggle('Get new offers on WhatsApp').value, true);
  assert.equal(seen.toast, 'New offers will come to your WhatsApp');
  assert.equal(await data.getWhatsappOffers('+971501234567'), true, 'saved on the phone with the profile');
  await act(async () => { toggle('Get new offers on WhatsApp').onChange(false); });
  assert.equal(seen.toast, 'WhatsApp offers turned off');
  assert.equal(await data.getWhatsappOffers('+971501234567'), false);
  await screen.unmount();
});

test('WhatsApp: a saved "on" choice is shown when the tab opens', async () => {
  await data.setWhatsappOffers('+971501234567', true);
  const screen = await show();
  assert.equal(toggle('Get new offers on WhatsApp').value, true);
  await screen.unmount();
});

test('WhatsApp: if saving fails the switch goes back and says so', async () => {
  const screen = await show();
  const original = data.setWhatsappOffers;
  await useTestDatabase({ ...makeTestDb(), runAsync: async () => { throw new Error('disk full'); } });
  await act(async () => { toggle('Get new offers on WhatsApp').onChange(true); });
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  assert.equal(toggle('Get new offers on WhatsApp').value, false);
  assert.equal(seen.toast, "Couldn't save that choice");
  void original;
  await screen.unmount();
});

test('nearby saved-place alerts are the normal app notifications: the same switch as Settings > Nearby reminders', async () => {
  const screen = await show();
  assert.equal(toggle('Nearby saved-place alerts').value, true, 'reminders are on by default');
  await act(async () => { toggle('Nearby saved-place alerts').onChange(false); });
  assert.equal((await data.getSettings()).remindersEnabled, false);
  assert.equal(toggle('Nearby saved-place alerts').value, false);
  assert.ok(!seen.texts.some((t) => /WhatsApp/.test(t) && /Nearby/.test(t)));
  assert.equal(toggle('Nearby saved-place alerts').subtitle, 'App notifications, e.g. "A place you saved is 1 km away"');
  await act(async () => { toggle('Nearby saved-place alerts').onChange(true); });
  assert.equal((await data.getSettings()).remindersEnabled, true);
  await screen.unmount();
});

test('nearby alerts show what Settings says (reminders already off)', async () => {
  await data.saveSettings({ remindersEnabled: false });
  const screen = await show();
  assert.equal(toggle('Nearby saved-place alerts').value, false);
  await screen.unmount();
});

test('dark mode: the switch follows the theme and changes it', async () => {
  let screen = await show();
  assert.equal(toggle('Dark mode').value, false);
  await act(async () => { toggle('Dark mode').onChange(true); });
  await act(async () => { toggle('Dark mode').onChange(false); });
  assert.deepStrictEqual(calls.theme, ['dark', 'light']);
  await screen.unmount();
  state.scheme = 'dark';
  screen = await show();
  assert.equal(toggle('Dark mode').value, true);
  await screen.unmount();
});

test('Settings and Sign out are at the bottom', async () => {
  const screen = await show();
  const buttons = seen.pressables.filter((p) => p.accessibilityRole === 'button').slice(-2); // from the latest drawing
  buttons[0].onPress();
  assert.deepStrictEqual(calls.push, ['/settings']);
  buttons[1].onPress();
  assert.equal(calls.signOut, 1);
  assert.ok(seen.texts.includes('Settings') && seen.texts.includes('Sign out'));
  await screen.unmount();
});
