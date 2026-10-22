// The final audit of the whole app (Step 14): no emoji, no faces, Reduce Motion everywhere, readable colours in both
// themes, and long lists that stay quick. It reads every screen and component file, so a new one is checked too.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { app, installFakes } = require('./helpers/fakes');
const { appFiles, relative, root } = require('./helpers/scan');

installFakes({});
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1'); // "// ..." comments, but not the // in https://

// ---- no emoji, no symbols that look like emoji -----------------------------------------------

test('no emoji in any screen or component (the caption reader is allowed to RECOGNISE the pin emoji in pasted text)', () => {
  const allowed = new Set(['src/places/clues.ts']);
  const symbols = /[▲▼▶✓✔✅＋⭐❤]/u;
  const found = [];
  for (const file of appFiles(['.tsx', '.ts'])) {
    const name = relative(file);
    if (allowed.has(name)) continue;
    stripComments(fs.readFileSync(file, 'utf8')).split('\n').forEach((line, i) => {
      if (/\p{Extended_Pictographic}/u.test(line) || symbols.test(line)) found.push(`${name}:${i + 1}: ${line.trim().slice(0, 80)}`);
    });
  }
  assert.deepStrictEqual(found, [], 'emoji or emoji-like symbols found:\n  ' + found.join('\n  '));
});

test('the sample data and the notification texts have no emoji either', () => {
  const mock = app('src/data/mock.js');
  const rules = app('src/geofence/rules.js');
  const text = JSON.stringify(mock) + rules.alertTitle(1200) + rules.alertBody('Saffron Lane', 5);
  assert.ok(!/\p{Extended_Pictographic}/u.test(text));
});

// ---- no eyes, faces or human features --------------------------------------------------------

test('no icon, picture or animation shows eyes, faces or people', () => {
  const FORBIDDEN = /^(eye|eyes|face|faces|person|people|user|users|human|head|smile|smiley|avatar|profile|man|woman|child|baby|hand|body|emoji)$/i;
  const icons = app('src/components/icons/paths.js').ICON_SHAPES;
  const bad = Object.keys(icons).filter((name) => FORBIDDEN.test(name));
  assert.deepStrictEqual(bad, [], 'icon names that suggest a person');
  // no icon libraries with ready-made faces or people
  const libraries = [];
  for (const file of appFiles(['.tsx', '.ts'])) {
    const source = fs.readFileSync(file, 'utf8');
    if (/@expo\/vector-icons|expo-symbols|react-native-vector-icons/.test(source)) libraries.push(relative(file));
  }
  assert.deepStrictEqual(libraries, [], 'screens must use our own icon set (src/components/icons)');
});

test('profile pictures are letters on colour, and the drawn shop front has no people', () => {
  const shopFront = fs.readFileSync(path.join(root, 'src', 'components', 'place', 'ShopFront.tsx'), 'utf8');
  assert.ok(/no people/i.test(shopFront));
  assert.ok(!/(<Ellipse|face|eye|person)/i.test(stripComments(shopFront)), 'only shapes of a shop');
  const ring = fs.readFileSync(path.join(root, 'src', 'components', 'influencer', 'ProfileRing.tsx'), 'utf8');
  assert.match(ring, /initial/);
});

// ---- Reduce Motion ---------------------------------------------------------------------------

test('every file that animates also respects Reduce Motion', () => {
  const ANIMATES = /\b(?:withTiming|withRepeat|withDelay|withSequence|withSpring|LayoutAnimation|Animated\.(?:timing|loop|spring|sequence)|itemLayoutAnimation|FadeIn\w*|FadeOut\w*|SlideIn\w*|LinearTransition|setInterval)\b|\b(?:entering|exiting)=|\blayout=\{/;
  const RESPECTS = /useReducedMotion|reduceMotion|usePopIn|useRiseIn|useFanIn|usePinPop|usePing|useListLayout|useTypingPlaceholder|useCountUp/;
  const missing = [];
  for (const file of appFiles(['.tsx', '.ts'])) {
    const name = relative(file);
    const source = stripComments(fs.readFileSync(file, 'utf8'));
    if (ANIMATES.test(source) && !RESPECTS.test(source)) missing.push(name);
  }
  assert.deepStrictEqual(missing, [], 'these files animate without checking Reduce Motion:\n  ' + missing.join('\n  '));
});

test('the short message at the bottom (Toast) does not animate with Reduce Motion', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'components', 'place', 'Toast.tsx'), 'utf8');
  assert.match(source, /useReducedMotion/);
});

