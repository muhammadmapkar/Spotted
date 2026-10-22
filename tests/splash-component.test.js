// The animated splash component: starts each animation at the right moment, finishes once,
// can be skipped with a tap, and shows the final picture at once with Reduce Motion.
// Runs the REAL component with pretend animation/drawing tools (it draws nothing here).
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const rec = { sharedValues: [], delays: [], pressable: null, reduceMotion: false, screen: { width: 390, height: 844 } };
const nothing = () => null;
const passChildren = (props) => props.children ?? null;

installFakes({
  'react-native': {
    Pressable: (props) => { rec.pressable = props; return props.children ?? null; },
    StyleSheet: { create: (x) => x, absoluteFill: {}, flatten: (x) => x },
    useWindowDimensions: () => rec.screen,
  },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: passChildren, createAnimatedComponent: (c) => c },
    Easing: { bezier: () => (t) => t },
    useReducedMotion: () => rec.reduceMotion,
    useSharedValue: (initial) => {
      const record = { _v: initial, animation: null,
        get value() { return this._v; },
        set value(next) { if (next && next.__timing) { this.animation = next; } else this._v = next; } };
      rec.sharedValues.push(record);
      return record;
    },
    useAnimatedStyle: (fn) => fn(), // runs the style code once, so mistakes in it would show up here
    useAnimatedProps: (fn) => fn(),
    withTiming: (to, config) => ({ __timing: true, to, duration: config?.duration, delay: 0 }),
    withDelay: (delay, animation) => { const a = { ...animation, delay }; rec.delays.push({ delay, duration: animation.duration }); return a; },
    interpolate: (x, input, output) => {
      for (let i = 1; i < input.length; i++) if (x <= input[i]) return output[i - 1] + ((x - input[i - 1]) / (input[i] - input[i - 1])) * (output[i] - output[i - 1]);
      return output[output.length - 1];
    },
  },
  'react-native-svg': { __esModule: true, default: nothing, Svg: nothing, Circle: nothing, ClipPath: nothing, Defs: nothing, G: nothing, LinearGradient: nothing, Path: nothing, RadialGradient: nothing, Rect: nothing, Stop: nothing },
  'expo-linear-gradient': { LinearGradient: nothing },
  'expo-status-bar': { StatusBar: nothing },
  '@/components/Themed': { Text: nothing },
  '@/src/theme/fonts': { POPPINS: { extraBold: 'Poppins_800ExtraBold' } },
});
const { AnimatedSplash } = app('src/splash/AnimatedSplash.js');
const { SPLASH_MS, REDUCED_MOTION_TOTAL_MS } = app('src/splash/timeline.js');

async function showSplash(t, { reduce = false } = {}) {
  rec.sharedValues.length = 0; rec.delays.length = 0; rec.reduceMotion = reduce;
  t.mock.timers.enable({ apis: ['setTimeout'] }); // we control the clock
  let finished = 0;
  const screen = await mount(React.createElement(AnimatedSplash, { onFinish: () => { finished++; } }));
  return { screen, finished: () => finished };
}

test('every animation starts at the moment the prototype says', async (t) => {
  const { screen } = await showSplash(t);
  const delays = rec.delays.map((d) => d.delay).sort((a, b) => a - b);
  const expected = Object.entries(SPLASH_MS).filter(([, v]) => typeof v === 'object').map(([, v]) => v.delay).sort((a, b) => a - b);
  assert.deepStrictEqual(delays, expected, 'one animation per step of the timeline, each at its own delay');
  for (const wanted of [250, 900, 2050, 2150, 2600, 2850]) assert.ok(delays.includes(wanted), `something starts at ${wanted} ms`);
  await screen.unmount();
});

test('it finishes once, after 4.4 seconds, and fades out first', async (t) => {
  const { screen, finished } = await showSplash(t);
  t.mock.timers.tick(SPLASH_MS.total - 1);
  assert.equal(finished(), 0, 'still playing just before 4.4 s');
  t.mock.timers.tick(1);
  assert.equal(finished(), 0, 'now fading out');
  t.mock.timers.tick(SPLASH_MS.fadeOut);
  assert.equal(finished(), 1, 'finished');
  t.mock.timers.tick(10000);
  assert.equal(finished(), 1, 'never twice');
  await screen.unmount();
});

test('tapping skips the intro, and the timer afterwards does not finish it a second time', async (t) => {
  const { screen, finished } = await showSplash(t);
  assert.equal(typeof rec.pressable.onPress, 'function', 'the whole screen is tappable');
  assert.equal(rec.pressable.accessibilityRole, 'button');
  assert.match(rec.pressable.accessibilityLabel, /skip/i);
  t.mock.timers.tick(1000);
  rec.pressable.onPress();
  rec.pressable.onPress(); // a double tap
  t.mock.timers.tick(SPLASH_MS.fadeOut);
  assert.equal(finished(), 1, 'skipped, once');
  t.mock.timers.tick(10000);
  assert.equal(finished(), 1, 'the 4.4 s timer does nothing more');
  await screen.unmount();
});

test('Reduce Motion: the final picture at once, nothing animated, finishes sooner', async (t) => {
  const { screen, finished } = await showSplash(t, { reduce: true });
  assert.equal(rec.delays.length, 0, 'no animation is started');
  // Every animation shows its final state (1). The one exception is the fade-OUT, which only runs on leaving.
  assert.ok(rec.sharedValues.every((v) => v.value === 1 || v.value === 0), 'values are plain numbers');
  assert.equal(rec.sharedValues.filter((v) => v.value === 0).length, 1, 'only the leaving fade is still at 0');
  assert.equal(rec.sharedValues.filter((v) => v.value === 1).length, rec.sharedValues.length - 1, 'everything else is already finished');
  t.mock.timers.tick(REDUCED_MOTION_TOTAL_MS);
  t.mock.timers.tick(SPLASH_MS.fadeOut);
  assert.equal(finished(), 1);
  await screen.unmount();
});

test('it draws on small, normal and large phones without errors', async (t) => {
  for (const [width, height] of [[320, 568], [360, 640], [390, 844], [412, 915], [430, 932], [768, 1024]]) {
    rec.screen = { width, height };
    const { screen } = await showSplash(t);
    await screen.unmount();
    t.mock.timers.reset();
  }
  rec.screen = { width: 390, height: 844 };
});
