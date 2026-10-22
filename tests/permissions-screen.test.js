// The welcome-time permissions screen: it asks for location "while using" and notifications, with a clear
// explanation each, and NEVER asks for "all the time" (that comes later, when the user turns on nearby alerts).
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const rec = { texts: [], pressables: [], asked: [], finished: 0, grant: true };
const colours = new Proxy({}, { get: () => '#000000' });
installFakes({
  'react-native': {
    StyleSheet: { create: (x) => x },
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
  },
  '@/components/Themed': {
    Text: (props) => { rec.texts.push([props.children].flat(Infinity).join('')); return null; },
    View: (props) => props.children ?? null,
  },
  '@/components/useColorScheme': { useColorScheme: () => 'light' },
  '@/constants/Colors': { __esModule: true, default: { light: colours, dark: colours } },
  '@/src/onboarding/OnboardingContext': { useOnboarding: () => ({ finish: async () => { rec.finished++; } }) },
  '@/src/permissions': {
    requestLocation: async () => { rec.asked.push('location'); return rec.grant; },
    requestBackgroundLocation: async () => { rec.asked.push('background'); return rec.grant; },
    requestNotifications: async () => { rec.asked.push('notifications'); return rec.grant; },
  },
});
const PermissionsScreen = app('app/permissions.js').default;
test.beforeEach(() => Object.assign(rec, { texts: [], pressables: [], asked: [], finished: 0, grant: true }));
const latest = () => rec.pressables.slice(-2); // [main button, "Not now"]
const press = async (button) => { await act(async () => { await button.onPress(); }); };

test('step 1 explains location while the app is open; step 2 notifications; then it finishes. "All the time" is never asked.', async () => {
  const screen = await mount(React.createElement(PermissionsScreen));
  assert.ok(rec.texts.includes('See places near you'));
  assert.ok(rec.texts.some((t) => /while the app is open/.test(t)), 'says it is only while the app is open');
  await press(latest()[0]);
  assert.deepStrictEqual(rec.asked, ['location']);
  assert.ok(rec.texts.includes('Allow notifications'), 'straight to notifications, no "all the time" step');
  await press(latest()[0]);
  assert.deepStrictEqual(rec.asked, ['location', 'notifications']);
  assert.equal(rec.finished, 1);
  assert.ok(!rec.asked.includes('background'));
  await screen.unmount();
});

test('refusing or skipping a step still moves on, and the app still works', async () => {
  rec.grant = false;
  const screen = await mount(React.createElement(PermissionsScreen));
  await press(latest()[0]); // refuse location
  assert.ok(rec.texts.includes('Allow notifications'));
  await press(latest()[1]); // "Not now" on notifications
  assert.equal(rec.finished, 1);
  assert.deepStrictEqual(rec.asked, ['location'], 'skipping asks nothing');
  await screen.unmount();
});

test('the words mention that nearby alerts are explained later', async () => {
  const screen = await mount(React.createElement(PermissionsScreen));
  assert.ok(rec.texts.some((t) => /nearby alerts/.test(t)));
  await screen.unmount();
});
