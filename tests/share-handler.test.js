// Sharing a reel to Spotted opens Add Place with the cleaned link. Runs the REAL component in React.
// (A past bug cancelled the timer that opens the screen, so sharing silently did nothing.)
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act, wait } = setupReact();

const EMPTY = { files: null, text: null, webUrl: null, type: null };
const calls = { push: [], alerts: [] };
let receiveShare; // lets a test "receive a share from Instagram"

installFakes({
  'expo-router': { useRouter: () => ({ push: (target) => calls.push.push(target) }) },
  'react-native': { Alert: { alert: (...args) => calls.alerts.push(args) } },
  'expo-share-intent': {
    useShareIntent: () => {
      const [shareIntent, setShareIntent] = React.useState(EMPTY);
      receiveShare = setShareIntent;
      return {
        hasShareIntent: !!(shareIntent.text || shareIntent.webUrl),
        shareIntent,
        resetShareIntent: () => setShareIntent(EMPTY),
      };
    },
  },
});
const { ShareIntentHandler } = app('src/share/ShareIntentHandler.js');

test('a shared reel opens Add Place with the tidy link attached', async () => {
  calls.push.length = 0;
  const screen = await mount(React.createElement(ShareIntentHandler));
  await act(async () => {
    receiveShare({ ...EMPTY, type: 'text', text: 'Look at this! https://www.instagram.com/reel/C9abc123/?igsh=MWx4ZHN0' });
  });
  await wait(500); // longer than the handler's short pause
  await act(async () => {});

  assert.equal(calls.push.length, 1, 'Add Place opens exactly once');
  assert.equal(calls.push[0].pathname, '/add-place');
  assert.equal(calls.push[0].params.reelUrl, 'https://www.instagram.com/reel/C9abc123/', 'tracking code removed');
  await screen.unmount();
});

test('a share without a link shows "No link found" instead of crashing', async () => {
  calls.push.length = 0;
  calls.alerts.length = 0;
  const screen = await mount(React.createElement(ShareIntentHandler));
  await act(async () => { receiveShare({ ...EMPTY, type: 'text', text: 'just some words' }); });
  await wait(500);
  await act(async () => {});

  assert.equal(calls.push.length, 0, 'no screen opens');
  assert.equal(calls.alerts.length, 1);
  assert.equal(calls.alerts[0][0], 'No link found');
  await screen.unmount();
});
