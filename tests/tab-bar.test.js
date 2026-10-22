// The bottom bar: tab order, geometry of the sliding dot, safe-area space, and the "New In" red dot.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { app, readPrototype, setupReact } = require('./helpers/fakes');
const { TABS, INITIAL_TAB } = app('src/components/tabBarConfig.js');
const math = app('src/components/tabBarMath.js');
const newIn = app('src/state/newIn.js');
const { ICON_SHAPES } = app('src/components/icons/paths.js');

test('the tabs are Saved, Map, Home, New In, Profile, with Home in the middle and first to open', () => {
  assert.deepStrictEqual(TABS.map((t) => t.label), ['Saved', 'Map', 'Home', 'New In', 'Profile']);
  assert.equal(TABS.length, 5);
  assert.equal(TABS[2].center, true, 'Home is the centre tab');
  assert.equal(TABS.filter((t) => t.center).length, 1, 'only one raised button');
  assert.equal(TABS[2].name, INITIAL_TAB);
  assert.equal(INITIAL_TAB, 'index', 'Home is the default route, so it opens first');
});

test('every tab has a screen file, a unique name and a real icon (Profile uses the initial instead)', () => {
  const dir = path.join(__dirname, '..', 'app', '(tabs)');
  for (const tab of TABS) {
    assert.ok(fs.existsSync(path.join(dir, tab.name + '.tsx')), `app/(tabs)/${tab.name}.tsx is missing`);
    if (tab.name === 'profile') assert.equal(tab.icon, undefined, 'no person icon on Profile');
    else assert.ok(ICON_SHAPES[tab.icon], `${tab.name}: unknown icon ${tab.icon}`);
  }
  assert.equal(new Set(TABS.map((t) => t.name)).size, TABS.length);
  assert.ok(!fs.existsSync(path.join(dir, 'settings.tsx')), 'Settings is no longer a tab (it opens from Profile)');
});

test('geometry matches the prototype: 5 columns, the dot centred under its tab', () => {
  // The prototype: a 390 px bar, columns 78 px wide, dot (6 px) at left = index * 78 + 36.
  assert.equal(math.columnWidth(390, 5), 78);
  for (let i = 0; i < 5; i++) assert.equal(math.dotLeft(390, 5, i), i * 78 + 36, `tab ${i}`);
  const css = readPrototype();
  assert.match(css, /navDot: Math\.round\(ti \* 78 \+ 36\)/, 'the prototype uses the same formula');
  assert.match(css, /\.nb-home\{width:58px;height:58px/);
  assert.equal(math.HOME_CIRCLE, 58);
  assert.equal(math.DOT_SIZE, 6);
  // on any width the dot stays in the middle of the column
  for (const w of [320, 360, 412, 768]) {
    for (let i = 0; i < 5; i++) {
      const centre = math.dotLeft(w, 5, i) + math.DOT_SIZE / 2;
      assert.ok(Math.abs(centre - (i + 0.5) * (w / 5)) < 1e-9);
    }
  }
});

test('the bar height is the prototype\'s 84 px, and grows for phones with a bottom gesture bar', () => {
  assert.equal(math.barHeight(0), 84, 'prototype: 70 + 14');
  assert.equal(math.barHeight(10), 84, 'a small edge still gets the 14 px');
  assert.equal(math.barHeight(34), 70 + 34, 'iPhone-style bottom edge');
  assert.equal(math.bottomPadding(0), 14);
});

test('the New In red dot shows until the tab is opened, and the tab bar hears about it', async () => {
  const { React, mount, act } = setupReact();
  newIn.resetNewInSeen();
  let showDot;
  const Probe = () => { showDot = newIn.useShowNewInDot(); return null; };
  const screen = await mount(React.createElement(Probe));
  assert.equal(showDot, true, 'the dot shows at first');
  await act(async () => { newIn.markNewInSeen(); }); // opening the New In tab
  assert.equal(showDot, false, 'the dot is gone, without any restart');
  await act(async () => { newIn.markNewInSeen(); }); // opening it again changes nothing
  assert.equal(showDot, false);
  await act(async () => { newIn.resetNewInSeen(); }); // a fresh app start
  assert.equal(showDot, true);
  await screen.unmount();
});

test('the tab layout declares the tabs in the same order as the bar, uses the custom bar, and opens on Home', () => {
  const layout = fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', '_layout.tsx'), 'utf8');
  const declared = [...layout.matchAll(/<Tabs\.Screen name="(\w+)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(declared, TABS.map((t) => t.name), 'Tabs.Screen order = bar order');
  assert.match(layout, /tabBar=\{\(props\) => <SpottedTabBar \{\.\.\.props\} \/>\}/, 'uses the custom bar');
  assert.match(layout, /initialRouteName=\{INITIAL_TAB\}/, 'Home opens first');
});

test('Settings still opens (from Profile) and Profile has no person icon', () => {
  const root = fs.readFileSync(path.join(__dirname, '..', 'app', '_layout.tsx'), 'utf8');
  assert.match(root, /<Stack\.Screen name="settings"/, 'the app has a Settings screen');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'app', 'settings.tsx')));
  const profile = fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', 'profile.tsx'), 'utf8');
  assert.match(profile, /router\.push\('\/settings'/, 'Profile opens Settings');
  assert.match(profile, /signOut/, 'Profile can sign out');
  assert.doesNotMatch(profile, /name="(user|person|face)"/, 'no person icon');
});
