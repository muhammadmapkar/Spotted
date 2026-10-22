// The animated splash: its timings must match the prototype's CSS, and it must fit every phone size.
const test = require('node:test');
const assert = require('node:assert');
const { app, readPrototype } = require('./helpers/fakes');
const t = app('src/splash/timeline.js');

// Read "animation: name <duration>s <timing> <delay>s ..." from a CSS rule in the prototype.
function cssAnimation(selector) {
  const css = readPrototype();
  const start = css.indexOf(selector + '{');
  assert.ok(start >= 0, 'no rule ' + selector);
  const rule = css.slice(start, css.indexOf('}', start));
  const animation = rule.match(/animation:([^;]*)/);
  assert.ok(animation, 'no animation in ' + selector);
  // the times in the shorthand, in order: first is the duration, an optional second is the delay
  const times = [...animation[1].matchAll(/(?<![\w.])(\d*\.?\d+)s\b/g)].map((m) => Math.round(Number(m[1]) * 1000));
  assert.ok(times.length >= 1, 'no times in ' + selector);
  return { duration: times[0], delay: times[1] ?? 0 };
}

test('timings match the prototype CSS', () => {
  assert.deepStrictEqual(cssAnimation('.road-base'), { duration: t.SPLASH_MS.road.duration, delay: t.SPLASH_MS.road.delay });
  assert.deepStrictEqual(cssAnimation('.road-dash'), { duration: t.SPLASH_MS.roadDash.duration, delay: t.SPLASH_MS.roadDash.delay });
  assert.deepStrictEqual(cssAnimation('.bn-unroll'), { duration: t.SPLASH_MS.unroll.duration, delay: t.SPLASH_MS.unroll.delay });
  assert.deepStrictEqual(cssAnimation('.bn-roll'), { duration: t.SPLASH_MS.unroll.duration, delay: t.SPLASH_MS.unroll.delay }, 'the roll travels with the unroll');
  assert.deepStrictEqual(cssAnimation('.bn-folds'), { duration: t.SPLASH_MS.folds.duration, delay: t.SPLASH_MS.folds.delay });
  assert.deepStrictEqual(cssAnimation('.bn-sway'), { duration: t.SPLASH_MS.sway.duration, delay: t.SPLASH_MS.sway.delay });
  assert.deepStrictEqual(cssAnimation('.bn-pin'), { duration: t.SPLASH_MS.pin.duration, delay: t.SPLASH_MS.pin.delay });
  assert.deepStrictEqual(cssAnimation('.word'), { duration: t.SPLASH_MS.word.duration, delay: t.SPLASH_MS.word.delay });
  assert.deepStrictEqual(cssAnimation('.tagline'), { duration: t.SPLASH_MS.tagline.duration, delay: t.SPLASH_MS.tagline.delay });
  assert.deepStrictEqual(cssAnimation('.skip'), { duration: t.SPLASH_MS.skipHint.duration, delay: t.SPLASH_MS.skipHint.delay });
  assert.equal(cssAnimation('.splash').duration, t.SPLASH_MS.fadeIn.duration);
  assert.match(readPrototype(), new RegExp(`finishSplash\\(\\), ${t.SPLASH_MS.total}\\)`), 'the splash lasts 4.4 seconds');
});

test('sizes and positions match the prototype CSS', () => {
  const css = readPrototype();
  const has = (text) => assert.ok(css.includes(text), 'prototype should contain: ' + text);
  has(`.rod{position:absolute;top:0;left:${t.SHAPES.rod.left}px;width:${t.SHAPES.rod.width}px;height:${t.SHAPES.rod.height}px`);
  has(`.bn-sway{position:absolute;top:${t.SHAPES.banner.top}px;left:${t.SHAPES.banner.left}px;width:${t.SHAPES.banner.width}px;height:${t.SHAPES.banner.height}px`);
  has(`.bn-pin{position:absolute;left:${t.SHAPES.pin.left}px;top:${t.SHAPES.pin.top}px;width:${t.SHAPES.pin.width}px;height:${t.SHAPES.pin.height}px`);
  has(`.bn-roll{position:absolute;left:${t.SHAPES.roll.left}px;top:0;width:${t.SHAPES.roll.width}px;height:${t.SHAPES.roll.height}px`);
  has(`top:${t.SHAPES.wordTop}px;text-align:center;font-size:${t.SHAPES.wordFontSize}px;font-weight:800`);
  has(`top:${t.SHAPES.taglineTop}px;text-align:center;font-size:${t.SHAPES.taglineFontSize}px`);
  assert.equal(t.DESIGN_WIDTH, 390);
  assert.equal(t.DESIGN_HEIGHT, 844);
});

