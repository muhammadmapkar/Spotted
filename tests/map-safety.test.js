// On Android the Google map CRASHES the whole app without a Google Maps key.
// So the Map tab must never start the real map there; it shows a list instead.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount } = setupReact();

const state = { os: 'android', keyInBuild: false, liveMapStarted: 0, listShown: 0 };
installFakes({
  'react-native': { get Platform() { return { OS: state.os }; } },
  '@/src/components/LiveMap': { LiveMap: () => { state.liveMapStarted++; return null; } }, // stands in for the Google map
  '@/src/components/MapFallback': { MapFallback: () => { state.listShown++; return null; } },
  '@/src/config': { get GOOGLE_MAPS_KEY_IN_BUILD() { return state.keyInBuild; } },
});
const MapScreen = app('app/(tabs)/map.js').default;

async function show(os, keyInBuild) {
  Object.assign(state, { os, keyInBuild, liveMapStarted: 0, listShown: 0 });
  const screen = await mount(React.createElement(MapScreen));
  await screen.unmount();
  return { ...state };
}

test('Android without a key: the Google map is never started, the list is shown', async () => {
  const result = await show('android', false);
  assert.equal(result.liveMapStarted, 0, 'ANDROID WITHOUT A KEY MUST NEVER START THE GOOGLE MAP');
  assert.ok(result.listShown >= 1);
});

test('Android with a key built in: the real map is shown', async () => {
  const result = await show('android', true);
  assert.ok(result.liveMapStarted >= 1);
  assert.equal(result.listShown, 0);
});

test('iPhone: the real map is shown (Apple Maps needs no key)', async () => {
  const result = await show('ios', false);
  assert.ok(result.liveMapStarted >= 1);
  assert.equal(result.listShown, 0);
});
