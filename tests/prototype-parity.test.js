// Final comparison with the design prototype: sizes, corner radius, spacing, animation timing and the dark-mode
// colours are read from the prototype's CSS and compared with the numbers in our code.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { readPrototype } = require('./helpers/fakes');
const { root } = require('./helpers/scan');

const html = readPrototype();
const css = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// the declarations of the first rule that starts with this selector, e.g. rule('.cta') -> "display:flex;height:56px;..."
function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp('(?:^|[}\\n])\\s*' + escaped + '\\s*\\{([^}]*)\\}', 'm').exec(css);
  assert.ok(match, `prototype CSS has a rule for ${selector}`);
  return match[1];
}
const px = (selector, property) => {
  const match = new RegExp('(?:^|[;\\s])' + property + '\\s*:\\s*(-?[\\d.]+)(?:px|s)?', '').exec(rule(selector));
  assert.ok(match, `${selector} has ${property}`);
  return Number(match[1]);
};
const seconds = (selector) => {
  const match = /animation:\s*[\w-]+\s+([\d.]+)s/.exec(rule(selector));
  assert.ok(match, `${selector} has an animation`);
  return Math.round(Number(match[1]) * 1000);
};
// a number written in our code, e.g. ours('src/x.tsx', /height: (\d+)/)
const ours = (file, pattern) => {
  const match = pattern.exec(read(file));
  assert.ok(match, `${file} matches ${pattern}`);
  return Number(match[1]);
};

