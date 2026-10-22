// The Spotted design foundation: palettes, font mapping. Compared against the prototype's own CSS.
const test = require('node:test');
const assert = require('node:assert');
const { app, readPrototype } = require('./helpers/fakes');
const { lightPalette, darkPalette } = app('constants/Theme.js');
const { fontFamilyFor, POPPINS } = app('src/theme/fonts.js');

// Read the CSS variables out of a rule like  .ph{--bg:#F6F2FB;--surface:#FFFFFF;...}
function cssVars(selector) {
  const css = readPrototype();
  const start = css.indexOf(selector + '{--bg');
  assert.ok(start >= 0, 'could not find ' + selector + ' in the prototype');
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):([^;}]+)/g)].map(([, k, v]) => [k, v.trim()]));
}
const KEY_FOR = {
  bg: 'bg', surface: 'surface', surface2: 'surface2', text: 'text', muted: 'muted', line: 'line', brand: 'brand', btn: 'btn',
  acc: 'acc', red: 'red', chip: 'chip', navbg: 'navBg', 'map-land': 'mapLand', 'map-road': 'mapRoad', 'map-minor': 'mapMinor',
  'map-water': 'mapWater', 'map-park': 'mapPark',
};
const hexOf = (r, g, b) => '#' + [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase();

for (const [name, palette, selector] of [['light', lightPalette, '.ph'], ['dark', darkPalette, '.ph.dark']]) {
  test(`${name} palette matches the prototype exactly`, () => {
    const vars = cssVars(selector);
    for (const [cssName, key] of Object.entries(KEY_FOR)) {
      assert.ok(vars[cssName] !== undefined, `prototype has no --${cssName}`);
      assert.equal(String(palette[key]).toLowerCase(), vars[cssName].toLowerCase(), `${name}: ${key} should match --${cssName}`);
    }
    // the shadow: "0 6px 20px rgba(60,20,110,.10)"
    const [, r, g, b, a] = vars.shadow.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    assert.equal(palette.shadowColor.toUpperCase(), hexOf(r, g, b), `${name}: shadow colour`);
    assert.equal(palette.shadowOpacity, Number(a), `${name}: shadow strength`);
  });
}

test('the palettes have the same set of colours (a screen never finds one missing)', () => {
  assert.deepStrictEqual(Object.keys(lightPalette).sort(), Object.keys(darkPalette).sort());
});

// Readable text, using the same measure as the older colour test (WCAG: 4.5 for small text).
const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

for (const [name, p] of [['light', lightPalette], ['dark', darkPalette]]) {
  test(`${name} palette: text and buttons are readable`, () => {
    const pairs = [
      ['text on page', p.text, p.bg, 4.5], ['text on card', p.text, p.surface, 4.5],
      ['muted text on page', p.muted, p.bg, 4.5], ['muted text on card', p.muted, p.surface, 4.5],
      ['brand text on page', p.brand, p.bg, 4.5], ['accent text on chip', p.acc, p.chip, 4.5],
      ['accent text on card', p.acc, p.surface, 4.5], ['white on button', '#FFFFFF', p.btn, 4.5],
      ['red mark on card', p.red, p.surface, 3],
    ];
    const bad = pairs.map(([n, fg, bg, need]) => ({ n, r: contrast(fg, bg), need })).filter((x) => !(x.r >= x.need)).map((x) => `${x.n}: ${x.r.toFixed(2)} (needs ${x.need})`);
    assert.deepStrictEqual(bad, []);
  });
}

test('font weights map to the right Poppins font', () => {
  assert.equal(fontFamilyFor(undefined), POPPINS.regular);
  assert.equal(fontFamilyFor('normal'), POPPINS.regular);
  assert.equal(fontFamilyFor('400'), POPPINS.regular);
  assert.equal(fontFamilyFor(500), POPPINS.medium);
  assert.equal(fontFamilyFor('600'), POPPINS.semiBold);
  assert.equal(fontFamilyFor('bold'), POPPINS.bold);
  assert.equal(fontFamilyFor('700'), POPPINS.bold);
  assert.equal(fontFamilyFor('800'), POPPINS.extraBold);
  assert.equal(fontFamilyFor('900'), POPPINS.extraBold);
  assert.deepStrictEqual(Object.values(POPPINS).sort(), ['Poppins_400Regular', 'Poppins_500Medium', 'Poppins_600SemiBold', 'Poppins_700Bold', 'Poppins_800ExtraBold']);
});
