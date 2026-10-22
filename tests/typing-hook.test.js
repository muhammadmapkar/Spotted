// The search box "typing" hook: runs only while active, one letter every 120 ms.
const test = require('node:test');
const assert = require('node:assert');
const { app, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();
const { useTypingPlaceholder } = app('src/home/useTypingPlaceholder.js');
const { TYPING_TICK_MS } = app('src/home/typing.js');

let typed, setActive;
const Probe = () => {
  const [active, set] = React.useState(true);
  setActive = set;
  typed = useTypingPlaceholder(active, ['Indian', 'clothes']);
  return null;
};

test('types letter by letter while active, and stops when it should', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const screen = await mount(React.createElement(Probe));
  assert.equal(typed, '');
  const tick = async (n = 1) => { for (let i = 0; i < n; i++) await act(async () => { t.mock.timers.tick(TYPING_TICK_MS); }); };
  await tick();
  assert.equal(typed, 'I');
  await tick(2);
  assert.equal(typed, 'Ind');
  await tick(3);
  assert.equal(typed, 'Indian');
  await act(async () => { setActive(false); }); // the user starts typing, or leaves the tab
  await tick(5);
  assert.equal(typed, 'Indian', 'it stops moving while not active');
  await screen.unmount();
});
