// The Home tab's rules: the circles row, search, filters, sorting, the typing placeholder and the
// area name. Checked against the sample data (so the expected answers are worked out by hand).
const test = require('node:test');
const assert = require('node:assert');
const { app, setupReact } = require('./helpers/fakes');
const mock = app('src/data/mock.js');
const home = app('src/home/homeData.js');
const typing = app('src/home/typing.js');
const { areaFromGeocode } = app('src/location/area.js');
const ids = (list) => list.map((p) => p.id);
const savedNow = new Set(mock.PLACES.filter((p) => p.saved).map((p) => p.id));

test('Explore nearby: every place within 15 km, Spotted Partners first, then nearest first', () => {
  const feed = home.exploreFeed(mock.PLACES, home.NO_FILTERS);
  assert.deepStrictEqual(ids(feed), [
    // partners, nearest first
    'saffron', 'brew', 'stack', 'glow', 'casa', 'kaze', 'dune',
    // everything else, nearest first
    'taco', 'luma', 'masala', 'forno', 'starlight', 'thread', 'shawarma', 'kiln',
  ]);
  assert.equal(feed.length, 15);
});

test('the circles row: saved places within 15 km, nearest first, at most 10, with the ring by distance', () => {
  const stories = home.storiesFor(mock.PLACES, savedNow);
  assert.deepStrictEqual(ids(stories.map((s) => s.place)), ['saffron', 'brew', 'taco', 'stack', 'luma', 'forno', 'starlight', 'kaze', 'thread', 'shawarma']);
  assert.deepStrictEqual(stories.map((s) => s.ring), ['hot', 'hot', 'hot', 'hot', 'soft', 'soft', 'soft', 'soft', 'soft', 'soft'], 'bright under 5 km, soft from 5 to 15 km');
  assert.ok(stories.every((s) => s.place.dist <= 15));
  // never more than 10, even if everything is saved
  const all = new Set(mock.PLACES.map((p) => p.id));
  const capped = home.storiesFor(mock.PLACES, all);
  assert.equal(capped.length, 10);
  assert.deepStrictEqual(ids(capped.map((s) => s.place)), ['saffron', 'brew', 'taco', 'stack', 'glow', 'luma', 'masala', 'forno', 'starlight', 'casa']);
  // nothing saved, nothing shown; places beyond 15 km are never shown
  assert.deepStrictEqual(home.storiesFor(mock.PLACES, new Set()), []);
  const far = { ...mock.PLACES[0], id: 'far', dist: 16 };
  assert.deepStrictEqual(home.storiesFor([far], new Set(['far'])), []);
  // the 5 km boundary: 4.99 is bright, 5.0 is soft
  const edge = [{ ...mock.PLACES[0], id: 'a', dist: 4.99 }, { ...mock.PLACES[0], id: 'b', dist: 5 }];
  assert.deepStrictEqual(home.storiesFor(edge, new Set(['a', 'b'])).map((s) => s.ring), ['hot', 'soft']);
});

test('search looks at name, category, tags and menu items, across ALL nearby places, partners first', () => {
  const found = (q, f = home.NO_FILTERS) => ids(home.searchHome(q, f).places);
  assert.deepStrictEqual(found('indian'), ['saffron', 'masala'], 'saffron is a partner, so first');
  assert.deepStrictEqual(found('INDIAN'), ['saffron', 'masala'], 'not case sensitive');
  assert.deepStrictEqual(found('clothes'), ['luma', 'thread']);
  assert.deepStrictEqual(found('movies'), ['starlight']);
  assert.deepStrictEqual(found('coffee'), ['brew', 'dune'], 'found through tags');
  assert.deepStrictEqual(found('birria'), ['taco'], 'found through a menu item');
  assert.deepStrictEqual(found('dosa'), ['masala']);
  assert.deepStrictEqual(found('shopping'), ['luma', 'thread'], 'found through the group');
  // The important case: the partner is FARTHER than the non-partner, but still comes first.
  assert.deepStrictEqual(found('mexican'), ['casa', 'taco'], 'Casa Verde (partner, 9.5 km) before Taco Norte (3.8 km)');
  const partnerFlags = found('food').map((id) => mock.placeById(id).partner);
  assert.deepStrictEqual(partnerFlags, [...partnerFlags].sort((a, b) => Number(b) - Number(a)), 'every partner comes before every non-partner');
  assert.deepStrictEqual(found('zzz'), []);
  assert.ok(found('burger').includes('stack'));
  assert.ok(!savedNow.has('masala') && found('indian').includes('masala'), 'unsaved places are searched too');
});

