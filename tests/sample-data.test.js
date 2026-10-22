// The sample data (src/data/mock.ts) must be a faithful copy of the prototype's data, and the
// helper functions must behave like the prototype's. The prototype's own script is run and compared.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const { app, readPrototype } = require('./helpers/fakes');
const mock = app('src/data/mock.js');

// Run the prototype's data section to get its original values.
const html = readPrototype();
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(html.slice(html.indexOf('const PLACES = ['), html.indexOf('const byId')).replace(/\bconst (\w+) =/g, 'globalThis.$1 ='), sandbox);
// Plain copies (data made inside the sandbox is a different "realm", which confuses deepStrictEqual).
const proto = JSON.parse(JSON.stringify({
  PLACES: sandbox.PLACES, INFL: sandbox.INFL, PLAT: sandbox.PLAT, EXAMPLES: sandbox.EXAMPLES, CATS: sandbox.CATS,
  DISTS: sandbox.DISTS, NEW_OFFERS: sandbox.NEW_OFFERS, LOYALTY: sandbox.LOYALTY, LEVEL: sandbox.LEVEL,
}));
const colours = (css) => css.match(/#[0-9A-Fa-f]{6}/g);

test('places are the same as the prototype, field by field', () => {
  assert.equal(mock.PLACES.length, proto.PLACES.length);
  mock.PLACES.forEach((place, i) => {
    const original = proto.PLACES[i];
    for (const key of ['id', 'name', 'mono', 'cat', 'group', 'tags', 'dist', 'ang', 'lo', 'hi', 'c1', 'c2', 'kind']) {
      assert.equal(place[key], original[key], `${original.id}.${key}`);
    }
    assert.equal(place.partner, original.partner, `${original.id}.partner`);
    assert.equal(place.saved, original.saved, `${original.id}.saved`);
    assert.equal(!!place.isNew, !!original.isNew, `${original.id}.isNew`);
    assert.deepStrictEqual(place.menu.map((m) => [m.name, m.price]), original.menu, `${original.id}.menu`);
    assert.deepStrictEqual(place.partnerOffers.map((o) => [o.source, o.text]), original.po, `${original.id} partner offers`);
    assert.deepStrictEqual(place.spottedOffers.map((o) => [o.title, o.text]), original.so, `${original.id} spotted offers`);
    assert.ok(place.spottedOffers.every((o) => o.source === 'Spotted'));
  });
});

test('influencers, new offers, loyalty cards, levels and lists match the prototype', () => {
  assert.equal(mock.INFLUENCERS.length, proto.INFL.length);
  mock.INFLUENCERS.forEach((inf, i) => {
    const o = proto.INFL[i];
    assert.deepStrictEqual([inf.id, inf.handle, inf.initial, inf.followers, inf.niche], [o.id, o.handle, o.initial, o.followers, o.niche]);
    assert.deepStrictEqual(inf.platforms, o.platforms);
    assert.deepStrictEqual(inf.picks, o.picks);
    assert.deepStrictEqual(inf.more, o.more);
    assert.deepStrictEqual(inf.gradient, colours(o.g), inf.id + ' gradient');
    assert.equal(!!inf.isNew, !!o.isNew);
  });
  assert.deepStrictEqual(mock.NEW_OFFERS.map((o) => [o.placeId, o.source, o.text, o.ends]), proto.NEW_OFFERS.map((o) => [o.p, o.src, o.text, o.ends]));
  assert.deepStrictEqual(mock.LOYALTY.map((l) => [l.placeId, l.stamps, l.gradient]), proto.LOYALTY.map((l) => [l.p, l.stamps, colours(l.bg)]));
  assert.deepStrictEqual(mock.LEVEL, proto.LEVEL);
  assert.deepStrictEqual(mock.SEARCH_EXAMPLES, proto.EXAMPLES);
  assert.deepStrictEqual(mock.CATEGORY_FILTERS, proto.CATS);
  assert.deepStrictEqual(mock.DISTANCE_FILTERS, proto.DISTS);
  assert.deepStrictEqual(mock.PLATFORM_NAMES, proto.PLAT);
});

test('the data is consistent: every reference points at a real place', () => {
  const ids = new Set(mock.PLACES.map((p) => p.id));
  assert.equal(ids.size, mock.PLACES.length, 'duplicate place ids');
  for (const inf of mock.INFLUENCERS) for (const id of [...inf.picks, ...inf.more]) assert.ok(ids.has(id), `${inf.id} -> ${id}`);
  for (const o of mock.NEW_OFFERS) assert.ok(ids.has(o.placeId));
  for (const l of mock.LOYALTY) { assert.ok(ids.has(l.placeId)); assert.ok(l.stamps >= 0 && l.stamps <= 6); }
  for (const p of mock.PLACES) {
    assert.ok(/^#[0-9A-F]{6}$/i.test(p.c1) && /^#[0-9A-F]{6}$/i.test(p.c2));
    assert.equal(p.mono.length, 2, p.id + ' monogram has two letters');
    assert.ok(p.lo <= p.hi && p.menu.length > 0);
  }
  assert.equal(mock.LEVEL.length, 7);
  assert.equal(Math.max(...mock.LEVEL), 25, 'the discount tops out at 25%');
});

test('helpers behave like the prototype: fmt, hasOffers, recsFor, itemsFor, placeById, thumbColors', () => {
  assert.equal(mock.fmt(1.2), '1.2 km away');
  assert.equal(mock.fmt(9.94), '9.9 km away');
  assert.equal(mock.fmt(9.96), '10.0 km away', 'under 10 km keeps one decimal, like the prototype');
  assert.equal(mock.fmt(13.4), '13 km away');
  assert.equal(mock.fmt(10), '10 km away');

  const saffron = mock.placeById('saffron');
  assert.equal(saffron.name, 'Saffron Lane');
  assert.equal(mock.placeById('nope'), undefined);
  assert.equal(mock.hasOffers(saffron), true);
  assert.equal(mock.hasOffers(mock.placeById('taco')), false);
  assert.deepStrictEqual(mock.thumbColors(saffron), ['#F6B26B', '#D9661A']);

  // recsFor: same answer as the prototype's own function
  const protoRecs = (pid) => proto.INFL.map((inf, idx) => ({ inf, idx })).filter((x) => x.inf.picks.indexOf(pid) >= 0 || x.inf.more.indexOf(pid) >= 0);
  for (const place of mock.PLACES) {
    assert.deepStrictEqual(mock.recsFor(place.id).map((r) => [r.influencer.id, r.index]), protoRecs(place.id).map((r) => [r.inf.id, r.idx]), place.id);
  }
  assert.ok(mock.recsFor('saffron').length >= 4);

  // itemsFor: one or two menu items, never the same one twice, always from the place's own menu
  for (const place of mock.PLACES) {
    for (let idx = 0; idx < 8; idx++) {
      const items = mock.itemsFor(idx, place);
      assert.ok(items.length >= 1 && items.length <= 2);
      assert.equal(new Set(items.map((i) => i.name)).size, items.length);
      for (const item of items) assert.ok(place.menu.some((m) => m.name === item.name && m.price === item.price));
    }
  }
  assert.deepStrictEqual(mock.itemsFor(0, saffron), [{ name: 'Butter chicken', price: 48 }, { name: 'Paneer tikka', price: 38 }]);
});
