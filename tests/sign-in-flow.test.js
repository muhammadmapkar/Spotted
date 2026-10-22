// The sign-in flow, step by step (phone, code, details). Runs the REAL flow logic in React,
// with a pretend SMS service, a pretend user store, and a clock we control.
const test = require('node:test');
const assert = require('node:assert');
const { app, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();
const { useSignInFlow, AUTO_CHECK_DELAY_MS } = app('src/auth/useSignInFlow.js');
const { COUNTRIES } = app('src/auth/phone.js');

let flow; // what the screen would see
const Probe = (props) => { flow = useSignInFlow(props.deps); return null; };

function makeDeps({ known = {}, demo = true, sendFails = false } = {}) {
  const log = { sent: [], verified: [], saved: [], signedIn: [] };
  const deps = {
    auth: {
      isDemo: demo, demoCode: demo ? '123456' : undefined,
      sendCode: async (phone) => { if (sendFails) throw new Error('offline'); log.sent.push(phone); },
      verifyCode: async (phone, code) => { log.verified.push([phone, code]); return code === '123456'; },
    },
    findUser: async (phone) => known[phone] ?? null,
    saveUser: async (profile) => { const saved = { ...profile, createdAt: '2026-10-22T10:00:00.000Z' }; log.saved.push(saved); return saved; },
    onSignedIn: async (user) => { log.signedIn.push(user); },
  };
  return { deps, log };
}
async function start(t, options) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { deps, log } = makeDeps(options);
  const screen = await mount(React.createElement(Probe, { deps }));
  return { screen, log };
}
const type = async (fn) => { await act(async () => { fn(); }); };
// type a full code, then let the automatic check happen
async function enterCode(t, code) {
  await type(() => flow.setCode(code));
  await act(async () => { t.mock.timers.tick(AUTO_CHECK_DELAY_MS); });
}

test('step 1: starts on the phone step with the UAE selected; bad numbers show a message', async (t) => {
  const { screen, log } = await start(t);
  assert.equal(flow.step, 'phone');
  assert.equal(flow.country.code, 'AE');
  await type(() => flow.setNational('50 12'));
  await type(() => flow.submitPhone());
  assert.match(flow.phoneError, /valid UAE mobile number/);
  assert.equal(flow.step, 'phone', 'does not move on');
  assert.equal(log.sent.length, 0, 'no code is sent for a bad number');
  await type(() => flow.setNational('50 123 4567'));
  assert.equal(flow.phoneError, null, 'the message clears when you type again');
  assert.equal(flow.national, '501234567');
  await screen.unmount();
});

test('step 1 to 2: a good number sends the code, shows the number, and starts the 30-second countdown', async (t) => {
  const { screen, log } = await start(t);
  await type(() => flow.setNational('050 123 4567'));
  await type(() => flow.submitPhone());
  assert.equal(flow.step, 'code');
  assert.deepStrictEqual(log.sent, ['+971501234567']);
  assert.equal(flow.phoneDisplay, '+971 50 123 4567');
  assert.equal(flow.resendIn, 30);
  assert.equal(flow.canResend, false);
  await screen.unmount();
});

test('a different country is used in the number that is sent', async (t) => {
  const { screen, log } = await start(t);
  await type(() => flow.chooseCountry(COUNTRIES.find((c) => c.code === 'IN')));
  await type(() => flow.setNational('9812345678'));
  await type(() => flow.submitPhone());
  assert.deepStrictEqual(log.sent, ['+919812345678']);
  await screen.unmount();
});

