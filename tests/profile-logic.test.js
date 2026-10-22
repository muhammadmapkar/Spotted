// The Profile tab's rules: savings count-up and split, loyalty stamps and discounts, and the WhatsApp choice.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, makeTestDb } = require('./helpers/fakes');
installFakes({});
const mock = app('src/data/mock.js');
const rules = app('src/profile/profileData.js');
const data = app('src/db/index.js');
const { useTestDatabase } = app('src/db/database.js');

test.beforeEach(async () => { await useTestDatabase(makeTestDb()); });

test('the savings number counts 0, 11, 22 ... up to AED 340 and stops', () => {
  assert.equal(rules.SAVINGS_TOTAL, 340);
  let value = 0; const seen = [0];
  while (value < rules.SAVINGS_TOTAL) { value = rules.nextCount(value); seen.push(value); }
  assert.deepStrictEqual(seen.slice(0, 4), [0, 11, 22, 33]);
  assert.equal(seen.at(-1), 340, 'never goes past the total');
  assert.equal(rules.nextCount(340), 340);
  assert.equal(rules.nextCount(335), 340);
  assert.ok(seen.length * rules.COUNT_EVERY_MS < 1000, 'done in under a second');
});

test('the split into Spotted, Esaad and Fazaa: 145 + 120 + 75 = 340', () => {
  const full = rules.savingsBreakdown(340);
  assert.deepStrictEqual(full.map((p) => [p.label, p.value]), [['Spotted', 145], ['Esaad', 120], ['Fazaa', 75]]);
  assert.equal(full.reduce((sum, p) => sum + p.value, 0), 340);
  assert.deepStrictEqual(rules.savingsBreakdown(0).map((p) => p.value), [0, 0, 0]);
  assert.deepStrictEqual(rules.savingsBreakdown(170).map((p) => p.value), [73, 60, 38], 'the parts follow the number while it counts up');
});

test('four coins burst out with the delays from the prototype', () => {
  assert.equal(rules.COINS.length, 4);
  assert.deepStrictEqual(rules.COINS.map((c) => c.delay), [900, 1000, 1100, 1050]);
  assert.deepStrictEqual(rules.COINS.map((c) => [c.dx, c.dy]), [[40, -60], [70, -20], [-20, -70], [50, 30]]);
});

test('the discount rises with the stamps, up to 25% (the prototype table)', () => {
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 6].map(rules.discountFor), [0, 0, 5, 5, 10, 15, 25]);
  assert.equal(rules.MAX_DISCOUNT, 25);
  assert.equal(rules.discountFor(9), 25, 'more stamps than slots counts as full');
  assert.equal(rules.discountFor(-3), 0);
});

test('the next level is the next stamp count that gives a bigger discount', () => {
  assert.deepStrictEqual(rules.nextLevel(0), { stamps: 2, discount: 5 });
  assert.deepStrictEqual(rules.nextLevel(2), { stamps: 4, discount: 10 }, 'stamp 3 gives the same 5%, so skip it');
  assert.deepStrictEqual(rules.nextLevel(4), { stamps: 5, discount: 15 });
  assert.deepStrictEqual(rules.nextLevel(5), { stamps: 6, discount: 25 });
  assert.equal(rules.nextLevel(6), null);
});

test('loyalty cards: one per restaurant with the right words', () => {
  const views = rules.loyaltyViews();
  assert.deepStrictEqual(views.map((v) => v.place.name), ['Saffron Lane', 'Brew Theory', 'Stack Burger Co.']);
  assert.deepStrictEqual(views.map((v) => v.stampsLabel), ['4 of 6 stamps', '5 of 6 stamps', '2 of 6 stamps']);
  assert.deepStrictEqual(views.map((v) => v.nowLabel), ['10% off', '15% off', '5% off']);
  assert.deepStrictEqual(views.map((v) => v.nextLabel), ['15% at 5 stamps · max 25%', '25% at 6 stamps · max 25%', '10% at 4 stamps · max 25%']);
});

test('a full card says the maximum is reached', () => {
  const full = rules.loyaltyView({ placeId: 'brew', stamps: 6, gradient: ['#000000', '#111111'] });
  assert.equal(full.nextLabel, 'Max 25% reached');
  assert.equal(full.nowLabel, '25% off');
  assert.ok(full.slots.every((s) => s.state === 'filled'));
});

test('stamp slots: filled ones press in 140 ms apart, the next one glows, the rest are empty', () => {
  const view = rules.loyaltyViews()[0]; // 4 stamps
  assert.deepStrictEqual(view.slots.map((s) => s.state), ['filled', 'filled', 'filled', 'filled', 'next', 'empty']);
  assert.deepStrictEqual(view.slots.map((s) => s.delay), [300, 440, 580, 720, 860, 1000]);
  const none = rules.loyaltyView({ placeId: 'brew', stamps: 0, gradient: ['#000000', '#111111'] });
  assert.deepStrictEqual(none.slots.map((s) => s.state), ['next', 'empty', 'empty', 'empty', 'empty', 'empty']);
});

test('a card for an unknown place is skipped', () => {
  assert.equal(rules.loyaltyView({ placeId: 'gone', stamps: 3, gradient: ['#000000', '#111111'] }), null);
  assert.equal(rules.loyaltyViews([{ placeId: 'gone', stamps: 3, gradient: ['#000000', '#111111'] }, mock.LOYALTY[0]]).length, 1);
});

test('messages for the notification switches', () => {
  assert.equal(rules.whatsappMessage(true), 'New offers will come to your WhatsApp');
  assert.equal(rules.whatsappMessage(false), 'WhatsApp offers turned off');
  assert.equal(rules.whatsappSubtitle('+971 50 123 4567'), 'New deals within 15 km, sent to +971 50 123 4567');
  assert.match(rules.NEARBY_SUBTITLE, /App notifications/);
});

test('the WhatsApp choice is kept per person, off until they turn it on, and removed by "Delete all my data"', async () => {
  const a = '+971501234567'; const b = '+971509998888';
  assert.equal(await data.getWhatsappOffers(a), false, 'off by default: nobody gets marketing messages they did not ask for');
  await data.setWhatsappOffers(a, true);
  assert.equal(await data.getWhatsappOffers(a), true);
  assert.equal(await data.getWhatsappOffers(b), false, 'another person is not affected');
  await data.setWhatsappOffers(a, false);
  assert.equal(await data.getWhatsappOffers(a), false);
  await data.setWhatsappOffers(a, true);
  await data.setWhatsappOffers(b, true);
  await data.deleteAllData();
  assert.equal(await data.getWhatsappOffers(a), false);
  assert.equal(await data.getWhatsappOffers(b), false);
});

test('the WhatsApp choice survives signing out and in (the profile is remembered)', async () => {
  const phone = '+971501234567';
  await data.saveUser({ phone, name: 'A', email: 'a@example.com' });
  await data.startSession(phone);
  await data.setWhatsappOffers(phone, true);
  await data.endSession();
  await data.startSession(phone);
  assert.equal(await data.getWhatsappOffers(phone), true);
});
