// A scan of EVERY screen and component: each button (Pressable) must have a role and a name that a screen
// reader can say, and must be at least 44 x 44 (counting the extra tap area from hitSlop).
const test = require('node:test');
const assert = require('node:assert');
const { ts, appFiles, parse, relative, visit } = require('./helpers/scan');

const MIN = 44;
const BUTTONS = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback']);
const TEXTS = new Set(['Text', 'AppText', 'TextInput']);

const tagName = (el) => el.tagName.getText();
const attributes = (el) => el.attributes.properties.filter(ts.isJsxAttribute);
const attr = (el, name) => attributes(el).find((a) => a.name.getText() === name);
const hasSpread = (el) => el.attributes.properties.some(ts.isJsxSpreadAttribute);
// accessible={false} marks a background that screen readers skip on purpose (like the drawn map's empty ground)
const hiddenFromReaders = (el) => {
  const a = attributes(el).find((x) => x.name.getText() === 'accessible');
  return Boolean(a && a.initializer && ts.isJsxExpression(a.initializer) && a.initializer.expression && a.initializer.expression.getText() === 'false');
};
const numberOf = (node) => {
  if (!node) return undefined;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  return undefined;
};

// The numbers written in StyleSheet.create({ name: { width: 44, ... } }) in this file.
function styleSizes(sourceFile) {
  const sizes = {};
  visit(sourceFile, (node) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'StyleSheet.create' && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
      for (const prop of node.arguments[0].properties) {
        if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) continue;
        const entry = {};
        for (const p of prop.initializer.properties) {
          if (ts.isPropertyAssignment(p) && ['width', 'height', 'minWidth', 'minHeight'].includes(p.name.getText())) {
            const n = numberOf(p.initializer);
            if (n !== undefined && n > 0) entry[p.name.getText()] = n; // "minWidth: 0" is not a size
          }
        }
        sizes[prop.name.getText()] = entry;
      }
    }
  });
  return sizes;
}

// Sizes in an inline style object, e.g. style={{ width: 30, height: 30 }}.
function inlineSizes(node) {
  const entry = {};
  visit(node, (n) => {
    if (ts.isObjectLiteralExpression(n)) for (const p of n.properties) {
      if (ts.isPropertyAssignment(p) && ['width', 'height', 'minWidth', 'minHeight'].includes(p.name.getText())) {
        const v = numberOf(p.initializer);
        if (v !== undefined && v > 0) entry[p.name.getText()] = v;
      }
    }
  });
  return entry;
}

function hitSlopExtra(el) {
  const slop = attr(el, 'hitSlop');
  if (!slop || !slop.initializer) return { x: 0, y: 0 };
  const expr = ts.isJsxExpression(slop.initializer) ? slop.initializer.expression : null;
  if (!expr) return { x: 0, y: 0 };
  const all = numberOf(expr);
  if (all !== undefined) return { x: all * 2, y: all * 2 };
  if (ts.isObjectLiteralExpression(expr)) {
    const get = (name) => numberOf(expr.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === name)?.initializer) ?? 0;
    return { x: get('left') + get('right'), y: get('top') + get('bottom') };
  }
  return { x: 0, y: 0 };
}

function hasName(element) {
  if (attr(element, 'accessibilityLabel') || hasSpread(element) || hiddenFromReaders(element)) return true;
  const parent = element.parent;
  if (!ts.isJsxElement(parent)) return false; // self-closing: nothing inside to read
  let found = false;
  visit(parent, (n) => {
    if (ts.isJsxElement(n) && TEXTS.has(tagName(n.openingElement))) found = true;
    if (ts.isJsxSelfClosingElement(n) && TEXTS.has(tagName(n))) found = true;
    if (ts.isJsxText(n) && n.getText().trim()) found = true;
  });
  return found;
}

const buttons = [];
for (const file of appFiles()) {
  const sourceFile = parse(file);
  const sizes = styleSizes(sourceFile);
  visit(sourceFile, (node) => {
    const element = ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node) ? node : null;
    if (!element || !BUTTONS.has(tagName(element))) return;
    const styleAttr = attr(element, 'style');
    const merged = {};
    if (styleAttr) {
      visit(styleAttr, (n) => {
        if (ts.isPropertyAccessExpression(n) && n.expression.getText() === 'styles') Object.assign(merged, sizes[n.name.getText()] ?? {});
      });
      Object.assign(merged, inlineSizes(styleAttr));
    }
    const slop = hitSlopExtra(element);
    buttons.push({
      where: `${relative(file)}:${sourceFile.getLineAndCharacterOfPosition(element.getStart()).line + 1}`,
      role: Boolean(attr(element, 'accessibilityRole')) || hasSpread(element) || hiddenFromReaders(element),
      named: hasName(element),
      height: Math.max(merged.height ?? 0, merged.minHeight ?? 0) + (merged.height || merged.minHeight ? slop.y : 0),
      width: Math.max(merged.width ?? 0, merged.minWidth ?? 0) + (merged.width || merged.minWidth ? slop.x : 0),
      hasHeight: merged.height !== undefined || merged.minHeight !== undefined,
      hasWidth: merged.width !== undefined || merged.minWidth !== undefined,
    });
  });
}

test('the scan really found the buttons of the app', () => {
  assert.ok(buttons.length > 60, `found ${buttons.length} buttons`);
});

test('every button has an accessibility role', () => {
  const missing = buttons.filter((b) => !b.role).map((b) => b.where);
  assert.deepStrictEqual(missing, [], 'buttons with no accessibilityRole:\n  ' + missing.join('\n  '));
});

test('every button has a name a screen reader can say (a label, or readable text inside)', () => {
  const missing = buttons.filter((b) => !b.named).map((b) => b.where);
  assert.deepStrictEqual(missing, [], 'buttons with no name:\n  ' + missing.join('\n  '));
});

test('every button whose size is written in the code is at least 44 x 44 (with its extra tap area)', () => {
  const small = buttons
    .filter((b) => (b.hasHeight && b.height < MIN) || (b.hasWidth && b.width < MIN))
    .map((b) => `${b.where} (${b.width || '?'} x ${b.height || '?'})`);
  assert.deepStrictEqual(small, [], 'buttons smaller than 44 x 44:\n  ' + small.join('\n  '));
});

test('every on/off switch has a name (TapSwitch needs a non-empty label)', () => {
  const problems = [];
  let count = 0;
  for (const file of appFiles()) {
    const sourceFile = parse(file);
    visit(sourceFile, (node) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && tagName(node) === 'TapSwitch') {
        count++;
        const label = attr(node, 'label');
        const text = label && label.initializer ? label.initializer.getText() : '';
        if (!label || /^(\{?\s*(''|""|``)\s*\}?|"")$/.test(text)) problems.push(`${relative(file)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
      }
    });
    // the phone's own Switch is only allowed inside TapSwitch (it is too small to tap on its own)
    if (!file.endsWith('TapSwitch.tsx') && /<Switch\b/.test(sourceFile.getFullText())) problems.push(relative(file) + ' uses the small Switch directly');
  }
  assert.ok(count >= 4, `found ${count} switches`);
  assert.deepStrictEqual(problems, []);
});
