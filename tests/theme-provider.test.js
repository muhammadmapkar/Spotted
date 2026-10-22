// The light/dark choice: defaults to the phone's setting, can be changed, and survives restarts.
// Runs the REAL provider in React, with a pretend phone (react-native) and a pretend database.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb, setupReact } = require('./helpers/fakes');
const { React, mount, act, wait } = setupReact();

const phone = { system: 'light', appearanceCalls: [] };
installFakes({
  'react-native': {
    useColorScheme: () => phone.system,
    Appearance: { setColorScheme: (value) => phone.appearanceCalls.push(value) },
  },
});
const { SpottedThemeProvider, useTheme } = app('src/theme/ThemeProvider.js');
const meta = app('src/db/meta.js');
const { useTestDatabase } = app('src/db/database.js');
const { lightPalette, darkPalette } = app('constants/Theme.js');

let latest; // what a screen would see
const Probe = () => { latest = useTheme(); return null; };
const show = (initialPreference) =>
  mount(React.createElement(SpottedThemeProvider, { initialPreference }, React.createElement(Probe)));

test.beforeEach(async () => {
  phone.system = 'light';
  phone.appearanceCalls.length = 0;
  await useTestDatabase(makeTestDb());
});

test('with no saved choice it follows the phone, in light and in dark', async () => {
  assert.equal(await meta.getThemePreference(), 'system', 'default is "follow my phone"');
  let screen = await show('system');
  assert.equal(latest.scheme, 'light');
  assert.deepStrictEqual(latest.palette, lightPalette);
  await screen.unmount();

  phone.system = 'dark';
  screen = await show('system');
  assert.equal(latest.scheme, 'dark');
  assert.deepStrictEqual(latest.palette, darkPalette);
  await screen.unmount();
});

test('choosing Dark or Light overrides the phone, tells the phone, and is saved', async () => {
  const screen = await show('system');
  await act(async () => { latest.setPreference('dark'); });
  await wait(20);
  assert.equal(latest.scheme, 'dark', 'dark even though the phone is light');
  assert.equal(latest.preference, 'dark');
  assert.deepStrictEqual(phone.appearanceCalls.at(-1), 'dark');
  assert.equal(await meta.getThemePreference(), 'dark', 'saved on the phone');

  await act(async () => { latest.setPreference('light'); });
  await wait(20);
  assert.equal(latest.scheme, 'light');
  assert.equal(await meta.getThemePreference(), 'light');

  await act(async () => { latest.setPreference('system'); });
  await wait(20);
  assert.equal(phone.appearanceCalls.at(-1), 'unspecified', 'hands control back to the phone');
  assert.equal(await meta.getThemePreference(), 'system');
  await screen.unmount();
});

test('the choice survives restarting the app', async () => {
  const first = await show('system');
  await act(async () => { latest.setPreference('dark'); });
  await wait(20);
  await first.unmount();

  // "Restart": the app reads the saved choice and starts the provider with it.
  const saved = await meta.getThemePreference();
  const second = await show(saved);
  assert.equal(latest.scheme, 'dark');
  assert.equal(latest.preference, 'dark');
  await second.unmount();
});

test('a damaged saved value falls back to "follow my phone"', async () => {
  const db = makeTestDb();
  await useTestDatabase(db);
  db.raw.prepare("INSERT INTO meta (key, value) VALUES ('themePreference', 'purple')").run();
  assert.equal(await meta.getThemePreference(), 'system');
});

test('a screen outside the provider gets a clear error, not wrong colours', async () => {
  const Orphan = () => { useTheme(); return null; };
  await assert.rejects(mount(React.createElement(Orphan)), /SpottedThemeProvider/);
});
