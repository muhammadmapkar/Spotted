// The glide animation for results that reshuffle when a filter changes.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount } = setupReact();

const rec = { reduce: false };
installFakes({
  'react-native-reanimated': {
    __esModule: true,
    default: {},
    Easing: {},
    LinearTransition: { duration: (ms) => ({ kind: 'linear', ms }) },
    useReducedMotion: () => rec.reduce,
    useSharedValue: (v) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: () => 0,
    withDelay: () => 0,
  },
});
const { useListLayout } = app('src/components/motion.js');

async function layoutNow() {
  let layout;
  const screen = await mount(React.createElement(function Probe() { layout = useListLayout(); return null; }));
  await screen.unmount();
  return layout;
}

test('results glide to their new places over 0.3 s', async () => {
  assert.deepStrictEqual(await layoutNow(), { kind: 'linear', ms: 300 });
});

test('with Reduce Motion the results simply jump', async () => {
  rec.reduce = true;
  assert.equal(await layoutNow(), undefined);
  rec.reduce = false;
});