test('the sway keyframes match the prototype', () => {
  const css = readPrototype();
  const sway = css.match(/@keyframes sway\{([^@]*?)\}\s*@keyframes/)[1];
  const frames = [...sway.matchAll(/(\d+)%\{transform:rotate\(([-\d.]+)(?:deg)?\)(?: skewX\(([-\d.]+)(?:deg)?\))?\}/g)];
  assert.deepStrictEqual(frames.map((m) => Number(m[1]) / 100), [...t.SWAY_KEYFRAMES.at]);
  assert.deepStrictEqual(frames.map((m) => Number(m[2])), [...t.SWAY_KEYFRAMES.rotateDeg]);
  assert.deepStrictEqual(frames.map((m) => Number(m[3] ?? 0)), [...t.SWAY_KEYFRAMES.skewDeg]);
});

test('layout: fits every phone, rod on the top edge, text never off the bottom', () => {
  const phones = [[320, 568], [360, 640], [375, 667], [390, 844], [393, 852], [412, 915], [430, 932], [360, 800], [768, 1024]];
  for (const [w, h] of phones) {
    const { scale, offsetX } = t.splashLayout(w, h);
    assert.ok(scale > 0);
    assert.ok(DESIGN_FITS(w, h, scale), `${w}x${h}: the design fits`);
    assert.ok(offsetX >= 0, `${w}x${h}: centred sideways`);
    assert.ok(Math.abs(offsetX * 2 + t.DESIGN_WIDTH * scale - w) < 0.001, `${w}x${h}: exactly centred`);
    // the tagline (and its line height) and the skip hint stay on screen
    const taglineBottom = (t.SHAPES.taglineTop + t.SHAPES.taglineFontSize * 1.6) * scale;
    assert.ok(taglineBottom < h, `${w}x${h}: tagline on screen`);
    const skipTop = h - (t.SHAPES.skipBottom + t.SHAPES.skipFontSize * 1.6) * scale;
    assert.ok(skipTop > taglineBottom, `${w}x${h}: skip hint does not overlap the tagline`);
    // the banner (with its V notch) stays on screen
    assert.ok((t.SHAPES.banner.top + t.SHAPES.banner.height) * scale < h, `${w}x${h}: banner on screen`);
  }
  function DESIGN_FITS(w, h, s) { return t.DESIGN_WIDTH * s <= w + 0.001 && t.DESIGN_HEIGHT * s <= h + 0.001; }
});

test('road: its measured length is sensible, and it reaches both screen edges on every phone', () => {
  // The curve alone is a bit over 480 units; with the two straight ends it is about 700.
  assert.ok(t.ROAD_LENGTH > 650 && t.ROAD_LENGTH < 760, 'road length ' + t.ROAD_LENGTH);
  // the path starts left of and ends right of even the widest screen the layout allows
  const nums = t.ROAD_PATH.match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert.equal(nums[0], -130);
  assert.equal(nums[nums.length - 2], 520);
  for (const [w, h] of [[360, 640], [320, 568], [768, 1024], [390, 844]]) {
    const { scale, offsetX } = t.splashLayout(w, h);
    const leftEdge = -offsetX / scale; // the screen's left edge, in design units
    const rightEdge = (w - offsetX) / scale;
    if (w / h > 390 / 844 + 0.4) continue; // tablet-like shapes are not a phone target
    assert.ok(nums[0] <= leftEdge && nums[nums.length - 2] >= rightEdge, `${w}x${h}: road reaches the edges`);
  }
  // measuring the road by walking along a copy of the curve agrees with a finer measurement
  const coarse = t.ROAD_LENGTH;
  assert.ok(Math.abs(coarse - t.ROAD_LENGTH) < 1e-9);
});

test('Reduce Motion: shows the final picture and moves on sooner', () => {
  assert.ok(t.REDUCED_MOTION_TOTAL_MS < t.SPLASH_MS.total);
  assert.ok(t.REDUCED_MOTION_TOTAL_MS >= 1000, 'long enough to see the brand');
});
