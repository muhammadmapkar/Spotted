// The place-clue finder: reads a pasted Instagram/TikTok caption and finds the place it is about.
// Runs on the phone with simple rules (no AI, no internet). The user always confirms the place.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes } = require('./helpers/fakes');
installFakes({});
const { findPlaceClues, detectArea } = app('src/places/clues.js');
const { suggestFromCaption } = app('src/places/fromCaption.js');

const searchTexts = (caption) => findPlaceClues(caption).map((c) => c.searchText);
const texts = (caption) => findPlaceClues(caption).map((c) => c.text);

test('📍 pin lines are the strongest clue', () => {
  const caption = '📍 Arabian Tea House, Al Fahidi Historical District\n🍽️ Best karak chai in town ☕ #dubai #foodie #fyp';
  const [best] = findPlaceClues(caption);
  assert.equal(best.text, 'Arabian Tea House, Al Fahidi Historical District');
  assert.equal(best.source, 'pin');
  assert.equal(best.score, 100);
});

test('other ways of pointing at a place: Where:, Location:, a pin next to an @handle', () => {
  assert.deepStrictEqual(texts('Where: Souk Madinat Jumeirah | Open 10am-11pm'), ['Souk Madinat Jumeirah']);
  assert.deepStrictEqual(texts('Location: Zuma Dubai'), ['Zuma Dubai']);
  assert.deepStrictEqual(texts('📍@arabianteahouse\nlovely courtyard'), ['arabian tea house'], 'run-together handle is split into words');
});

test('"at Name" phrases, with the area added to the search', () => {
  const caption = 'Brunch at Common Grounds in Jumeirah was amazing!! ☕️ you NEED to try the shakshuka';
  assert.deepStrictEqual(texts(caption), ['Common Grounds']);
  assert.deepStrictEqual(searchTexts(caption), ['Common Grounds Jumeirah']);
  assert.equal(detectArea(caption), 'Jumeirah');
});

test('names with small words inside, accents, and several places in one caption', () => {
  assert.deepStrictEqual(texts('We visited the Museum of the Future today. Went to Dubai Frame after.'), ['Museum of the Future', 'Dubai Frame']);
  assert.deepStrictEqual(texts('Dinner at Café de Paris near Downtown ❤️'), ['Café de Paris']);
});

test('names in double quotes', () => {
  const [clue] = findPlaceClues('Trying “Operation Falafel” for the first time today!');
  assert.equal(clue.text, 'Operation Falafel');
  assert.equal(clue.source, 'quote');
});

test('hashtags that name a place are used; generic ones are not', () => {
  const caption = 'Kite Beach sunset 🌅 #KiteBeach #dubaibeach #reels #foodie #fyp #viral';
  assert.deepStrictEqual(texts(caption), ['Kite Beach']);
  assert.deepStrictEqual(texts('@alserkal.avenue is the place to be #AlserkalAvenue'), ['Alserkal Avenue']);
});

test('@handles are used, but not the person who filmed it, and not email addresses', () => {
  assert.deepStrictEqual(texts('Cute spot! @the_sum_of_us ☕'), ['the sum of us']);
  assert.deepStrictEqual(texts('Video by @creator_name 🎥\n📍Zuma Dubai\nBest sushi in DIFC'), ['Zuma Dubai'], 'the creator is skipped');
  assert.deepStrictEqual(texts('📸 @photographer_jane\nthanks to @some_friend'), []);
  assert.deepStrictEqual(texts('for collabs email me@example.com'), [], 'an email is not a mention');
});

test('captions with no place in them give no clues (never a wild guess)', () => {
  assert.deepStrictEqual(findPlaceClues('so good 😍😍 #fyp #foryou #viral #dubai #foodie'), []);
  assert.deepStrictEqual(findPlaceClues('Weekend at home, at least it was cozy. At night we watched a movie'), []);
  assert.deepStrictEqual(findPlaceClues('Tried the Shakshuka and it was great. Dinner at Dubai tonight!'), [], 'a dish and a bare city are not places');
  assert.deepStrictEqual(findPlaceClues(''), []);
  assert.deepStrictEqual(findPlaceClues('   \n  '), []);
  assert.deepStrictEqual(findPlaceClues('😍😍🔥'), []);
});

test('the same place found twice is listed once, as the longer version', () => {
  const clues = findPlaceClues('📍Pierchic Dubai\nDinner at Pierchic with the girls 🥂 #Pierchic');
  assert.equal(clues.length, 1);
  assert.equal(clues[0].text, 'Pierchic Dubai');
});

