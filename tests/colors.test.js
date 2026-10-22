// Every text/background colour pair used in the app must be easy to read, in light AND dark mode.
// Reads the real colours from constants/Colors.ts. Thresholds follow WCAG: 4.5 for small text,
// 3 for large bold text and for outlines/icons you tap.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'constants', 'Colors.ts'), 'utf8');
// the named colours at the top of the file, e.g. const purple = '#6A1FB0';
const NAMED = Object.fromEntries([...source.matchAll(/const (\w+) = '(#[0-9A-Fa-f]{6})'/g)].map(([, name, hex]) => [name, hex]));
function colorsFor(mode) {
  const block = new RegExp(`${mode}: \\{([\\s\\S]*?)\\n  \\},`).exec(source)[1];
  const result = {};
  for (const [, key, value] of block.matchAll(/(\w+): ([^,]+),/g)) {
    const v = value.trim();
    result[key] = v.startsWith("'") ? v.slice(1, -1) : NAMED[v];
  }
  return result;
}
const strong = Object.fromEntries(
  [...source.slice(source.indexOf('CategoryColorsStrong')).matchAll(/(food|shopping|fun): ([^,\n]+)/g)].map(([, k, v]) => [k, v.trim().startsWith("'") ? v.trim().slice(1, -1) : NAMED[v.trim()]])
);

const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

for (const mode of ['light', 'dark']) {
  test(`${mode} mode: all text and control colours are readable`, () => {
    const t = colorsFor(mode);
    const pairs = [
      ['body text on page', t.text, t.background, 4.5],
      ['body text on card', t.text, t.card, 4.5],
      ['muted text on page', t.mutedText, t.background, 4.5],
      ['muted text on card', t.mutedText, t.card, 4.5],
      ['brand text on page (links)', t.tintText, t.background, 4.5],
      ['brand text on card (distance)', t.tintText, t.card, 4.5],
      ['danger text on page', t.danger, t.background, 4.5],
      ['danger text on card', t.danger, t.card, 4.5],
      ['white on strong brand (small buttons, banner)', '#FFFFFF', t.tintStrong, 4.5],
      ['white on Food tag/chip', '#FFFFFF', strong.food, 4.5],
      ['white on Shopping tag/chip', '#FFFFFF', strong.shopping, 4.5],
      ['white on Fun tag/chip', '#FFFFFF', strong.fun, 4.5],
      ['white on brand (19px bold buttons)', '#FFFFFF', t.tint, 3],
      ['inactive tab icon on page', t.tabIconDefault, t.background, 3],
      ['outline on page (chips, inputs)', t.outline, t.background, 3],
      ['outline on card', t.outline, t.card, 3],
      ['active tab icon on page', t.tint, t.background, 3],
    ];
    const failures = pairs
      .map(([name, fg, bg, need]) => ({ name, ratio: contrast(fg, bg), need }))
      .filter((p) => !(p.ratio >= p.need))
      .map((p) => `${p.name}: ${p.ratio.toFixed(2)} (needs ${p.need})`);
    assert.deepStrictEqual(failures, [], 'hard to read:\n  ' + failures.join('\n  '));
  });
}
