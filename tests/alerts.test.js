// Nearby alerts: where a tap goes, the in-app banner (store and component), and the order of the phone's
// permission questions when the user turns alerts on.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact, makeTestDb } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

installFakes({});
const links = app('src/alerts/links.js');
const store = app('src/alerts/bannerStore.js');

// ---- where a tap goes ------------------------------------------------------------------------

test('a tap opens the Place page for a Spotted place, or the edit page for a place saved from a reel', () => {
  assert.equal(links.hrefForAlert({ venueId: 'saffron' }), '/venue/saffron');
  assert.equal(links.hrefForAlert({ placeId: 'abc-123' }), '/place/abc-123');
  assert.equal(links.hrefForAlert({ venueId: 'saffron', placeId: 'abc' }), '/venue/saffron', 'the Spotted place wins');
});

test('bad or odd notification data never opens anything surprising', () => {
  for (const bad of [null, undefined, 5, 'x', {}, { venueId: 5 }, { placeId: null }, { venueId: '' }]) assert.equal(links.hrefForAlert(bad), null, JSON.stringify(bad));
  assert.equal(links.hrefForAlert({ venueId: '../../settings' }), '/venue/..%2F..%2Fsettings', 'the id cannot climb out of the Place page');
});

// ---- the banner's store ----------------------------------------------------------------------

test('the banner shows one alert, and goes away by itself after 6.5 seconds', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  store.hideBanner();
  assert.equal(store.getBanner(), null);
  store.showBanner({ id: 'a', title: 'A place you saved is 1.2 km away', body: 'Saffron Lane', href: '/venue/saffron' });
  assert.equal(store.getBanner().id, 'a');
  t.mock.timers.tick(6499);
  assert.ok(store.getBanner(), 'still there just before 6.5 s');
  t.mock.timers.tick(1);
  assert.equal(store.getBanner(), null);
  assert.equal(store.BANNER_MS, 6500);
});

test('a newer alert replaces the banner and restarts the timer; hiding twice is harmless', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  store.showBanner({ id: 'a', title: 't', body: 'b', href: null });
  t.mock.timers.tick(5000);
  store.showBanner({ id: 'b', title: 't2', body: 'b2', href: null });
  t.mock.timers.tick(5000);
  assert.equal(store.getBanner().id, 'b', 'the first timer must not hide the second alert');
  t.mock.timers.tick(1500);
  assert.equal(store.getBanner(), null);
  store.hideBanner();
  store.hideBanner();
  assert.equal(store.getBanner(), null);
});

test('screens hear about the banner', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let seen;
  const screen = await mount(React.createElement(function Probe() { seen = store.useBanner(); return null; }));
  assert.equal(seen, null);
  await act(async () => { store.showBanner({ id: 'z', title: 't', body: 'b', href: null }); });
  assert.equal(seen.id, 'z');
  await act(async () => { store.hideBanner(); });
  assert.equal(seen, null);
  await screen.unmount();
});

// ---- the banner on screen --------------------------------------------------------------------

const rec = { reduce: false, scheme: 'light', pressables: [], texts: [], shared: [], received: null, removed: 0, pushed: [], styles: [], gradients: [] };
const palette = new Proxy({}, { get: () => '#000000' });
installFakes({
  'expo-notifications': { addNotificationReceivedListener: (fn) => { rec.received = fn; return { remove: () => { rec.removed++; } }; } },
  'expo-router': { useRouter: () => ({ push: (href) => rec.pushed.push(href) }) },
  'expo-linear-gradient': { LinearGradient: (props) => { rec.gradients.push(props); return props.children ?? null; } },
  'react-native': {
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
  },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: (props) => { rec.styles.push(JSON.stringify(props.style)); return props.children ?? null; } },
    Easing: { bezier: () => (t) => t },
    useReducedMotion: () => rec.reduce,
    useSharedValue: (v) => { const r = require('react').useRef(null); if (!r.current) { r.current = { _v: v, animation: null, get value() { return this._v; }, set value(n) { if (n && n.__a) this.animation = n; else this._v = n; } }; rec.shared.push(r.current); } return r.current; },
    useAnimatedStyle: (fn) => fn(),
    withTiming: (to, config) => ({ __a: true, to, duration: config?.duration }),
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 47, bottom: 0, left: 0, right: 0 }) },
  'react-native-svg': { __esModule: true, default: (props) => props.children ?? null, Path: () => null },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: rec.scheme }) },
  '@/src/components/ui/ui': { AppText: (props) => { rec.texts.push([props.children].flat(Infinity).filter((c) => typeof c === 'string').join('')); const nested = [props.children].flat(Infinity).filter(React.isValidElement); return nested.length ? React.createElement(React.Fragment, null, ...nested) : null; } },
  '@/src/alerts/links': links,
  '@/src/alerts/bannerStore': store,
});
const { AlertBannerHost } = app('src/components/alerts/AlertBanner.js');