test('if the code cannot be sent, a friendly message appears and we stay on step 1', async (t) => {
  const { screen } = await start(t, { sendFails: true });
  await type(() => flow.setNational('501234567'));
  await type(() => flow.submitPhone());
  assert.equal(flow.step, 'phone');
  assert.match(flow.phoneError, /couldn't send the code/);
  assert.equal(flow.sending, false);
  await screen.unmount();
});

async function toCodeStep(t, options) {
  const result = await start(t, options);
  await type(() => flow.setNational('501234567'));
  await type(() => flow.submitPhone());
  return result;
}

test('step 2: the code is checked by itself after the 6th digit, not before', async (t) => {
  const { screen, log } = await toCodeStep(t);
  await type(() => flow.setCode('12345'));
  await act(async () => { t.mock.timers.tick(5000); });
  assert.equal(log.verified.length, 0, 'five digits are not checked');
  await type(() => flow.setCode('123456'));
  await act(async () => { t.mock.timers.tick(AUTO_CHECK_DELAY_MS - 1); });
  assert.equal(log.verified.length, 0, 'waits a moment first');
  await act(async () => { t.mock.timers.tick(1); });
  assert.deepStrictEqual(log.verified, [['+971501234567', '123456']]);
  await screen.unmount();
});

test('wrong code: the boxes empty and shake, with an error, and you can try again', async (t) => {
  const { screen, log } = await toCodeStep(t);
  assert.equal(flow.shake, 0);
  await enterCode(t, '000000');
  assert.equal(flow.codeError, true, 'shows "That code didn\'t match"');
  assert.equal(flow.code, '', 'boxes are emptied');
  assert.equal(flow.shake, 1, 'the shake counter goes up (the screen shakes)');
  assert.equal(flow.step, 'code');
  assert.equal(log.signedIn.length, 0);
  await type(() => flow.setCode('1'));
  assert.equal(flow.codeError, false, 'the error clears when you start typing');
  await enterCode(t, '111111');
  assert.equal(flow.shake, 2, 'shakes again for another wrong code');
  await screen.unmount();
});

test('right code, first time on this phone: goes to the details step', async (t) => {
  const { screen, log } = await toCodeStep(t);
  await enterCode(t, '123456');
  assert.equal(flow.step, 'details');
  assert.equal(log.signedIn.length, 0, 'not signed in until the details are given');
  await screen.unmount();
});

test('right code, a number that signed in here before: straight in, no details step', async (t) => {
  const known = { '+971501234567': { phone: '+971501234567', name: 'Aisha', email: 'a@example.com', createdAt: 'x' } };
  const { screen, log } = await toCodeStep(t, { known });
  await enterCode(t, '123456');
  assert.equal(log.signedIn.length, 1);
  assert.equal(log.signedIn[0].name, 'Aisha');
  assert.equal(flow.step, 'code', 'we never show the details step');
  await screen.unmount();
});

test('the demo shortcut fills in 123456 and signs in; a real service has no shortcut', async (t) => {
  const demo = await toCodeStep(t);
  assert.equal(flow.demoCode, '123456');
  await type(() => flow.useDemoCode());
  await act(async () => { t.mock.timers.tick(AUTO_CHECK_DELAY_MS); });
  assert.equal(flow.step, 'details');
  await demo.screen.unmount();

  t.mock.timers.reset();
  const real = await toCodeStep(t, { demo: false });
  assert.equal(flow.demoCode, undefined, 'no shortcut with a real service');
  await real.screen.unmount();
});

test('resend: counts down 30, 29, ... 0, then works once and starts again', async (t) => {
  const { screen, log } = await toCodeStep(t);
  assert.equal(flow.resendIn, 30);
  await type(() => flow.resend());
  assert.equal(log.sent.length, 1, 'too early: nothing is sent');
  await act(async () => { t.mock.timers.tick(1000); });
  assert.equal(flow.resendIn, 29);
  for (let i = 0; i < 29; i++) await act(async () => { t.mock.timers.tick(1000); });
  assert.equal(flow.resendIn, 0);
  assert.equal(flow.canResend, true);
  await type(() => flow.resend());
  assert.equal(log.sent.length, 2, 'a new code is sent');
  assert.equal(flow.resendIn, 30, 'the countdown starts again');
  await screen.unmount();
});

test('"Change number" goes back to step 1 and forgets the half-typed code', async (t) => {
  const { screen } = await toCodeStep(t);
  await type(() => flow.setCode('123'));
  await type(() => flow.backToPhone());
  assert.equal(flow.step, 'phone');
  assert.equal(flow.code, '');
  assert.equal(flow.national, '501234567', 'the number is kept, so it can be fixed');
  await act(async () => { t.mock.timers.tick(5000); });
  assert.equal(flow.step, 'phone', 'a half-finished check does not pull us forward');
  await screen.unmount();
});

test('step 3: name and email are checked, then the user is saved and signed in', async (t) => {
  const { screen, log } = await toCodeStep(t);
  await enterCode(t, '123456');
  await type(() => flow.submitDetails());
  assert.match(flow.nameError, /name/);
  assert.match(flow.emailError, /email/);
  assert.equal(log.saved.length, 0, 'nothing is saved with empty details');
  await type(() => flow.setName('Aisha Rahman'));
  await type(() => flow.setEmail('not-an-email'));
  await type(() => flow.submitDetails());
  assert.equal(flow.nameError, null);
  assert.match(flow.emailError, /does not look right/);
  await type(() => flow.setEmail('aisha@example.com'));
  await type(() => flow.submitDetails());
  assert.deepStrictEqual(log.saved.map((s) => [s.phone, s.name, s.email]), [['+971501234567', 'Aisha Rahman', 'aisha@example.com']]);
  assert.equal(log.signedIn.length, 1, 'signed in exactly once');
  assert.equal(log.signedIn[0].name, 'Aisha Rahman');
  await screen.unmount();
});
