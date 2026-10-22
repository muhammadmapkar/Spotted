// The Map tab's rules: which pins, where they go, the circle, the card text and the dark map style.
const test = require('node:test');
const assert = require('node:assert');
const { app } = require('./helpers/fakes');
const mock = app('src/data/mock.js');
const rules = app('src/map/mapData.js');
const style = app('src/map/mapStyle.js');
const placeData = app('src/place/placeData.js');
const theme = app('constants/Theme.js');

const startSaved = () => new Set(mock.PLACES.filter((p) => p.saved).map((p) => p.id));
const kmBetween = (a, b) => Math.hypot((a.latitude - b.latitude) * 111, (a.longitude - b.longitude) * 111 * Math.cos((a.latitude * Math.PI) / 180));

test('pins: saved places are red bookmarks, unsaved Spotted Partners are purple pins, nothing else', () => {
  const pins = rules.mapPins(startSaved());
  const byId = Object.fromEntries(pins.map((p) => [p.place.id, p.kind]));
  // all ten saved places, plus the unsaved partners glow, casa and dune
  assert.deepStrictEqual(Object.keys(byId).sort(), ['brew', 'casa', 'dune', 'forno', 'glow', 'kaze', 'luma', 'saffron', 'shawarma', 'stack', 'starlight', 'taco', 'thread'].sort());
  assert.equal(byId.saffron, 'saved');
  assert.equal(byId.kaze, 'saved', 'a saved partner is a red bookmark');
  assert.equal(byId.glow, 'partner');
  assert.equal(byId.casa, 'partner');
  assert.equal(byId.dune, 'partner');
  assert.ok(!('masala' in byId) && !('kiln' in byId), 'unsaved non-partners have no pin');
});

test('saving or un-saving changes the pins', () => {
  const saved = startSaved();
  saved.add('masala');
  assert.equal(rules.mapPins(saved).find((p) => p.place.id === 'masala').kind, 'saved');
  saved.delete('glow');
  assert.equal(rules.mapPins(saved).find((p) => p.place.id === 'glow').kind, 'partner', 'still a partner pin');
  saved.delete('saffron');
  assert.equal(rules.mapPins(saved).find((p) => p.place.id === 'saffron').kind, 'partner');
  saved.delete('luma');
  assert.ok(!rules.mapPins(saved).some((p) => p.place.id === 'luma'), 'an unsaved non-partner disappears');
});

test('only places within 15 km get a pin', () => {
  const far = { ...mock.placeById('saffron'), id: 'far', dist: 15.5 };
  const edge = { ...mock.placeById('saffron'), id: 'edge', dist: 15 };
  const pins = rules.mapPins(new Set(['far', 'edge']), [far, edge]);
  assert.deepStrictEqual(pins.map((p) => p.place.id), ['edge']);
});

test('the pins pop in one by one, 70 ms apart', () => {
  const pins = rules.mapPins(startSaved());
  assert.deepStrictEqual(pins.map((p) => p.delay), pins.map((_, i) => 200 + i * 70));
});

test('a sample pin is as far from the user as the place says, in the right direction', () => {
  const center = { latitude: 25.2, longitude: 55.27 };
  for (const place of mock.PLACES) {
    const at = rules.pinCoordinates(center, place);
    assert.ok(Math.abs(kmBetween(center, at) - place.dist) < 0.05, `${place.id} is ${place.dist} km away`);
  }
  const east = rules.pinCoordinates(center, { dist: 10, ang: 90 });
  assert.ok(east.longitude > center.longitude && Math.abs(east.latitude - center.latitude) < 0.001, 'angle 90 is east');
  const north = rules.pinCoordinates(center, { dist: 10, ang: 0 });
  assert.ok(north.latitude > center.latitude);
  // a place with a real position keeps it
  assert.deepStrictEqual(rules.pinCoordinates(center, { ...mock.placeById('brew'), latitude: 1.5, longitude: 2.5 }), { latitude: 1.5, longitude: 2.5 });
});

test('the place page and the map agree around the sample area', () => {
  const place = mock.placeById('stack');
  assert.deepStrictEqual(placeData.coordinatesOf(place), rules.pinCoordinates(placeData.SAMPLE_CENTER, place));
});

test('the first view shows the whole 15 km circle', () => {
  const center = { latitude: 25.2, longitude: 55.27 };
  const region = rules.startRegion(center);
  assert.equal(region.latitude, 25.2);
  assert.equal(region.longitude, 55.27);
  assert.ok(region.latitudeDelta * 111 >= 30, 'at least the 30 km across the circle');
  assert.ok(region.longitudeDelta * 111 * Math.cos((25.2 * Math.PI) / 180) >= 30);
  assert.equal(rules.circleMeters, 15000);
  assert.equal(rules.MAP_RADIUS_KM, 15);
});

test('drawn map: a place twice as far is drawn twice as far from the dot; 15 km reaches the circle', () => {
  const far = rules.sketchOffset({ dist: 15, ang: 0 }, 160);
  assert.deepStrictEqual(far, { x: 160, y: 0 });
  const half = rules.sketchOffset({ dist: 7.5, ang: 90 }, 160);
  assert.deepStrictEqual(half, { x: 0, y: 80 });
  const up = rules.sketchOffset({ dist: 15, ang: -90 }, 160);
  assert.deepStrictEqual(up, { x: 0, y: -160 });
  assert.deepStrictEqual(rules.sketchOffset({ dist: 0, ang: 33 }, 160), { x: 0, y: 0 });
});

test('words: the chip, the legend and the card lines', () => {
  assert.equal(rules.MAP_CHIP, '15 km around you');
  assert.deepStrictEqual(rules.LEGEND.map((l) => l.label), ['Saved', 'Spotted Partner', 'You']);
  assert.equal(rules.cardLine(mock.placeById('saffron')), 'Indian · AED 35–80 pp');
  assert.equal(rules.cardDistance(mock.placeById('saffron')), '1.2 km away');
});

test('dark mode uses a custom map style in the Spotted dark colours; light mode uses the normal map', () => {
  assert.equal(style.mapStyleFor('light', theme.darkPalette), undefined);
  const dark = style.mapStyleFor('dark', theme.darkPalette);
  const colours = JSON.stringify(dark);
  for (const wanted of [theme.darkPalette.mapLand, theme.darkPalette.mapRoad, theme.darkPalette.mapWater, theme.darkPalette.mapPark, theme.darkPalette.bg]) assert.ok(colours.includes(wanted), wanted);
  const water = dark.find((r) => r.featureType === 'water');
  assert.equal(water.stylers[0].color, theme.darkPalette.mapWater);
  assert.ok(dark.every((rule) => Array.isArray(rule.stylers) && rule.stylers.every((s) => /^#[0-9A-Fa-f]{6}$/.test(s.color))), 'every rule is a valid Google style rule');
});
