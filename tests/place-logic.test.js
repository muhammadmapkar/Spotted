// The rules behind the Place page: the line under the name, the Google Maps link, the influencer
// recommendations, the offers, and which menu viewer is used.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');
const mock = app('src/data/mock.js');
const rules = app('src/place/placeData.js');
const place = (id) => mock.placeById(id);

test('the line under the name: category, price per person, distance', () => {
  assert.equal(rules.placeSubtitle(place('saffron')), 'Indian · AED 35–80 per person · 1.2 km away');
  assert.equal(rules.placeSubtitle(place('shawarma')), 'Arabic · AED 12–35 per person · 13 km away');
});

test('the save message says which folder, or that it was removed', () => {
  assert.equal(rules.saveToast(place('luma'), true), 'Saved to Shopping');
  assert.equal(rules.saveToast(place('glow'), true), 'Saved to Fun');
  assert.equal(rules.saveToast(place('saffron'), false), 'Removed from saved');
});

test('Google Maps link: the exact format, with the place id only when there is one', () => {
  const real = { ...place('saffron'), latitude: 24.4123, longitude: 54.5678, googlePlaceId: 'ChIJabc123' };
  assert.equal(rules.mapsUrl(real), 'https://www.google.com/maps/search/?api=1&query=24.4123,54.5678&query_place_id=ChIJabc123');
  const noId = { ...real, googlePlaceId: undefined };
  assert.equal(rules.mapsUrl(noId), 'https://www.google.com/maps/search/?api=1&query=24.4123,54.5678');
  assert.ok(!rules.mapsUrl(noId).includes('query_place_id'));
  // a place id with odd characters cannot break the link
  assert.ok(rules.mapsUrl({ ...real, googlePlaceId: 'a b&c' }).endsWith('&query_place_id=a%20b%26c'));
});

test('sample places get a position from their distance and direction', () => {
  const a = rules.coordinatesOf(place('saffron'));
  const b = rules.coordinatesOf(place('shawarma'));
  assert.ok(Math.abs(a.latitude - 24.42) < 0.05 && Math.abs(a.longitude - 54.58) < 0.05, 'near the sample area');
  assert.notDeepStrictEqual(a, b, 'different places, different positions');
  // 1.2 km is about 0.011 degrees; 13.4 km about 0.12
  const km = (c) => Math.hypot((c.latitude - 24.42) * 111, (c.longitude - 54.58) * 111 * Math.cos((24.42 * Math.PI) / 180));
  assert.ok(Math.abs(km(a) - 1.2) < 0.05, `1.2 km (got ${km(a)})`);
  assert.ok(Math.abs(km(b) - 13.4) < 0.1, `13.4 km (got ${km(b)})`);
  // a real position always wins
  assert.deepStrictEqual(rules.coordinatesOf({ ...place('saffron'), latitude: 1, longitude: 2 }), { latitude: 1, longitude: 2 });
});

test('only web links are ever opened', () => {
  assert.equal(rules.safeWebUrl('https://example.com/a.pdf'), 'https://example.com/a.pdf');
  assert.equal(rules.safeWebUrl('  http://example.com  '), 'http://example.com');
  for (const bad of ['', undefined, null, 'javascript:alert(1)', 'file:///etc/passwd', 'tel:+971500000000', 'example.com', 'https://a b.com', 'intent://x#Intent;end']) {
    assert.equal(rules.safeWebUrl(bad), null, String(bad));
  }
});

test('recommendations: the influencers who recommend the place, with items, prices and a reel link', () => {
  const recs = rules.recommendationsFor(place('saffron'));
  assert.deepStrictEqual(recs.map((r) => r.handle), ['capital.bites', 'forkful.ad', 'thelunchmap', 'spice.trail.uae', 'the.sweet.stop']);
  const first = recs[0];
  assert.equal(first.platform, 'ig');
  assert.equal(first.platformLabel, 'Instagram');
  assert.equal(first.followers, '48.2K');
  assert.ok(first.items.length >= 1 && first.items.length <= 2);
  for (const item of first.items) assert.ok(place('saffron').menu.some((m) => m.name === item.name && m.price === item.price), 'items come from the menu, with the menu price');
  assert.equal(first.profilePicUrl, null, 'no picture: the screen draws gradient + initial');
  // the TikTok-first influencer uses TikTok
  const lunch = recs.find((r) => r.handle === 'thelunchmap');
  assert.equal(lunch.platform, 'tt');
  assert.equal(lunch.reelUrl, 'https://www.tiktok.com/@thelunchmap');
  assert.equal(recs.find((r) => r.handle === 'forkful.ad').reelUrl, 'https://www.instagram.com/forkful.ad/');
  assert.deepStrictEqual(rules.recommendationsFor(place('glow')).map((r) => r.handle), ['rackandrail.ad', 'weekend.plans.ad']);
});

