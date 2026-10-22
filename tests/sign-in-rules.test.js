// Sign-in rules: phone numbers, the code boxes, countdown, name/email, the fake SMS service,
// and the saved user (stays signed in, returning numbers skip the details, delete-all signs out).
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb } = require('./helpers/fakes');
installFakes({});
const phone = app('src/auth/phone.js');
const forms = app('src/auth/forms.js');
const { authService, DEMO_CODE } = app('src/services/auth.js');
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');
const AE = phone.COUNTRIES[0];
const IN = phone.COUNTRIES.find((c) => c.code === 'IN');

test('which part of the app a person sees', () => {
  const { appStage } = app('src/auth/stage.js');
  assert.equal(appStage(false, false), 'sign-in');
  assert.equal(appStage(false, true), 'sign-in', 'signed out always sees sign-in, even after the welcome screens');
  assert.equal(appStage(true, false), 'onboarding');
  assert.equal(appStage(true, true), 'app');
});

test('the UAE is the first country and the default', () => {
  assert.equal(phone.DEFAULT_COUNTRY.code, 'AE');
  assert.equal(AE.dial, '+971');
  assert.ok(phone.COUNTRIES.length >= 8);
  assert.equal(new Set(phone.COUNTRIES.map((c) => c.code)).size, phone.COUNTRIES.length, 'no duplicate countries');
});

test('UAE numbers: 9 digits starting with 5; a leading 0 and spaces are fine', () => {
  assert.equal(phone.validatePhone(AE, '501234567'), null);
  assert.equal(phone.validatePhone(AE, '50 123 4567'), null);
  assert.equal(phone.validatePhone(AE, '0501234567'), null, 'people type 050...');
  assert.match(phone.validatePhone(AE, ''), /Enter your phone/);
  assert.match(phone.validatePhone(AE, '5012345'), /valid UAE mobile number/);
  assert.match(phone.validatePhone(AE, '4012345678'), /valid UAE mobile number/, 'must start with 5');
  assert.match(phone.validatePhone(AE, '5012345678'), /valid UAE mobile number/, 'too long');
  assert.equal(phone.validatePhone(IN, '9812345678'), null);
  assert.match(phone.validatePhone(IN, '1812345678'), /valid phone number/);
});

test('tidying, spacing and the international form', () => {
  assert.equal(phone.cleanNational('(050) 123-4567'), '501234567');
  assert.equal(phone.cleanNational('abc'), '');
  assert.equal(phone.formatNational(AE, '501234567'), '50 123 4567');
  assert.equal(phone.formatNational(AE, '5012'), '50 12');
  assert.equal(phone.formatNational(IN, '9812345678'), '981 234 567 8');
  assert.equal(phone.toE164(AE, '050 123 4567'), '+971501234567');
  assert.equal(phone.toE164(IN, '9812345678'), '+919812345678');
  assert.equal(phone.displayPhone(AE, '501234567'), '+971 50 123 4567');
  assert.equal(phone.displayFromE164('+971501234567'), '+971 50 123 4567');
  assert.equal(phone.displayFromE164('+919812345678'), '+91 981 234 567 8');
  assert.equal(phone.displayFromE164('+1555123456'), '+1 555 123 456', '+1 is not confused with +971 or +91');
  assert.equal(phone.displayFromE164('12345'), '12345', 'unknown numbers are shown as they are');
});

test('the 6 code boxes: digits only, at most 6, one active box', () => {
  assert.equal(forms.cleanOtp('12a3-4 5'), '12345');
  assert.equal(forms.cleanOtp('Your code: 123 456'), '123456', 'a pasted SMS message works');
  assert.equal(forms.cleanOtp('1234567890'), '123456');
  assert.deepStrictEqual(forms.otpBoxes('12').map((b) => [b.char, b.filled, b.active]),
    [['1', true, false], ['2', true, false], ['', false, true], ['', false, false], ['', false, false], ['', false, false]]);
  assert.equal(forms.otpBoxes('').filter((b) => b.active).length, 1);
  assert.equal(forms.otpBoxes('123456').filter((b) => b.active).length, 0, 'none active when full');
});