const CHECKS = [
  // [label, prototype value, our value]
  ['filter sheet button height', px('.cta', 'height'), () => ours('src/components/filters/FilterSheet.tsx', /cta: \{[^}]*height: (\d+)/)],
  ['filter sheet button radius', px('.cta', 'border-radius'), () => ours('src/components/filters/FilterSheet.tsx', /cta: \{[^}]*borderRadius: (\d+)/)],
  ['folder tile height', px('.tile', 'height'), () => ours('src/components/saved/FolderTile.tsx', /tile: \{ height: (\d+)/)],
  ['folder tile radius', px('.tile', 'border-radius'), () => ours('src/components/saved/FolderTile.tsx', /tile: \{[^}]*borderRadius: (\d+)/)],
  ['folder tile padding', px('.tile', 'padding'), () => ours('src/components/saved/FolderTile.tsx', /tile: \{[^}]*padding: (\d+)/)],
  ['folder tile pop-in (ms)', seconds('.tile'), () => ours('src/components/saved/FolderTile.tsx', /usePopIn\(tile\.delay, (\d+)\)/)],
  ['small logo size on a folder tile', px('.mini', 'width'), () => ours('src/components/saved/FolderTile.tsx', /mini: \{\s*width: (\d+)/)],
  ['small logo overlap', Math.abs(px('.mini', 'margin-right')), () => -ours('src/components/saved/FolderTile.tsx', /marginRight: (-\d+)/)],
  ['top 7 card width', px('.top7', 'width'), () => ours('src/components/influencer/TopCard.tsx', /TOP_CARD_WIDTH = (\d+)/)],
  ['top 7 card radius', px('.top7', 'border-radius'), () => ours('src/components/influencer/TopCard.tsx', /card: \{[^}]*borderRadius: (\d+)/)],
  ['top 7 fan-in (ms)', seconds('.top7'), () => ours('src/components/motion.ts', /useFanIn[\s\S]*?duration: (\d+)/)],
  ['offer card width', px('.oc', 'width'), () => ours('src/components/newin/OfferCard.tsx', /OFFER_CARD_WIDTH = (\d+)/)],
  ['offer card radius', px('.oc', 'border-radius'), () => ours('src/components/newin/OfferCard.tsx', /card: \{[^}]*borderRadius: (\d+)/)],
  ['offer card picture height', px('.oc-top', 'height'), () => ours('src/components/newin/OfferCard.tsx', /top: \{ height: (\d+)/)],
  ['new influencer tile width', px('.ic', 'width'), () => ours('src/components/newin/NewInfluencerCircle.tsx', /tile: \{ width: (\d+)/)],
  ['new influencer tile radius', px('.ic', 'border-radius'), () => ours('src/components/newin/NewInfluencerCircle.tsx', /tile: \{[^}]*borderRadius: (\d+)/)],
  ['loyalty card width', px('.lc', 'width'), () => ours('src/components/profile/LoyaltyCardView.tsx', /LOYALTY_CARD_WIDTH = (\d+)/)],
  ['loyalty card radius', px('.lc', 'border-radius'), () => ours('src/components/profile/LoyaltyCardView.tsx', /card: \{[^}]*borderRadius: (\d+)/)],
  ['loyalty card padding', px('.lc', 'padding'), () => ours('src/components/profile/LoyaltyCardView.tsx', /card: \{[^}]*padding: (\d+)/)],
  ['stamp gap', px('.stamps', 'gap'), () => ours('src/components/profile/LoyaltyCardView.tsx', /stamps: \{[^}]*gap: (\d+)/)],
  ['stamp press-in (ms)', seconds('.stp.on'), () => ours('src/components/profile/LoyaltyCardView.tsx', /duration: (450)/)],
  ['savings card radius', px('.save-card', 'border-radius'), () => ours('src/components/profile/SavingsCard.tsx', /card: \{[^}]*borderRadius: (\d+)/)],
  ['savings card padding', px('.save-card', 'padding'), () => ours('src/components/profile/SavingsCard.tsx', /card: \{[^}]*padding: (\d+)/)],
  ['coin size', px('.coin', 'width'), () => ours('src/components/profile/SavingsCard.tsx', /coin: \{[^}]*width: (\d+)/)],
  ['coin flight (ms)', seconds('.coin'), () => ours('src/components/profile/SavingsCard.tsx', /duration: (1400)/)],
  ['place page picture height', px('.hero', 'height'), () => ours('src/components/place/PlaceHero.tsx', /HERO_HEIGHT = (\d+)/)],
  ['place page picture zoom-out (ms)', seconds('.hero-in'), () => ours('src/components/place/PlaceHero.tsx', /duration: (\d+), easing: Easing\.out/)],
  ['back button size', px('.back', 'width'), () => ours('src/components/place/PlaceHero.tsx', /back: \{[^}]*width: (\d+)/)],
  ['action button height', px('.act', 'height'), () => ours('src/components/place/ActionRow.tsx', /action: \{[^}]*height: (\d+)/)],
  ['action button radius', px('.act', 'border-radius'), () => ours('src/components/place/ActionRow.tsx', /action: \{[^}]*borderRadius: (\d+)/)],
  ['bookmark button width', px('.act.save', 'width'), () => ours('src/components/place/ActionRow.tsx', /save: \{[^}]*width: (\d+)/)],
  ['dropdown header radius', px('.dd-h', 'border-radius'), () => ours('src/components/place/Dropdown.tsx', /header: \{[^}]*borderRadius: (\d+)/)],
  ['dropdown header padding', px('.dd-h', 'padding'), () => ours('src/components/place/Dropdown.tsx', /header: \{[^}]*padding: (\d+)/)],
  ['dropdown opening (ms)', Math.round(0.4 * 1000), () => ours('src/components/place/Dropdown.tsx', /duration: (\d+), easing/)],
  ['count badge height', px('.cnt', 'height'), () => ours('src/components/place/Dropdown.tsx', /count: \{[^}]*height: (\d+)/)],
  ['influencer picture size', px('.av', 'width'), () => ours('src/components/place/InfluencerRecs.tsx', /avatar: \{ width: (\d+)/)],
  ['reel button size', px('.reel', 'width'), () => ours('src/components/place/InfluencerRecs.tsx', /reel: \{ width: (\d+)/)],
  ['reel button radius', px('.reel', 'border-radius'), () => ours('src/components/place/InfluencerRecs.tsx', /reel: \{[^}]*borderRadius: (\d+)/)],
  ['profile ring size', px('.prof-ring', 'width'), () => ours('src/components/influencer/ProfileRing.tsx', /RING = (\d+)/)],
  ['profile ring thickness', px('.prof-ring', 'padding'), () => ours('src/components/influencer/ProfileRing.tsx', /BORDER = (\d+)/)],
  ['platform button height', px('.ptile', 'height'), () => ours('src/components/influencer/PlatformTile.tsx', /tile: \{[^}]*height: (\d+)/)],
  ['platform button radius', px('.ptile', 'border-radius'), () => ours('src/components/influencer/PlatformTile.tsx', /tile: \{[^}]*borderRadius: (\d+)/)],
  ['platform button pop (ms)', seconds('.ptile'), () => ours('src/components/influencer/PlatformTile.tsx', /usePopIn\(delay, (\d+)\)/)],
  ['map pin box width', px('.mpin', 'width'), () => ours('src/components/map/PinShape.tsx', /PIN_WIDTH = (\d+)/)],
  ['map pin box height', px('.mpin', 'height'), () => ours('src/components/map/PinShape.tsx', /PIN_HEIGHT = (\d+)/)],
  ['map pin drop (ms)', seconds('.mpin'), () => ours('src/components/motion.ts', /usePinPop[\s\S]*?duration: (\d+)/)],
  ['blue dot size', px('.me-dot', 'width'), () => ours('src/components/map/UserDot.tsx', /USER_DOT = (\d+)/)],
  ['blue dot pulse (ms)', Math.round(1.8 * 1000), () => ours('src/components/motion.ts', /usePing[\s\S]*?duration: (\d+)/)],
  ['map card radius', px('.map-card', 'border-radius'), () => ours('src/components/map/MapPlaceCard.tsx', /card: \{[^}]*borderRadius: (\d+)/)],
  ['map card side space', px('.map-card', 'left'), () => ours('src/components/map/MapPlaceCard.tsx', /card: \{[^}]*left: (\d+)/)],
  ['map card padding', px('.map-card', 'padding'), () => ours('src/components/map/MapPlaceCard.tsx', /card: \{[^}]*padding: (\d+)/)],
  ['alert banner radius', px('.notif', 'border-radius'), () => ours('src/components/alerts/AlertBanner.tsx', /banner: \{[^}]*borderRadius: (\d+)/)],
  ['alert banner slide (ms)', seconds('.notif'), () => ours('src/components/alerts/AlertBanner.tsx', /duration: (\d+), easing/)],
  ['alert banner icon size', px('.appic', 'width'), () => ours('src/components/alerts/AlertBanner.tsx', /icon: \{ width: (\d+)/)],
  ['alert banner icon radius', px('.appic', 'border-radius'), () => ours('src/components/alerts/AlertBanner.tsx', /icon: \{[^}]*borderRadius: (\d+)/)],
  ['menu sheet corner radius', 28, () => ours('src/components/place/MenuSheet.tsx', /sheet: \{[^}]*borderTopLeftRadius: (\d+)/)],
  ['paper menu radius', px('.pdf', 'border-radius'), () => ours('src/components/place/MenuSheet.tsx', /paper: \{[^}]*borderRadius: (\d+)/)],
  ['close button size', px('.x', 'width'), () => ours('src/components/place/MenuSheet.tsx', /close: \{ width: (\d+)/)],
  ['shimmer badge speed (ms)', seconds('.badge.new'), () => ours('src/components/NewBadge.tsx', /duration: (\d+), easing/)],
];

for (const [label, expected, actual] of CHECKS) {
  test(`prototype: ${label}`, () => {
    assert.equal(actual(), expected);
  });
}

// ---- text sizes and weights ------------------------------------------------------------------

test('page titles (Saved, New in, the place name) use the prototype heading: 700 weight, tight letters', () => {
  assert.equal(px('.h1', 'font-weight'), 700);
  assert.equal(px('.h1', 'letter-spacing'), -0.3);
  assert.equal(px('.h1', 'font-size'), 26);
  for (const [file, size] of [['app/(tabs)/saved.tsx', 26], ['app/(tabs)/new.tsx', 26], ['app/venue/[id].tsx', 24]]) {
    assert.match(read(file), new RegExp(`weight="700" size=\\{${size}\\} style=\\{\\{ letterSpacing: -0\\.3 \\}\\} accessibilityRole="header"`), file);
  }
});

test('section headings use the prototype h2: 17 px, 700 weight', () => {
  assert.equal(px('.h2', 'font-size'), 17);
  assert.equal(px('.h2', 'font-weight'), 700);
  for (const file of ['app/(tabs)/new.tsx', 'app/(tabs)/profile.tsx', 'app/influencer/[id].tsx']) assert.match(read(file), /weight="700" size=\{17\}/, file);
});

test('card names use the prototype card name: 15 px, 700 weight', () => {
  assert.equal(px('.card-name', 'font-size'), 15);
  assert.equal(px('.card-name', 'font-weight'), 700);
  assert.match(read('src/components/PlaceInfoCard.tsx'), /weight="700" size=\{15\} numberOfLines=\{1\}/);
});

// ---- dark mode -------------------------------------------------------------------------------

test('every colour the prototype uses only in dark mode is also used in our code', () => {
  const darkRules = [...css.matchAll(/\.ph\.dark[^{]*\{([^}]*)\}/g)].map((m) => m[1]);
  const darkColours = new Set(darkRules.flatMap((body) => body.match(/#[0-9A-Fa-f]{6}\b/g) ?? []).map((h) => h.toUpperCase()));
  assert.ok(darkColours.size > 15, 'the prototype has dark-mode colours to check');
  const code = ['src', 'app', 'constants', 'components'].map((dir) => {
    const found = [];
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.tsx?$/.test(e.name)) found.push(fs.readFileSync(f, 'utf8')); } };
    if (fs.existsSync(path.join(root, dir))) walk(path.join(root, dir));
    return found.join('\n');
  }).join('\n').toUpperCase();
  const missing = [...darkColours].filter((hex) => !code.includes(hex));
  assert.deepStrictEqual(missing, [], 'prototype dark-mode colours never used:\n  ' + missing.join(', '));
});

test('the palettes are the prototype palettes, exactly (light and dark)', () => {
  const { lightPalette, darkPalette } = require(path.join(root, '.test-build', 'constants', 'Theme.js'));
  const variables = (body) => Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+)/g)].map(([, k, v]) => [k, v.trim()]));
  const light = variables(rule('.ph'));
  const dark = variables(rule('.ph.dark'));
  const map = { bg: 'bg', surface: 'surface', surface2: 'surface2', text: 'text', muted: 'muted', line: 'line', brand: 'brand', btn: 'btn', acc: 'acc', red: 'red', chip: 'chip' };
  for (const [ours, theirs] of Object.entries(map)) {
    assert.equal(lightPalette[ours].toUpperCase(), light[theirs].toUpperCase(), `light ${ours}`);
    assert.equal(darkPalette[ours].toUpperCase(), dark[theirs].toUpperCase(), `dark ${ours}`);
  }
});
