// Two pieces of the Place page, run for real with pretend phone parts:
//  - the menu sheet: the PDF inside the app, or the paper menu
//  - the dropdown: opens and closes with an animation (at once with Reduce Motion)
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const mock = app('src/data/mock.js');
const rec = { os: 'android', modal: null, webview: null, texts: [], pressables: [], reduce: false, shared: [], layouts: [] };
const palette = new Proxy({}, { get: () => '#000000' });
const passChildren = (props) => props.children ?? null;

installFakes({
  'react-native': {
    Platform: { get OS() { return rec.os; }, select: (options) => options[rec.os] ?? options.default },
    StyleSheet: { create: (x) => x },
    View: (props) => { if (props.onLayout) rec.layouts.push(props); return props.children ?? null; },
    ScrollView: passChildren,
    ActivityIndicator: () => null,
    Modal: (props) => { rec.modal = props; return props.visible ? props.children : null; },
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
  },
  'react-native-webview': { WebView: (props) => { rec.webview = props; return null; } },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: passChildren },
    Easing: { bezier: () => (t) => t },
    useReducedMotion: () => rec.reduce,
    useSharedValue: (initial) => {
      // one record per hook, kept between drawings (like the real thing)
      const ref = require('react').useRef(null);
      if (!ref.current) {
        ref.current = { _v: initial, animation: null, get value() { return this._v; }, set value(next) { if (next && next.__timing) this.animation = next; else this._v = next; } };
        rec.shared.push(ref.current);
      }
      return ref.current;
    },
    useAnimatedStyle: (fn) => fn(),
    withTiming: (to, config) => ({ __timing: true, to, duration: config?.duration }),
  },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: (props) => { rec.texts.push(props.children); return null; } },
  '@/src/components/icons/Icon': { Icon: () => null },
  '@/src/place/placeData': app('src/place/placeData.js'),
});
const { MenuSheet, PaperMenu } = app('src/components/place/MenuSheet.js');
const { Dropdown } = app('src/components/place/Dropdown.js');

test.beforeEach(() => Object.assign(rec, { os: 'android', modal: null, webview: null, texts: [], pressables: [], reduce: false, shared: [], layouts: [] }));
const flat = () => rec.texts.flat(Infinity).map(String);

// ---- the menu sheet --------------------------------------------------------------------------