test('ranking: pin, then quote, then phrase, then hashtag, then handle', () => {
  const caption = '“Zuma” was great! Dinner at Common Grounds. 📍 Pierchic #SoukMadinat @pierchicdubai';
  const sources = findPlaceClues(caption).map((c) => c.source);
  const scores = findPlaceClues(caption).map((c) => c.score);
  assert.deepStrictEqual(scores, [...scores].sort((a, b) => b - a), 'best first');
  assert.equal(sources[0], 'pin');
});

test('at most 5 clues, each searchable text is short and has letters', () => {
  const lots = Array.from({ length: 12 }, (_, i) => `at Place Number${String.fromCharCode(65 + i)} Cafe`).join('. ');
  const clues = findPlaceClues(lots + ' ' + 'x'.repeat(500));
  assert.ok(clues.length <= 5);
  for (const c of clues) {
    assert.ok(c.text.length >= 3 && c.text.length <= 80);
    assert.ok(/\p{L}/u.test(c.text));
  }
});

test('area detection: neighbourhoods before cities, works on #hashtags too', () => {
  assert.equal(detectArea('great night in Dubai Marina'), 'Dubai Marina');
  assert.equal(detectArea('brunch #jumeirah'), 'Jumeirah');
  assert.equal(detectArea('lovely day in London'), 'London');
  assert.equal(detectArea('nothing about where'), null);
});

// ---- caption to suggestions (the search is pretend here) ----------------------------------

const fakePlaces = {
  'tea house dubai': [{ googlePlaceId: 'tea', name: 'Arabian Tea House', address: 'Al Fahidi' }],
  'common grounds jumeirah': [],
  'common grounds': [{ googlePlaceId: 'cg1', name: 'Common Grounds', address: 'Jumeirah' }, { googlePlaceId: 'cg2', name: 'Common Grounds Alserkal', address: 'Al Quoz' }],
  'zuma dubai': [{ googlePlaceId: 'zuma', name: 'Zuma', address: 'DIFC' }],
};
const fakeSearch = (log) => async (query) => {
  log.push(query);
  return fakePlaces[query.toLowerCase().replace(/,/g, '')] ?? [];
};

test('caption to suggestions: searches the best clues and merges the results', async () => {
  const log = [];
  const result = await suggestFromCaption('Brunch at Common Grounds in Jumeirah, then 📍 Zuma Dubai', fakeSearch(log));
  assert.deepStrictEqual(result.suggestions.map((p) => p.googlePlaceId), ['zuma', 'cg1', 'cg2'], 'best clue first, no repeats');
  assert.deepStrictEqual(log, ['Zuma Dubai', 'Common Grounds Jumeirah', 'Common Grounds'], 'a clue that names an area keeps it; retries without the area when nothing is found');
});

test('caption to suggestions: nothing found means an empty list, never an error', async () => {
  const none = await suggestFromCaption('#fyp #viral so cute', fakeSearch([]));
  assert.deepStrictEqual(none, { clues: [], suggestions: [] });
  const unknown = await suggestFromCaption('📍 A Place That Does Not Exist', fakeSearch([]));
  assert.equal(unknown.clues.length, 1);
  assert.deepStrictEqual(unknown.suggestions, []);
});

test('caption to suggestions: respects the result limit and drops duplicates', async () => {
  const many = async () => Array.from({ length: 10 }, (_, i) => ({ googlePlaceId: 'p' + (i % 7), name: 'P' + i, address: '' }));
  const result = await suggestFromCaption('📍 Some Place', many, { maxResults: 4 });
  assert.equal(result.suggestions.length, 4);
  assert.equal(new Set(result.suggestions.map((p) => p.googlePlaceId)).size, 4);
});

test('caption to suggestions with the built-in demo list (no Google key needed)', async () => {
  const { searchPlaces } = app('src/places/search.js');
  const search = (q) => searchPlaces(q, 'token');
  const tea = await suggestFromCaption('📍 Arabian Tea House, Al Fahidi Historical District\n#dubai #foodie', search);
  assert.equal(tea.suggestions[0].name, 'Arabian Tea House');
  const kite = await suggestFromCaption('Sunset session at Kite Beach in Jumeirah 🌅 #KiteBeach', search);
  assert.equal(kite.suggestions[0].name, 'Kite Beach');
  const mall = await suggestFromCaption('Shopping day at The Dubai Mall 🛍️', search);
  assert.ok(mall.suggestions.some((p) => p.name === 'The Dubai Mall'));
});

test('a search that fails (no internet) is reported to the app, not swallowed', async () => {
  await assert.rejects(
    suggestFromCaption('📍 Zuma Dubai', async () => { throw new Error('network down'); }),
    /network down/
  );
});