test('search finds influencers by handle (and only by handle)', () => {
  const handles = (q) => home.searchHome(q, home.NO_FILTERS).influencers.map((i) => i.id);
  assert.deepStrictEqual(handles('capital'), ['capital']);
  assert.deepStrictEqual(handles('BITES'), ['capital']);
  assert.deepStrictEqual(handles('ad'), ['forkful', 'rack', 'weekend']);
  assert.deepStrictEqual(handles('food'), [], '"food" is in their niche, not their handle');
  assert.deepStrictEqual(handles(''), []);
  assert.deepStrictEqual(handles('   '), []);
});

test('filters: budget (lowest price), distance, category, influencer picks, offers', () => {
  const count = (f) => home.exploreFeed(mock.PLACES, { ...home.NO_FILTERS, ...f }).length;
  assert.equal(count({}), 15);
  assert.equal(count({ budget: 50 }), 12, 'a place passes if its LOWEST price fits the budget');
  assert.equal(count({ budget: 500 }), 15, '500 means any budget');
  assert.equal(count({ dist: 5 }), 4);
  assert.equal(count({ dist: 1 }), 0);
  assert.equal(count({ cat: 'Food' }), 11, 'a group');
  assert.equal(count({ cat: 'Indian' }), 2, 'or a single category');
  assert.equal(count({ cat: 'Café' }), 2);
  assert.equal(count({ offers: true }), 11);
  const withInfluencers = home.exploreFeed(mock.PLACES, { ...home.NO_FILTERS, infl: true });
  assert.ok(withInfluencers.length > 0 && withInfluencers.every((p) => mock.recsFor(p.id).length > 0));
  // all together
  const all = home.exploreFeed(mock.PLACES, { budget: 50, dist: 10, cat: 'Food', infl: false, offers: true });
  const byHand = mock.PLACES.filter((p) => p.lo <= 50 && p.dist <= 10 && p.group === 'Food' && mock.hasOffers(p));
  assert.deepStrictEqual(ids(all).sort(), ids(byHand).sort());
  // filters also apply to search results
  assert.deepStrictEqual(ids(home.searchHome('indian', { ...home.NO_FILTERS, budget: 25 }).places), ['masala']);
});

test('the removable filter chips say what is on, and removing one changes only that filter', () => {
  assert.deepStrictEqual(home.activeFilterChips(home.NO_FILTERS), []);
  const on = { budget: 80, dist: 5, cat: 'Indian', infl: true, offers: true };
  const chips = home.activeFilterChips(on);
  assert.deepStrictEqual(chips.map((c) => c.label), ['Under AED 80 pp', 'Within 5 km', 'Indian', 'Influencer picks', 'Has offers']);
  for (const chip of chips) {
    const after = { ...on, ...chip.clear };
    assert.equal(home.activeFilterChips(after).length, chips.length - 1, `removing "${chip.label}" leaves the rest`);
    assert.ok(!home.activeFilterChips(after).some((c) => c.key === chip.key));
  }
});

test('card text', () => {
  const saffron = mock.placeById('saffron');
  assert.equal(home.priceRange(saffron), 'AED 35–80');
  assert.equal(home.categoryLine(saffron), 'Indian · AED 35–80 pp');
  assert.equal(home.resultsTitle(1), 'Places · 1 result');
  assert.equal(home.resultsTitle(0), 'Places · 0 results');
  assert.equal(home.resultsTitle(3), 'Places · 3 results');
  const capital = mock.INFLUENCERS[0];
  assert.equal(home.platformText(capital), 'Instagram · TikTok');
  assert.equal(home.pickCount(capital), 10);
});