test('countdown text, name and email checks', () => {
  assert.equal(forms.formatCountdown(28), '0:28');
  assert.equal(forms.formatCountdown(30), '0:30');
  assert.equal(forms.formatCountdown(65), '1:05');
  assert.equal(forms.formatCountdown(0), '0:00');
  assert.equal(forms.formatCountdown(-4), '0:00');
  assert.equal(forms.validateName('Aisha'), null);
  assert.match(forms.validateName('   '), /name/);
  for (const good of ['aisha@example.com', ' a.b+c@sub.example.co ']) assert.equal(forms.validateEmail(good), null, good);
  for (const bad of ['', 'aisha', 'aisha@', '@example.com', 'a b@example.com', 'aisha@example']) assert.notEqual(forms.validateEmail(bad), null, bad);
});

test('the fake SMS service: demo flag, the code is 123456, anything else is wrong', async () => {
  assert.equal(authService.isDemo, true);
  assert.equal(authService.demoCode, DEMO_CODE);
  assert.equal(DEMO_CODE, '123456');
  await authService.sendCode('+971501234567'); // does not throw
  assert.equal(await authService.verifyCode('+971501234567', '123456'), true);
  for (const wrong of ['000000', '123457', '', '12345', '1234567']) assert.equal(await authService.verifyCode('+971501234567', wrong), false, wrong);
});

// ---- saving the user on the phone ----------------------------------------------------------

test.beforeEach(async () => { await useTestDatabase(makeTestDb()); });

test('a saved user stays signed in after a restart, and signing out keeps their name and email', async () => {
  assert.equal(await data.getSignedInUser(), null, 'nobody signed in at first');
  assert.equal(await data.findUser('+971501234567'), null);

  const saved = await data.saveUser({ phone: '+971501234567', name: '  Aisha Rahman ', email: ' aisha@example.com ' });
  assert.equal(saved.name, 'Aisha Rahman', 'tidied');
  assert.equal(saved.email, 'aisha@example.com');
  assert.ok(saved.createdAt);
  assert.equal(await data.getSignedInUser(), null, 'saving a profile does not sign in by itself');

  await data.startSession('+971501234567');
  const back = await data.getSignedInUser(); // "after a restart": read again from storage
  assert.deepStrictEqual([back.phone, back.name, back.email], ['+971501234567', 'Aisha Rahman', 'aisha@example.com']);

  await data.endSession();
  assert.equal(await data.getSignedInUser(), null, 'signed out');
  assert.equal((await data.findUser('+971501234567')).name, 'Aisha Rahman', 'remembered, so the details step is skipped next time');
});

test('saving again updates the name but keeps the first sign-up date; two phones are separate people', async () => {
  const first = await data.saveUser({ phone: '+971501234567', name: 'Aisha', email: 'a@example.com' });
  const again = await data.saveUser({ phone: '+971501234567', name: 'Aisha R', email: 'a2@example.com' });
  assert.equal(again.name, 'Aisha R');
  assert.equal(again.createdAt, first.createdAt);
  await data.saveUser({ phone: '+971502222222', name: 'Omar', email: 'o@example.com' });
  await data.startSession('+971502222222');
  assert.equal((await data.getSignedInUser()).name, 'Omar');
  assert.equal((await data.findUser('+971501234567')).name, 'Aisha R');
});

test('Delete all my data removes the profile and signs the user out (but keeps the "welcome done" note)', async () => {
  await data.setOnboardingDone();
  await data.saveUser({ phone: '+971501234567', name: 'Aisha', email: 'a@example.com' });
  await data.startSession('+971501234567');
  await data.deleteAllData();
  assert.equal(await data.getSignedInUser(), null);
  assert.equal(await data.findUser('+971501234567'), null, 'the profile is gone too');
  assert.equal(await data.getOnboardingDone(), true);
});