// ---- readable colours in both themes ---------------------------------------------------------

const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const mix = (a, b, t = 0.5) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const darken = (hex, amount) => mix(hex, '#000000', amount);

for (const mode of ['light', 'dark']) {
  test(`${mode} theme: every text colour is readable on the backgrounds it is used on`, () => {
    const { lightPalette, darkPalette } = app('constants/Theme.js');
    const p = mode === 'light' ? lightPalette : darkPalette;
    const pairs = [
      ['text on page', p.text, p.bg], ['text on card', p.text, p.surface], ['text on second card', p.text, p.surface2],
      ['soft text on page', p.muted, p.bg], ['soft text on card', p.muted, p.surface], ['soft text on chip', p.muted, p.chip], ['soft text on second card', p.muted, p.surface2],
      ['brand text on page', p.acc, p.bg], ['brand text on card', p.acc, p.surface], ['brand text on chip', p.acc, p.chip],
      ['red text on page', p.red, p.bg], ['red text on card', p.red, p.surface],
      ['white on button', '#FFFFFF', p.btn],
    ];
    const failures = pairs.map(([name, fg, bg]) => ({ name, ratio: contrast(fg, bg) })).filter((x) => x.ratio < 4.5).map((x) => `${x.name}: ${x.ratio.toFixed(2)}`);
    assert.deepStrictEqual(failures, [], 'below 4.5:\n  ' + failures.join('\n  '));
  });
}

test('white text on the coloured badges, cards and tiles is readable', () => {
  const mock = app('src/data/mock.js');
  const folders = app('src/saved/savedData.js').FOLDERS;
  const failures = [];
  const check = (name, bg, need = 4.5) => { const r = contrast('#FFFFFF', bg); if (r < need) failures.push(`${name}: ${r.toFixed(2)} on ${bg}`); };
  // the Spotted Partner badge (both ends of its gradient) and the purple savings card
  check('partner badge start', '#6A1FB0'); check('partner badge end', '#9D4EDD'); check('savings card start', '#9D4EDD');
  // the shimmering NEW badge (every colour in its strip)
  const badgeSource = fs.readFileSync(path.join(root, 'src', 'components', 'NewBadge.tsx'), 'utf8');
  for (const [hex] of badgeSource.match(/'#[0-9A-Fa-f]{6}'/g).map((h) => [h.slice(1, -1)])) check('NEW badge ' + hex, hex);
  // folder tiles: the words sit on the lower part, which has a soft dark fade (read from the code; the words are
  // about 80% of the way down)
  const fade = Number(/rgba\(0,0,0,([\d.]+)\)'\]/.exec(fs.readFileSync(path.join(root, 'src', 'components', 'saved', 'FolderTile.tsx'), 'utf8'))[1]);
  for (const f of folders) check('folder ' + f.name, darken(mix(f.colors[0], f.colors[1], 0.5), fade * 0.8));
  // loyalty cards have a 22% dark shade over the whole card, so even the lightest end is fine
  for (const card of mock.LOYALTY) for (const c of card.gradient) check('loyalty card ' + card.placeId, darken(c, 0.22));
  // Esaad and Fazaa badges (their own text colours)
  for (const [fg, bg] of [['#0B6B43', '#DFF3EA'], ['#1B4F9C', '#E2ECFB'], ['#9FE3C2', '#113D2A'], ['#AFCBF5', '#14284A'], ['#8A3B00', '#FFE9D6'], ['#FFD3AE', '#4A2A12'], ['#B3182A', '#FDE3E6'], ['#FFB3BD', '#4A1520']]) {
    const r = contrast(fg, bg); if (r < 4.5) failures.push(`badge text ${fg} on ${bg}: ${r.toFixed(2)}`);
  }
  assert.deepStrictEqual(failures, [], 'below 4.5:\n  ' + failures.join('\n  '));
});

test('the two-letter logos and initials on bright gradients have a soft shadow so they stay readable', () => {
  const files = ['src/components/PlaceLogo.tsx', 'src/components/PlaceInfoCard.tsx', 'src/components/saved/FolderTile.tsx', 'src/components/home/InfluencerCard.tsx',
    'src/components/influencer/ProfileRing.tsx', 'src/components/influencer/TopCard.tsx', 'src/components/influencer/RecommendationRow.tsx', 'src/components/place/InfluencerRecs.tsx'];
  const without = files.filter((f) => !/MONO_SHADOW/.test(fs.readFileSync(path.join(root, f), 'utf8')));
  assert.deepStrictEqual(without, []);
});

// ---- long lists ------------------------------------------------------------------------------

function manyPlaces(n) {
  const mock = app('src/data/mock.js');
  return Array.from({ length: n }, (_, i) => {
    const base = mock.PLACES[i % mock.PLACES.length];
    return { ...base, id: `${base.id}-${i}`, name: `${base.name} ${i}`, dist: (i % 150) / 10, partner: i % 3 === 0, saved: i % 2 === 0 };
  });
}

test('with 500 places, search, the Explore feed, folders and map pins each take well under a tenth of a second', () => {
  const home = app('src/home/homeData.js');
  const saved = app('src/saved/savedData.js');
  const map = app('src/map/mapData.js');
  const places = manyPlaces(500);
  const ids = new Set(places.filter((p) => p.saved).map((p) => p.id));
  const time = (fn) => { const start = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - start) / 1e6; };
  const results = {
    search: time(() => home.searchHome('indian', home.NO_FILTERS, places)),
    feed: time(() => home.exploreFeed(places, { ...home.NO_FILTERS, infl: true })),
    stories: time(() => home.storiesFor(places, ids)),
    folders: time(() => saved.folderTiles(saved.savedPlaces(ids, places))),
    savedSearch: time(() => saved.visibleSaved(saved.savedPlaces(ids, places), null, 'cafe', home.NO_FILTERS)),
    pins: time(() => map.mapPins(ids, places)),
  };
  for (const [name, ms] of Object.entries(results)) assert.ok(ms < 100, `${name} took ${ms.toFixed(1)} ms`);
  assert.ok(home.exploreFeed(places, home.NO_FILTERS).length > 100, 'the test really had 100+ places');
});

