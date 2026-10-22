// The Spotted icon set: every icon the design needs exists and is made of valid shapes.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');
const { ICON_SHAPES } = app('src/components/icons/paths.js');

const REQUIRED = ['pin', 'menu', 'search', 'sliders', 'bookmark', 'map', 'home', 'sparkle', 'back', 'close', 'chevron', 'play',
  'camera', 'music', 'video', 'tag', 'star', 'chat', 'bell', 'check', 'moon', 'sun'];

test('every icon the design asks for is there', () => {
  for (const name of REQUIRED) assert.ok(ICON_SHAPES[name], `missing icon: ${name}`);
  assert.deepStrictEqual(Object.keys(ICON_SHAPES).sort(), [...REQUIRED].sort(), 'no unexpected extra icons');
});

test('every icon is made of valid shapes', () => {
  for (const [name, shapes] of Object.entries(ICON_SHAPES)) {
    assert.ok(shapes.length > 0, name + ' has no shapes');
    for (const shape of shapes) {
      if (shape.type === 'path') assert.match(shape.d, /^[MmLlHhVvCcSsQqTtAaZz0-9\s.,-]+$/, `${name}: odd path`);
      else if (shape.type === 'circle') assert.ok([shape.cx, shape.cy, shape.r].every(Number.isFinite) && shape.r > 0, name + ' circle');
      else if (shape.type === 'rect') assert.ok([shape.x, shape.y, shape.width, shape.height, shape.rx].every(Number.isFinite), name + ' rect');
      else assert.fail(`${name}: unknown shape ${shape.type}`);
    }
  }
});

test('the project rule: no icon is named after eyes, faces or people', () => {
  for (const name of Object.keys(ICON_SHAPES)) assert.doesNotMatch(name, /eye|face|person|user|smile|head|human/i);
});
