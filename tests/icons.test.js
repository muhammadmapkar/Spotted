// The app icon and splash images: right size, brand coral, and see-through where they must be.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const dir = path.join(__dirname, '..', 'assets', 'images');
function pixel(file, x, y) {
  const buffer = fs.readFileSync(path.join(dir, file));
  let offset = 8, width = 0, height = 0;
  const parts = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') { width = buffer.readUInt32BE(offset + 8); height = buffer.readUInt32BE(offset + 12); }
    if (type === 'IDAT') parts.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const i = y * (width * 4 + 1) + 1 + x * 4;
  return { width, height, rgba: [...raw.subarray(i, i + 4)] };
}
const CORAL = [232, 80, 91, 255];

test('app icon: solid coral square with the pin (iPhone needs no see-through)', () => {
  const corner = pixel('icon.png', 5, 5);
  assert.equal(corner.width, 1024);
  assert.deepStrictEqual(corner.rgba, CORAL);
  assert.deepStrictEqual(pixel('icon.png', 512, 650).rgba, [255, 255, 255, 255], 'white pin');
});

test('splash image: coral pin, see-through background and hole', () => {
  assert.deepStrictEqual(pixel('splash-icon.png', 512, 650).rgba, CORAL);
  assert.equal(pixel('splash-icon.png', 5, 5).rgba[3], 0, 'corner is see-through');
  assert.equal(pixel('splash-icon.png', 512, 432).rgba[3], 0, 'the hole is see-through');
});

test('Android icon layers: white pin front, coral back, one-colour themed version', () => {
  assert.deepStrictEqual(pixel('android-icon-foreground.png', 512, 650).rgba, [255, 255, 255, 255]);
  assert.equal(pixel('android-icon-foreground.png', 5, 5).rgba[3], 0);
  assert.deepStrictEqual(pixel('android-icon-background.png', 512, 512).rgba, CORAL);
  assert.deepStrictEqual(pixel('android-icon-monochrome.png', 512, 650).rgba, [0, 0, 0, 255]);
  assert.equal(pixel('android-icon-monochrome.png', 5, 5).rgba[3], 0);
});