test('the search box types the examples letter by letter, pauses, then moves on', () => {
  const examples = ['Indian', 'clothes'];
  let state = typing.INITIAL_TYPING;
  const seen = [];
  for (let i = 0; i < 6; i++) { state = typing.stepTyping(state, examples); seen.push(state.typed); }
  assert.deepStrictEqual(seen, ['I', 'In', 'Ind', 'Indi', 'India', 'Indian']);
  assert.equal(state.hold, typing.TYPING_HOLD_TICKS, 'a finished word pauses');
  for (let i = 0; i < typing.TYPING_HOLD_TICKS; i++) { state = typing.stepTyping(state, examples); assert.equal(state.typed, 'Indian', 'the word stays during the pause'); }
  state = typing.stepTyping(state, examples);
  assert.equal(state.typed, 'c', 'then the next example starts');
  // goes round to the first example again
  for (let i = 0; i < 200; i++) state = typing.stepTyping(state, examples);
  assert.ok(['Indian', 'clothes'].some((w) => w.startsWith(state.typed)));
  assert.equal(typing.TYPING_TICK_MS, 120);
  assert.deepStrictEqual(typing.stepTyping(typing.INITIAL_TYPING, []), typing.INITIAL_TYPING, 'no examples: nothing happens');
  assert.ok(mock.SEARCH_EXAMPLES.length > 0 && mock.SEARCH_EXAMPLES.every((w) => w.length > 0));
});

test('the area name: "District, City", with sensible fallbacks', () => {
  assert.equal(areaFromGeocode({ district: 'Khalifa City', city: 'Abu Dhabi' }), 'Khalifa City, Abu Dhabi');
  assert.equal(areaFromGeocode({ district: 'Marina', city: 'Dubai', region: 'Dubai' }), 'Marina, Dubai');
  assert.equal(areaFromGeocode({ subregion: 'Jumeirah', region: 'Dubai' }), 'Jumeirah, Dubai', 'bigger area and region if that is all there is');
  assert.equal(areaFromGeocode({ city: 'Dubai', district: 'Dubai' }), 'Dubai', 'no "Dubai, Dubai"');
  assert.equal(areaFromGeocode({ city: 'Sharjah' }), 'Sharjah');
  assert.equal(areaFromGeocode({ district: 'Al Barsha' }), 'Al Barsha');
  assert.equal(areaFromGeocode({ district: '  ', city: '' }), null);
  assert.equal(areaFromGeocode(null), null);
  assert.equal(areaFromGeocode(undefined), null);
  assert.equal(mock.SAMPLE_AREA, 'Khalifa City, Abu Dhabi', 'the fallback when location is refused');
});

test('the saved places and filters are shared, and screens hear about changes', async () => {
  const { React, mount, act } = setupReact();
  const saved = app('src/state/saved.js');
  const filters = app('src/state/filters.js');
  saved.resetSaved(); filters.resetFilters();
  let savedSeen, filtersSeen;
  const Probe = () => { savedSeen = saved.useSavedIds(); filtersSeen = filters.useFilters(); return null; };
  const screen = await mount(React.createElement(Probe));

  assert.equal(savedSeen.size, 10, 'starts with the sample data\'s 10 saved places');
  assert.deepStrictEqual(filtersSeen, home.NO_FILTERS);

  let now;
  await act(async () => { now = saved.toggleSaved('glow'); });
  assert.equal(now, true); assert.equal(savedSeen.has('glow'), true); assert.equal(savedSeen.size, 11);
  await act(async () => { now = saved.toggleSaved('glow'); });
  assert.equal(now, false); assert.equal(savedSeen.has('glow'), false);
  await act(async () => { saved.toggleSaved('saffron'); });
  assert.equal(savedSeen.has('saffron'), false, 'un-saving works on the starting places too');

  await act(async () => { filters.setFilters({ dist: 5 }); });
  assert.equal(filtersSeen.dist, 5);
  await act(async () => { filters.setFilters({ cat: 'Food' }); });
  assert.deepStrictEqual([filtersSeen.dist, filtersSeen.cat], [5, 'Food'], 'a change keeps the other filters');
  await act(async () => { filters.resetFilters(); });
  assert.deepStrictEqual(filtersSeen, home.NO_FILTERS);
  saved.resetSaved();
  await screen.unmount();
});