test('a place nobody recommends has no recommendations', () => {
  assert.deepStrictEqual(rules.recommendationsFor({ ...place('saffron'), id: 'nobody' }), []);
});

test('the exact reel and the profile picture are used when the data has them', () => {
  const original = mock.INFLUENCERS[0];
  original.reels = { saffron: 'https://www.instagram.com/reel/ABC123/' };
  original.profilePicUrl = 'https://cdn.example.com/capital.jpg';
  try {
    const first = rules.recommendationsFor(place('saffron'))[0];
    assert.equal(first.reelUrl, 'https://www.instagram.com/reel/ABC123/');
    assert.equal(first.profilePicUrl, 'https://cdn.example.com/capital.jpg');
    // the reel is per place: another place falls back to the profile page
    assert.equal(rules.recommendationsFor(place('stack')).find((r) => r.handle === 'capital.bites').reelUrl, 'https://www.instagram.com/capital.bites/');
    // a bad link in the data is ignored
    original.reels = { saffron: 'javascript:alert(1)' };
    original.profilePicUrl = 'file:///x.jpg';
    const safe = rules.recommendationsFor(place('saffron'))[0];
    assert.equal(safe.reelUrl, 'https://www.instagram.com/capital.bites/');
    assert.equal(safe.profilePicUrl, null);
  } finally {
    delete original.reels;
    delete original.profilePicUrl;
  }
});

test('offers: counts and badges', () => {
  assert.equal(rules.offerCount(place('saffron')), 4);
  assert.equal(rules.offerCount(place('taco')), 0);
  assert.equal(rules.offerCount(place('glow')), 1);
  assert.deepStrictEqual(rules.offerBadge({ source: 'Esaad', text: 'x' }), { label: 'Esaad', kind: 'esaad' });
  assert.deepStrictEqual(rules.offerBadge({ source: 'Fazaa', text: 'x' }), { label: 'Fazaa', kind: 'fazaa' });
  assert.deepStrictEqual(rules.offerBadge({ source: 'Spotted', title: 'Stamp card', text: 'x' }), { label: 'Stamp card', kind: 'spotted' });
  assert.equal(rules.NO_PARTNER_OFFERS, 'No Fazaa or Esaad discount here yet.');
  assert.equal(rules.NO_SPOTTED_OFFERS, 'Spotted offers appear once this place becomes a Spotted Partner.');
  assert.equal(rules.NO_RECOMMENDATIONS, 'No influencer has spotted this place yet.');
});

test('menu viewer: no PDF means the paper menu', () => {
  assert.deepStrictEqual(rules.menuViewFor(place('saffron'), 'android'), { kind: 'paper' });
  assert.deepStrictEqual(rules.menuViewFor({ ...place('saffron'), menuPdfUrl: 'javascript:alert(1)' }, 'android'), { kind: 'paper' }, 'an unsafe link is not used');
});

test('menu viewer: Android wraps the PDF in a viewer, iPhone shows it directly', () => {
  const withPdf = { ...place('saffron'), menuPdfUrl: 'https://cdn.example.com/menus/Saffron Lane.pdf'.replace(' ', '%20') };
  const android = rules.menuViewFor(withPdf, 'android');
  assert.equal(android.kind, 'pdf');
  assert.equal(android.pdfUrl, 'https://cdn.example.com/menus/Saffron%20Lane.pdf');
  assert.equal(android.viewerUri, 'https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent('https://cdn.example.com/menus/Saffron%20Lane.pdf'));
  assert.equal(android.fileName, 'Saffron Lane.pdf');
  const ios = rules.menuViewFor(withPdf, 'ios');
  assert.equal(ios.viewerUri, 'https://cdn.example.com/menus/Saffron%20Lane.pdf');
});

test('file names: from the link, or made from the place name', () => {
  assert.equal(rules.pdfFileName('https://x.com/a/menu.pdf?v=2#page=1', 'X'), 'menu.pdf');
  assert.equal(rules.pdfFileName('https://x.com/menu', 'Stack Burger Co.'), 'Stack-Burger-Co-menu.pdf');
  assert.equal(rules.pdfFileName('https://x.com/%E0%A4%A.pdf', 'Brew Theory'), 'Brew-Theory-menu.pdf', 'a badly encoded link does not crash');
  assert.equal(rules.paperFileName(place('brew')), 'Brew-Theory-menu.pdf');
});

test('hero: the photo when there is a usable link, otherwise the drawn shop front', () => {
  assert.equal(rules.heroPhotoUrl(place('saffron')), null);
  assert.equal(rules.heroPhotoUrl({ ...place('saffron'), photoUrl: 'https://cdn.example.com/front.jpg' }), 'https://cdn.example.com/front.jpg');
  assert.equal(rules.heroPhotoUrl({ ...place('saffron'), photoUrl: 'data:text/html,hi' }), null);
});
