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
const calls = { push: [], signOut: 0, theme: [], alerts: [], openedSettings: 0 };
const phonePermissions = { location: true, background: true, notifications: true, grant: { location: true, background: true, notifications: true }, asked: [] };
const permissionsFake = {
  getPermissionState: async () => ({ location: phonePermissions.location, background: phonePermissions.background, notifications: phonePermissions.notifications }),
  remindersWork: (p) => p.location && p.background && p.notifications,
  requestLocation: async () => { phonePermissions.asked.push('location'); if (phonePermissions.grant.location) phonePermissions.location = true; return phonePermissions.grant.location; },
  requestBackgroundLocation: async () => { phonePermissions.asked.push('background'); if (phonePermissions.grant.background) phonePermissions.background = true; return phonePermissions.grant.background; },
  requestNotifications: async () => { phonePermissions.asked.push('notifications'); if (phonePermissions.grant.notifications) phonePermissions.notifications = true; return phonePermissions.grant.notifications; },
};
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
    Alert: { alert: (title, message, buttons) => { calls.alerts.push({ title, message, buttons }); } },
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
  '@/src/openLink': { openPhoneSettings: () => { calls.openedSettings++; } },
  '@/src/profile/profileData': app('src/profile/profileData.js'),
  '@/src/profile/useCountUp': app('src/profile/useCountUp.js'),
});
installFakes({ '@/src/permissions': permissionsFake, '../permissions': permissionsFake });
installFakes({ '@/src/alerts/enableAlerts': app('src/alerts/enableAlerts.js') });
const ProfileScreen = app('app/(tabs)/profile.js').default;

test.beforeEach(async (t) => {
  await useTestDatabase(makeTestDb());
  Object.assign(seen, { icons: [], labels: [], ring: null, savings: [], list: null, cards: [], toggles: [], texts: [], pressables: [], toast: null });
  Object.assign(calls, { push: [], signOut: 0, theme: [], alerts: [], openedSettings: 0 });
  Object.assign(phonePermissions, { location: true, background: true, notifications: true, grant: { location: true, background: true, notifications: true }, asked: [] });
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
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
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

test('nearby alerts are on when the setting is on AND the phone allows them', async () => {
  const screen = await show();
  assert.equal(toggle('Nearby saved-place alerts').value, true);
  assert.equal(toggle('Nearby saved-place alerts').subtitle, 'App notifications, e.g. "A place you saved is 1 km away"');
  assert.ok(!toggle('Nearby saved-place alerts').subtitle.includes('WhatsApp'), 'these are normal app notifications, not WhatsApp');
  await screen.unmount();
});

test('nearby alerts show OFF when the phone does not allow location all the time (even if the setting is on)', async () => {
  phonePermissions.background = false;
  const screen = await show();
  assert.equal((await data.getSettings()).remindersEnabled, true);
  assert.equal(toggle('Nearby saved-place alerts').value, false);
  await screen.unmount();
});

test('nearby alerts show OFF when the setting is off', async () => {
  await data.saveSettings({ remindersEnabled: false });
  const screen = await show();
  assert.equal(toggle('Nearby saved-place alerts').value, false);
  await screen.unmount();
});

test('turning nearby alerts OFF saves the setting and asks the phone nothing', async () => {
  const screen = await show();
  await act(async () => { toggle('Nearby saved-place alerts').onChange(false); });
  assert.equal(toggle('Nearby saved-place alerts').value, false);
  assert.equal((await data.getSettings()).remindersEnabled, false);
  assert.deepStrictEqual(phonePermissions.asked, []);
  await screen.unmount();
});

test('turning nearby alerts ON: our explanation first, then the phone asks for "all the time"', async () => {
  await data.saveSettings({ remindersEnabled: false });
  Object.assign(phonePermissions, { background: false });
  const screen = await show();
  let pending;
  await act(async () => { pending = toggle('Nearby saved-place alerts').onChange(true); await flush(); });
  const explanation = calls.alerts.at(-1);
  assert.equal(explanation.title, 'Allow location all the time?');
  assert.match(explanation.message, /even when Spotted is closed/);
  assert.deepStrictEqual(phonePermissions.asked, [], 'the phone has not been asked yet');
  explanation.buttons.find((b) => b.text === 'Continue').onPress();
  await act(async () => { await pending; await flush(); });
  assert.deepStrictEqual(phonePermissions.asked, ['background']);
  assert.equal(toggle('Nearby saved-place alerts').value, true);
  assert.equal((await data.getSettings()).remindersEnabled, true);
  await screen.unmount();
});

test('saying "Not now" to our explanation leaves the switch off and never asks the phone', async () => {
  await data.saveSettings({ remindersEnabled: false });
  Object.assign(phonePermissions, { background: false });
  const screen = await show();
  let pending;
  await act(async () => { pending = toggle('Nearby saved-place alerts').onChange(true); await flush(); });
  calls.alerts.at(-1).buttons.find((b) => b.text === 'Not now').onPress();
  await act(async () => { await pending; await flush(); });
  assert.deepStrictEqual(phonePermissions.asked, []);
  assert.equal(toggle('Nearby saved-place alerts').value, false);
  assert.match(seen.toast, /stay off/);
  await screen.unmount();
});

test('if the phone refuses "all the time", the switch goes back and offers the phone settings', async () => {
  await data.saveSettings({ remindersEnabled: false });
  Object.assign(phonePermissions, { background: false, grant: { location: true, background: false, notifications: true } });
  const screen = await show();
  let pending;
  await act(async () => { pending = toggle('Nearby saved-place alerts').onChange(true); await flush(); });
  calls.alerts.at(-1).buttons.find((b) => b.text === 'Continue').onPress();
  await act(async () => { await pending; await flush(); });
  assert.equal(toggle('Nearby saved-place alerts').value, false);
  const help = calls.alerts.at(-1);
  assert.equal(help.title, 'One more step');
  assert.match(help.message, /Allow all the time/);
  help.buttons.find((b) => b.text === 'Open phone settings').onPress();
  assert.equal(calls.openedSettings, 1);
  assert.equal((await data.getSettings()).remindersEnabled, false);
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