test('a place with a menu PDF shows it inside the app (Android: in a viewer)', async () => {
  const place = { ...mock.placeById('saffron'), menuPdfUrl: 'https://cdn.example.com/Saffron-Menu.pdf' };
  const screen = await mount(React.createElement(MenuSheet, { place, visible: true, onClose: () => {} }));
  assert.ok(rec.webview, 'a web view is used');
  assert.equal(rec.webview.source.uri, 'https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent('https://cdn.example.com/Saffron-Menu.pdf'));
  assert.ok(flat().includes('Saffron-Menu.pdf'), 'the file name is at the top');
  assert.ok(flat().includes('PDF'));
  assert.ok(!flat().includes('Butter chicken'), 'the paper menu is not drawn');
  assert.equal(rec.modal.animationType, 'slide', 'slides up');
  await screen.unmount();
});

test('on iPhone the PDF is shown directly', async () => {
  rec.os = 'ios';
  const place = { ...mock.placeById('saffron'), menuPdfUrl: 'https://cdn.example.com/Saffron-Menu.pdf' };
  const screen = await mount(React.createElement(MenuSheet, { place, visible: true, onClose: () => {} }));
  assert.equal(rec.webview.source.uri, 'https://cdn.example.com/Saffron-Menu.pdf');
  await screen.unmount();
});

test('the web view only follows https links', async () => {
  const place = { ...mock.placeById('saffron'), menuPdfUrl: 'https://cdn.example.com/m.pdf' };
  const screen = await mount(React.createElement(MenuSheet, { place, visible: true, onClose: () => {} }));
  const allow = rec.webview.onShouldStartLoadWithRequest;
  assert.equal(allow({ url: 'https://docs.google.com/viewer' }), true);
  assert.equal(allow({ url: 'http://evil.example.com' }), false);
  assert.equal(allow({ url: 'intent://x#Intent;end' }), false);
  assert.equal(allow({ url: 'javascript:alert(1)' }), false);
  assert.deepStrictEqual(rec.webview.originWhitelist, ['https://*']);
  await screen.unmount();
});

test('no PDF: the items are drawn like a paper menu', async () => {
  const place = mock.placeById('saffron');
  const screen = await mount(React.createElement(MenuSheet, { place, visible: true, onClose: () => {} }));
  assert.equal(rec.webview, null, 'no web view');
  const texts = flat();
  for (const wanted of ['Saffron Lane', 'RESTAURANT MENU', 'Butter chicken', 'Lamb biryani', 'Mango lassi', 'Prices include VAT', 'Page 1 of 1', 'Saffron-Lane-menu.pdf']) {
    assert.ok(texts.includes(wanted), `shows "${wanted}"`);
  }
  assert.ok(texts.some((t) => t.includes('48')), 'prices are shown');
  assert.ok(!texts.some((t) => t.includes('could not be opened')), 'no error message');
  await screen.unmount();
});

test('if the PDF cannot load, the paper menu is shown instead, and it is tried again next time', async () => {
  const place = { ...mock.placeById('saffron'), menuPdfUrl: 'https://cdn.example.com/m.pdf' };
  let setVisible;
  function Host() { const [visible, set] = React.useState(true); setVisible = set; return React.createElement(MenuSheet, { place, visible, onClose: () => set(false) }); }
  const screen = await mount(React.createElement(Host));
  await act(async () => { rec.webview.onError(); });
  assert.ok(flat().includes('Butter chicken'), 'paper menu appears');
  assert.ok(flat().includes('The menu file could not be opened, so here are the items instead.'));
  await act(async () => { setVisible(false); });
  rec.webview = null;
  await act(async () => { setVisible(true); });
  assert.ok(rec.webview, 'the PDF is tried again');
  await act(async () => { rec.webview.onHttpError(); });
  assert.ok(flat().filter((t) => t === 'Butter chicken').length >= 1);
  await screen.unmount();
});

test('the X button, the dark area and the Android back button all close the menu', async () => {
  let closed = 0;
  const screen = await mount(React.createElement(MenuSheet, { place: mock.placeById('brew'), visible: true, onClose: () => { closed++; } }));
  const closers = rec.pressables.filter((p) => p.accessibilityLabel === 'Close menu');
  assert.equal(closers.length, 2, 'the X and the dark area');
  closers.forEach((p) => p.onPress());
  rec.modal.onRequestClose();
  assert.equal(closed, 3);
  await screen.unmount();
});

test('the sheet is not drawn while closed', async () => {
  const screen = await mount(React.createElement(MenuSheet, { place: mock.placeById('brew'), visible: false, onClose: () => {} }));
  assert.equal(rec.modal.visible, false);
  assert.ok(!flat().includes('Spanish latte'));
  await screen.unmount();
});

test('paper menu lists every item with its price', async () => {
  const place = mock.placeById('luma');
  const screen = await mount(React.createElement(PaperMenu, { place }));
  const texts = flat();
  for (const item of place.menu) assert.ok(texts.includes(item.name) && texts.some((t) => t === `AED ${item.price}` || t.includes(String(item.price))), item.name);
  assert.ok(texts.includes('CATALOGUE'));
  await screen.unmount();
});

// ---- the dropdown ----------------------------------------------------------------------------

function dropdown(props) {
  return React.createElement(Dropdown, { title: 'Offers', count: 3, icon: 'tag', iconColor: '#000', open: false, onToggle: () => {}, children: React.createElement(() => null), ...props });
}

test('dropdown: open at the start means fully open, closed means fully closed', async () => {
  let screen = await mount(dropdown({ open: true }));
  assert.equal(rec.shared[0]._v, 1);
  await screen.unmount();
  rec.shared = [];
  screen = await mount(dropdown({ open: false }));
  assert.equal(rec.shared[0]._v, 0);
  await screen.unmount();
});

test('dropdown: opening and closing animate for 0.4 s (and at once with Reduce Motion)', async () => {
  let setOpen;
  function Host() { const [open, set] = React.useState(false); setOpen = set; return dropdown({ open }); }
  let screen = await mount(React.createElement(Host));
  await act(async () => { setOpen(true); });
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration], [1, 400]);
  await act(async () => { setOpen(false); });
  assert.deepStrictEqual([rec.shared[0].animation.to, rec.shared[0].animation.duration], [0, 400]);
  await screen.unmount();

  rec.shared = []; rec.reduce = true;
  screen = await mount(React.createElement(Host));
  await act(async () => { setOpen(true); });
  assert.equal(rec.shared[0]._v, 1, 'Reduce Motion: straight to open');
  assert.equal(rec.shared[0].animation, null, 'no animation');
  await screen.unmount();
});

test('dropdown: the header says whether it is expanded, the body is measured, and a tap toggles', async () => {
  let toggled = 0;
  const screen = await mount(dropdown({ open: true, onToggle: () => { toggled++; } }));
  const header = rec.pressables.find((p) => p.accessibilityRole === 'button');
  assert.deepStrictEqual(header.accessibilityState, { expanded: true });
  assert.equal(header.accessibilityLabel, 'Offers, 3');
  header.onPress();
  assert.equal(toggled, 1);
  rec.layouts[0].onLayout({ nativeEvent: { layout: { height: 180 } } });
  assert.equal(rec.shared[1]._v, 180, 'the body height is remembered so it can slide open');
  assert.ok(flat().includes('Offers') && flat().includes('3'));
  await screen.unmount();
});
