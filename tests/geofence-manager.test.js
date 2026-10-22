// The reminder watcher component: keeps watched places in sync, and opens a place when a
// reminder is tapped. Runs the REAL component in React.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act, wait } = setupReact();

const log = { push: [], syncs: 0, appStateHandlers: [] };
let receiveResponse; // lets a test "tap a notification"

installFakes({
  'expo-router': { useRouter: () => ({ push: (target) => log.push.push(target) }) },
  'react-native': { AppState: { addEventListener: (_type, handler) => { log.appStateHandlers.push(handler); return { remove() {} }; } } },
  'expo-notifications': {
    useLastNotificationResponse: () => {
      const [response, setResponse] = React.useState(undefined);
      receiveResponse = setResponse;
      return response;
    },
  },
  './sync': { syncGeofencing: async () => { log.syncs++; } }, // count how often the watcher asks for a sync
});
const changes = app('src/db/changes.js'); // the real "something changed" announcer
const { GeofenceManager } = app('src/geofence/GeofenceManager.js');
const tap = (id, placeId) => ({ notification: { request: { identifier: id, content: { data: { placeId } } } } });

test('syncs when the app opens, after changes (once per burst), and when you come back', async () => {
  const screen = await mount(React.createElement(GeofenceManager));
  assert.equal(log.syncs, 1, 'syncs once when the app opens');

  changes.emitDataChanged();
  changes.emitDataChanged();
  changes.emitDataChanged();
  await wait(200);
  assert.equal(log.syncs, 1, 'waits a moment before syncing');
  await wait(1200);
  assert.equal(log.syncs, 2, 'a burst of three changes causes just one sync');

  log.appStateHandlers[0]('background');
  assert.equal(log.syncs, 2, 'going to the background does not sync');
  log.appStateHandlers[0]('active');
  await wait(50);
  assert.equal(log.syncs, 3, 'coming back to the app syncs');

  await screen.unmount();
  changes.emitDataChanged();
  await wait(1200);
  assert.equal(log.syncs, 3, 'stops listening after the app closes');
});

test('tapping a reminder opens that place, once; bad notifications are ignored', async () => {
  log.push.length = 0;
  const screen = await mount(React.createElement(GeofenceManager));

  await act(async () => { receiveResponse(tap('n1', 'place-123')); });
  await wait(500);
  assert.deepStrictEqual(log.push, ['/place/place-123']);

  await act(async () => { receiveResponse(tap('n1', 'place-123')); }); // the same tap again
  await wait(500);
  assert.equal(log.push.length, 1, 'never opens twice for one tap');

  await act(async () => { receiveResponse(tap('n2', 'place-456')); });
  await wait(500);
  assert.deepStrictEqual(log.push, ['/place/place-123', '/place/place-456']);

  await act(async () => { receiveResponse(tap('n3', undefined)); }); // no place id inside
  await wait(500);
  assert.equal(log.push.length, 2, 'no crash and no navigation');
  await screen.unmount();
});