test('the long lists only draw what is on screen, and skip the glide animation when there are many rows', () => {
  for (const screen of ['app/(tabs)/index.tsx', 'app/(tabs)/saved.tsx']) {
    const source = fs.readFileSync(path.join(root, screen), 'utf8');
    assert.match(source, /initialNumToRender=\{\d+\}/, screen);
    assert.ok(Number(/windowSize=\{(\d+)\}/.exec(source)[1]) <= 11, `${screen}: only a few screens' worth of rows are kept`);
    assert.ok(Number(/initialNumToRender=\{(\d+)\}/.exec(source)[1]) <= 12, `${screen}: few rows drawn at first`);
    assert.match(source, /maxToRenderPerBatch=\{\d+\}/, screen);
    assert.match(source, /removeClippedSubviews/, screen);
    assert.match(source, /keyExtractor/, screen);
    assert.match(source, /useListLayout\(rows\.length\)/, screen);
  }
  const motion = fs.readFileSync(path.join(root, 'src', 'components', 'motion.ts'), 'utf8');
  assert.match(motion, /LAYOUT_ANIMATION_MAX = 40/);
  assert.match(motion, /rowCount > LAYOUT_ANIMATION_MAX/);
});

test('a place card is only redrawn when something about it changed', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'components', 'PlaceInfoCard.tsx'), 'utf8');
  assert.match(source, /export const PlaceInfoCard = memo\(/);
});

test('Toast slides up normally and simply appears with Reduce Motion', async () => {
  const { setupReact } = require('./helpers/fakes');
  const { React, mount } = setupReact();
  const seen = { entering: 'unset', reduce: false };
  installFakes({
    'react-native': { StyleSheet: { create: (x) => x }, View: (props) => props.children ?? null },
    'react-native-reanimated': {
      __esModule: true,
      default: { View: (props) => { seen.entering = props.entering; return props.children ?? null; } },
      FadeInDown: { duration: (ms) => ({ fade: ms }) },
      useReducedMotion: () => seen.reduce,
    },
    '@/src/components/ui/ui': { AppText: () => null },
  });
  const { Toast } = app('src/components/place/Toast.js');
  let screen = await mount(React.createElement(Toast, { message: 'Saved to Food' }));
  assert.deepStrictEqual(seen.entering, { fade: 300 });
  await screen.unmount();
  seen.reduce = true;
  screen = await mount(React.createElement(Toast, { message: 'Saved to Food' }));
  assert.equal(seen.entering, undefined);
  await screen.unmount();
});