test.beforeEach(() => { store.hideBanner(); Object.assign(rec, { reduce: false, scheme: 'light', pressables: [], texts: [], shared: [], received: null, removed: 0, pushed: [], styles: [], gradients: [] }); });
const incoming = (id, data) => ({ request: { identifier: id, content: { title: 'A place you saved is 1.2 km away', body: 'Saffron Lane · 5 influencers recommend it', data } } });

test('nothing is shown until an alert arrives; then the banner slides down with the words', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const screen = await mount(React.createElement(AlertBannerHost));
  assert.equal(rec.pressables.length, 0);
  await act(async () => { rec.received(incoming('n1', { venueId: 'saffron' })); });
  for (const wanted of ['SPOTTED', 'A place you saved is 1.2 km away', 'Saffron Lane · 5 influencers recommend it']) assert.ok(rec.texts.includes(wanted) || rec.texts.some((x) => x.includes(wanted)), wanted);
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration], [1, 550], 'slides in over 0.55 s');
  assert.ok(rec.styles.some((s) => s.includes('"translateY":-160')), 'starts above the screen');
  assert.ok(rec.styles.some((s) => s.includes('"top":59')), 'below the phone top edge (47 + 12)');
  assert.ok(rec.gradients.some((g) => g.colors.join() === '#9D4EDD,#5A189A'), 'the purple app icon');
  await screen.unmount();
  assert.equal(rec.removed, 1, 'stops listening when closed');
});

test('tapping the banner opens the place and hides the banner', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const screen = await mount(React.createElement(AlertBannerHost));
  await act(async () => { rec.received(incoming('n1', { venueId: 'saffron' })); });
  await act(async () => { rec.pressables.at(-1).onPress(); });
  assert.deepStrictEqual(rec.pushed, ['/venue/saffron']);
  assert.equal(store.getBanner(), null);
  await screen.unmount();
});

test('an alert without a place just hides the banner when tapped; it also goes by itself after 6.5 s', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const screen = await mount(React.createElement(AlertBannerHost));
  await act(async () => { rec.received(incoming('n2', {})); });
  assert.ok(store.getBanner());
  await act(async () => { t.mock.timers.tick(6500); });
  assert.equal(store.getBanner(), null);
  await act(async () => { rec.received(incoming('n3', {})); });
  await act(async () => { rec.pressables.at(-1).onPress(); });
  assert.deepStrictEqual(rec.pushed, []);
  assert.equal(store.getBanner(), null);
  await screen.unmount();
});

test('with Reduce Motion the banner is simply there', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  rec.reduce = true;
  const screen = await mount(React.createElement(AlertBannerHost));
  await act(async () => { rec.received(incoming('n4', { venueId: 'brew' })); });
  assert.equal(rec.shared[0]._v, 1);
  assert.equal(rec.shared[0].animation, null);
  await screen.unmount();
});

test('the banner is dark in dark mode', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  rec.scheme = 'dark';
  const screen = await mount(React.createElement(AlertBannerHost));
  await act(async () => { rec.received(incoming('n5', {})); });
  assert.ok(JSON.stringify(rec.pressables.at(-1).style).includes('rgba(42,26,68,0.97)'));
  await screen.unmount();
});

test('while the app is open the phone does not show its own banner (ours does), but the alert stays in the list', () => {
  // app/_layout.tsx cannot be run here, so its notification settings are read from the file.
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'app', '_layout.tsx'), 'utf8');
  const handler = source.slice(source.indexOf('setNotificationHandler'), source.indexOf('SplashScreen.preventAutoHideAsync'));
  assert.match(handler, /shouldShowBanner: false/);
  assert.match(handler, /shouldShowList: true/);
  assert.match(source, /<AlertBannerHost \/>/, 'our banner is mounted in the app');
});

test('app.json: location and notification permission texts for iPhone and Android', () => {
  const config = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'app.json'), 'utf8')).expo;
  const plist = config.ios.infoPlist;
  for (const key of ['NSLocationWhenInUseUsageDescription', 'NSLocationAlwaysAndWhenInUseUsageDescription', 'NSLocationAlwaysUsageDescription']) {
    assert.ok(plist[key] && plist[key].length > 40, key);
    assert.match(plist[key], /stays on your phone/, `${key} says the location stays on the phone`);
  }
  assert.match(plist.NSLocationAlwaysAndWhenInUseUsageDescription, /even when the app is closed/, 'the background use is explained');
  assert.match(plist.NSLocationWhenInUseUsageDescription, /while the app is open/);
  assert.deepStrictEqual(plist.UIBackgroundModes, ['location']);
  for (const permission of ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_BACKGROUND_LOCATION', 'android.permission.POST_NOTIFICATIONS']) {
    assert.ok(config.android.permissions.includes(permission), permission);
  }
  const location = config.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-location')[1];
  assert.equal(location.isAndroidBackgroundLocationEnabled, true);
  assert.equal(location.isIosBackgroundLocationEnabled, true);
  assert.match(location.locationAlwaysPermission, /even when the app is closed/);
  assert.ok(config.plugins.some((p) => p === 'expo-notifications' || (Array.isArray(p) && p[0] === 'expo-notifications')));
});
