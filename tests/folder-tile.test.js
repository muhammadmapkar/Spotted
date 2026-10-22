// One folder tile: gradient, up to three overlapping logos, name, count, and its pop-in.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount } = setupReact();

const mock = app('src/data/mock.js');
const rec = { gradients: [], texts: [], pressables: [], pops: [], views: [] };
installFakes({
  '@/src/theme/shadows': { MONO_SHADOW: {}, cardShadow: () => 'shadow', partnerGlow: () => 'glow', PARTNER_BORDER: 'border' },
  'react-native': {
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    Pressable: (props) => { rec.pressables.push(props); return props.children ?? null; },
  },
  'expo-linear-gradient': { LinearGradient: (props) => { rec.gradients.push(props); return props.children ?? null; } },
  '@/src/components/motion': { Animated: { View: (props) => props.children ?? null }, usePopIn: (delay, duration) => { rec.pops.push([delay, duration]); return {}; } },
  '@/src/components/ui/ui': { AppText: (props) => { rec.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/data/mock': mock,
});
const { FolderTile } = app('src/components/saved/FolderTile.js');
const rules = app('src/saved/savedData.js');
const all = () => rules.savedPlaces(new Set(mock.PLACES.filter((p) => p.saved).map((p) => p.id)));

test.beforeEach(() => Object.assign(rec, { gradients: [], texts: [], pressables: [], pops: [] }));

test('a tile shows the gradient, three logos, the name and the count; it pops in at its own moment', async () => {
  const tile = rules.folderTiles(all())[1]; // Food
  let taps = 0;
  const screen = await mount(React.createElement(FolderTile, { tile, onPress: () => { taps++; } }));
  assert.deepStrictEqual(rec.gradients[0].colors, ['#F4A259', '#D62839']);
  assert.equal(rec.gradients.length, 1 + 1 + 3, 'the tile, its dark fade, and three small logos');
  assert.deepStrictEqual(rec.gradients[1].colors, ['rgba(0,0,0,0)', 'rgba(0,0,0,0.32)'], 'the fade that keeps the words readable');
  assert.deepStrictEqual(rec.gradients.slice(2).map((g) => g.colors.join()), ['saffron', 'brew', 'taco'].map((id) => mock.thumbColors(mock.placeById(id)).join()));
  for (const wanted of ['SL', 'BT', 'TN', 'Food', '7 places']) assert.ok(rec.texts.includes(wanted), wanted);
  assert.deepStrictEqual(rec.pops, [[80, 450]]);
  assert.ok(rec.gradients.slice(2).every((g) => JSON.stringify(g.style).includes('"marginRight":-10')), 'the small logos overlap');
  assert.equal(rec.pressables[0].accessibilityLabel, 'Food, 7 places');
  rec.pressables[0].onPress();
  assert.equal(taps, 1);
  await screen.unmount();
});

test('an empty folder shows no logos and "0 places"', async () => {
  const tile = rules.folderTiles([])[2];
  const screen = await mount(React.createElement(FolderTile, { tile, onPress: () => {} }));
  assert.equal(rec.gradients.length, 2, 'just the tile and its fade');
  assert.ok(rec.texts.includes('0 places'));
  assert.deepStrictEqual(rec.pops, [[160, 450]]);
  await screen.unmount();
});
