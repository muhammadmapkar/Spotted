// Draws Spotted's app icon and splash images (a location pin) into assets/images/.
// Run it with:  node scripts/make-icons.js
// It needs nothing installed: it draws the pin with maths and saves PNG files.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CORAL = [232, 80, 91]; // #E8505B
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// ---- the pin shape (in a box from -0.5 to 0.5, centre at 0,0) ----
// A circle on top, narrowing to a point at the bottom, with a round hole in the middle.
const CIRCLE = { x: 0, y: -0.1, r: 0.3 }; // the round head of the pin
const TIP = { x: 0, y: 0.4 }; // the point at the bottom
const HOLE_R = 0.115; // the hole in the middle of the head

// Where the straight sides of the pin touch the round head.
const d = TIP.y - CIRCLE.y;
const theta = Math.acos(CIRCLE.r / d);
const T1 = { x: CIRCLE.x + CIRCLE.r * Math.sin(theta), y: CIRCLE.y + CIRCLE.r * Math.cos(theta) };
const T2 = { x: CIRCLE.x - CIRCLE.r * Math.sin(theta), y: T1.y };

// Distance from a point to the pin's edge (negative = inside the pin).
function distCircle(px, py, c, r) {
  return Math.hypot(px - c.x, py - c.y) - r;
}
function distTriangle(px, py, a, b, c) {
  // signed distance to a triangle
  const e = [[b.x - a.x, b.y - a.y], [c.x - b.x, c.y - b.y], [a.x - c.x, a.y - c.y]];
  const v = [[px - a.x, py - a.y], [px - b.x, py - b.y], [px - c.x, py - c.y]];
  let minD = Infinity;
  for (let i = 0; i < 3; i++) {
    const t = Math.max(0, Math.min(1, (v[i][0] * e[i][0] + v[i][1] * e[i][1]) / (e[i][0] ** 2 + e[i][1] ** 2)));
    minD = Math.min(minD, Math.hypot(v[i][0] - e[i][0] * t, v[i][1] - e[i][1] * t));
  }
  const s = Math.sign(e[0][0] * e[2][1] - e[0][1] * e[2][0]);
  const cross = (i) => s * (v[i][0] * e[i][1] - v[i][1] * e[i][0]);
  const inside = cross(0) > 0 && cross(1) > 0 && cross(2) > 0;
  return inside ? -minD : minD;
}
function distPin(px, py) {
  return Math.min(distCircle(px, py, CIRCLE, CIRCLE.r), distTriangle(px, py, TIP, T1, T2));
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---- drawing an image ----
// bg: a colour, or null for a see-through background.
// pin: the colour of the pin. holeShowsBackground: true = the hole is see-through / shows the background.
// pinHeight: how tall the pin is, as a fraction of the image.
function draw({ size, bg, pin, pinHeight, holeColor }) {
  const pixels = Buffer.alloc(size * size * 4);
  const pinTotalHeight = TIP.y - (CIRCLE.y - CIRCLE.r); // pin height in the pin's own units
  const scale = pinHeight / pinTotalHeight; // pin units -> image fraction
  const centerY = (TIP.y + (CIRCLE.y - CIRCLE.r)) / 2; // so the pin is centred up-and-down
  const px = 1 / (size * scale); // size of one image pixel in pin units (for smooth edges)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ux = ((x + 0.5) / size - 0.5) / scale; // this pixel, in pin units
      const uy = ((y + 0.5) / size - 0.5) / scale + centerY;

      const inPin = clamp01(0.5 - distPin(ux, uy) / px); // 1 inside the pin, 0 outside, smooth at the edge
      const hole = clamp01(0.5 - (Math.hypot(ux - CIRCLE.x, uy - CIRCLE.y) - HOLE_R) / px); // 1 inside the hole
      const pinOnly = inPin * (1 - hole); // pin without the hole

      // Mix the layers: background, then the pin, then the hole colour.
      let r = 0, g = 0, b = 0, a = 0;
      const layer = (color, alpha) => {
        if (alpha <= 0) return;
        const outA = alpha + a * (1 - alpha);
        r = (color[0] * alpha + r * a * (1 - alpha)) / outA;
        g = (color[1] * alpha + g * a * (1 - alpha)) / outA;
        b = (color[2] * alpha + b * a * (1 - alpha)) / outA;
        a = outA;
      };
      if (bg) layer(bg, 1);
      layer(pin, pinOnly);
      if (holeColor) layer(holeColor, inPin * hole); // otherwise the hole stays see-through
      const i = (y * size + x) * 4;
      pixels[i] = Math.round(r);
      pixels[i + 1] = Math.round(g);
      pixels[i + 2] = Math.round(b);
      pixels[i + 3] = Math.round(a * 255);
    }
  }
  return pixels;
}

// ---- saving a PNG file (no libraries needed) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function savePng(file, size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits per colour
  header[9] = 6; // RGBA
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0; // no filter
    pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log('saved', path.relative(process.cwd(), file), `${size}x${size}`);
}

const out = path.join(__dirname, '..', 'assets', 'images');
const S = 1024;

// 1. The main app icon: white pin on a coral square (iPhone needs a solid square, no see-through).
savePng(path.join(out, 'icon.png'), S, draw({ size: S, bg: CORAL, pin: WHITE, pinHeight: 0.62, holeColor: CORAL }));

// 2. Android adaptive icon, front layer: white pin, see-through around it, kept inside the "safe" middle.
savePng(path.join(out, 'android-icon-foreground.png'), S, draw({ size: S, bg: null, pin: WHITE, pinHeight: 0.5, holeColor: null }));

// 3. Android adaptive icon, back layer: plain coral.
savePng(path.join(out, 'android-icon-background.png'), S, draw({ size: S, bg: CORAL, pin: CORAL, pinHeight: 0.0001, holeColor: null }));

// 4. Android "themed icon" version: just the pin shape in one colour (Android recolours it).
savePng(path.join(out, 'android-icon-monochrome.png'), S, draw({ size: S, bg: null, pin: BLACK, pinHeight: 0.5, holeColor: null }));

// 5. Splash screen: coral pin, see-through around it (the background colour is set in app.json).
savePng(path.join(out, 'splash-icon.png'), S, draw({ size: S, bg: null, pin: CORAL, pinHeight: 0.62, holeColor: null }));

// 6. Small browser icon.
savePng(path.join(out, 'favicon.png'), 64, draw({ size: 64, bg: CORAL, pin: WHITE, pinHeight: 0.62, holeColor: CORAL }));
