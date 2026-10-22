// The filter sheet and its rules. The REAL sheet runs with pretend phone parts, so we can check what it
// shows, how the slider, chips and switches change the shared filters, and the live "Show N places" button.
const test = require('node:test');
const assert = require('node:assert');
const { app, installFakes, setupReact } = require('./helpers/fakes');
const { React, mount, act } = setupReact();

const mock = app('src/data/mock.js');
const rules = app('src/home/homeData.js');
const store = app('src/state/filters.js');

const rec = { modal: null, slider: null, pressables: [], switches: [], texts: [], dismissed: 0, timing: null, reduce: false, scroll: 0 };
const palette = new Proxy({}, { get: () => '#000000' });

installFakes({
  '@gorhom/bottom-sheet': {
    BottomSheetModal: React.forwardRef((props, ref) => {
      rec.modal = props;
      React.useImperativeHandle(ref, () => ({ dismiss: () => { rec.dismissed++; }, present: () => {} }));
      return props.children;
    }),
    BottomSheetBackdrop: (props) => React.createElement('backdrop', props),
    BottomSheetScrollView: (props) => { rec.scroll++; return props.children; },
    useBottomSheetTimingConfigs: (config) => { rec.timing = config; return config; },
  },
  '@react-native-community/slider': { __esModule: true, default: (props) => { rec.slider = props; return null; } },
  'react-native': {
    StyleSheet: { create: (x) => x },
    View: (props) => props.children ?? null,
    Pressable: (props) => { rec.pressables.push(props); return typeof props.children === 'function' ? props.children({ pressed: false }) : props.children ?? null; },
    Switch: (props) => { rec.switches.push(props); return null; },
  },
  'react-native-reanimated': { useReducedMotion: () => rec.reduce },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
  '@/src/theme/ThemeProvider': { useTheme: () => ({ palette, scheme: 'light' }) },
  '@/src/components/ui/ui': { AppText: (props) => { rec.texts.push([props.children].flat(Infinity).join('')); return null; } },
  '@/src/data/mock': mock,
  '@/src/home/homeData': rules,
  '@/src/state/filters': store,
});
installFakes({ '@/src/components/ui/TapSwitch': app('src/components/ui/TapSwitch.js') });
const { FilterSheet } = app('src/components/filters/FilterSheet.js');

const matchCount = (f) => rules.nearbyMatchCount(mock.PLACES, f);
const sheetRef = { current: null };
test.beforeEach(() => { store.resetFilters(); Object.assign(rec, { modal: null, slider: null, pressables: [], switches: [], texts: [], dismissed: 0, timing: null, reduce: false, scroll: 0 }); });

const open = [];
async function show() {
  const real = await mount(React.createElement(FilterSheet, { sheetRef, matchCount }));
  let closed = false;
  const screen = { unmount: async () => { if (!closed) { closed = true; await real.unmount(); } } };
  open.push(screen);
  return screen;
}
test.afterEach(async () => { for (const screen of open.splice(0)) await screen.unmount(); });
// the most recently drawn button whose text is `label` (a chip, "Reset"...)
const textOf = (p) => (p.children && p.children.props ? p.children.props.children : undefined);
const tapChip = async (label) => {
  const found = [...rec.pressables].reverse().find((p) => textOf(p) === label);
  assert.ok(found, `a button "${label}"`);
  await act(async () => { found.onPress(); });
};
const chipState = (label) => [...rec.pressables].reverse().find((p) => textOf(p) === label).accessibilityState.selected;
const lastText = (predicate) => [...rec.texts].reverse().find(predicate);

// ---- the rules -------------------------------------------------------------------------------

test('budget label: "Any budget" at the top, otherwise "Up to AED n"', () => {
  assert.equal(rules.budgetLabel(500), 'Any budget');
  assert.equal(rules.budgetLabel(499), 'Up to AED 499');
  assert.equal(rules.budgetLabel(150), 'Up to AED 150');
  assert.equal(rules.budgetLabel(20), 'Up to AED 20');
});

test('the slider value is snapped to whole steps between AED 20 and AED 500', () => {
  assert.equal(rules.snapBudget(154), 150);
  assert.equal(rules.snapBudget(155), 160);
  assert.equal(rules.snapBudget(7), 20);
  assert.equal(rules.snapBudget(-50), 20);
  assert.equal(rules.snapBudget(999), 500);
  assert.equal(rules.snapBudget(500), 500);
  assert.equal(rules.MIN_BUDGET, 20);
  assert.equal(rules.BUDGET_STEP, 10);
});

test('a place passes the budget if its LOWEST price per person is within it', () => {
  const luma = mock.placeById('luma'); // AED 120 to 400
  const f = (budget) => ({ ...rules.NO_FILTERS, budget });
  assert.equal(rules.passesFilters(luma, f(120)), true, 'exactly the lowest price');
  assert.equal(rules.passesFilters(luma, f(119)), false);
  assert.equal(rules.passesFilters(luma, f(500)), true, '500 means any budget');
  assert.equal(rules.passesFilters(mock.placeById('stack'), f(40)), true, 'stack starts at 40 even though it goes up to 90');
});

test('the button text: "Show N places", and "Show 1 place"', () => {
  assert.equal(rules.showPlacesLabel(12), 'Show 12 places');
  assert.equal(rules.showPlacesLabel(1), 'Show 1 place');
  assert.equal(rules.showPlacesLabel(0), 'Show 0 places');
});

test('the live count only counts places within 15 km that pass every filter', () => {
  assert.equal(matchCount(rules.NO_FILTERS), 15);
  assert.equal(matchCount({ ...rules.NO_FILTERS, budget: 50 }), 12);
  assert.equal(matchCount({ ...rules.NO_FILTERS, dist: 5, cat: 'Food' }), 4);
  assert.equal(matchCount({ ...rules.NO_FILTERS, infl: true, offers: true }), mock.PLACES.filter((p) => rules.withinNear([p]).length && rules.passesFilters(p, { ...rules.NO_FILTERS, infl: true, offers: true })).length);
  assert.equal(matchCount({ ...rules.NO_FILTERS, dist: 1 }), 0);
});

// ---- the sheet -------------------------------------------------------------------------------

test('first look: every control in its starting position', async () => {
  const screen = await show();
  for (const wanted of ['Filters', 'Reset', 'How much do you want to spend today?', 'Any budget', 'per person', 'Distance', 'Category', 'Spotted by influencers only', 'Has offers (Fazaa, Esaad, Spotted)', 'Show 15 places']) {
    assert.ok(rec.texts.includes(wanted), `shows "${wanted}"`);
  }
  for (const chipText of ['1 km', '5 km', '10 km', '15 km', 'All', 'Food', 'Shopping', 'Fun', 'Indian', 'Mexican', 'Café']) assert.ok(rec.texts.includes(chipText), chipText);
  assert.deepStrictEqual([rec.slider.minimumValue, rec.slider.maximumValue, rec.slider.step, rec.slider.value], [20, 500, 10, 500]);
  assert.deepStrictEqual(rec.switches.map((s) => s.value), [false, false]);
  assert.equal(rec.modal.snapPoints[0], '88%');
  await screen.unmount();
});

test('sliding changes the budget live: the big number and the button follow', async () => {
  const screen = await show();
  await act(async () => { rec.slider.onValueChange(154); });
  assert.equal(store.getFilters().budget, 150, 'snapped to a step');
  assert.equal(lastText((t) => t.startsWith('Up to')), 'Up to AED 150');
  assert.equal(lastText((t) => t.startsWith('Show')), 'Show 15 places', 'every place starts at AED 120 or less');
  await act(async () => { rec.slider.onValueChange(50); });
  assert.equal(lastText((t) => t.startsWith('Up to')), 'Up to AED 50');
  assert.equal(lastText((t) => t.startsWith('Show')), 'Show 12 places');
  await act(async () => { rec.slider.onValueChange(20); });
  const cheap = mock.PLACES.filter((p) => p.dist <= 15 && p.lo <= 20).map((p) => p.id).sort();
  assert.deepStrictEqual(cheap, ['brew', 'dune', 'kiln', 'shawarma']);
  assert.equal(lastText((t) => t.startsWith('Show')), 'Show 4 places', 'Brew Theory, Dune Coffee, Kiln Bakery and Shawarma Station');
  await act(async () => { rec.slider.onValueChange(500); });
  assert.equal(lastText((t) => t.endsWith('budget')), 'Any budget');
  await screen.unmount();
});

test('distance chips: one at a time, and the chosen one is marked', async () => {
  const screen = await show();
  assert.equal(chipState('15 km'), true);
  assert.equal(chipState('5 km'), false);
  await tapChip('5 km');
  assert.equal(store.getFilters().dist, 5);
  assert.equal(chipState('5 km'), true);
  assert.equal(chipState('15 km'), false, 'only one is chosen');
  assert.equal(lastText((t) => t.startsWith('Show')), 'Show 4 places', 'saffron, brew, taco and stack are within 5 km');
  await tapChip('1 km');
  assert.equal(store.getFilters().dist, 1);
  assert.equal(lastText((t) => t.startsWith('Show')), 'Show 0 places');
  await screen.unmount();
});

test('category chips: All, Food, Shopping, Fun, Indian, Mexican, Cafe', async () => {
  const screen = await show();
  assert.equal(chipState('All'), true);
  for (const category of ['Food', 'Shopping', 'Fun', 'Indian', 'Mexican', 'Café']) {
    await tapChip(category);
    assert.equal(store.getFilters().cat, category, category);
    assert.equal(chipState(category), true);
    assert.equal(chipState('All'), false);
  }
  await tapChip('All');
  assert.equal(store.getFilters().cat, 'All');
  await tapChip('Café');
  await tapChip('5 km');
  assert.equal(lastText((t) => t.startsWith('Show')), 'Show 1 place', 'only Brew Theory is a cafe within 5 km');
  await screen.unmount();
});

test('the two switches change the filters', async () => {
  const screen = await show();
  await act(async () => { rec.switches[0].onValueChange(true); });
  assert.deepStrictEqual([store.getFilters().infl, store.getFilters().offers], [true, false]);
  assert.equal(rec.switches.at(-2).value, true, 'the first switch shows on');
  await act(async () => { rec.switches[1].onValueChange(true); });
  assert.deepStrictEqual([store.getFilters().infl, store.getFilters().offers], [true, true]);
  await act(async () => { rec.switches[0].onValueChange(false); });
  assert.deepStrictEqual([store.getFilters().infl, store.getFilters().offers], [false, true]);
  const switchButtons = rec.pressables.filter((p) => p.accessibilityRole === 'switch');
  assert.deepStrictEqual([...new Set(switchButtons.map((p) => p.accessibilityLabel))], ['Spotted by influencers only', 'Has offers (Fazaa, Esaad, Spotted)'], 'each switch is one button with a name');
  assert.equal(switchButtons.at(-1).accessibilityState.checked, true, 'the offers switch is on');
  switchButtons.at(-2).onPress();
  assert.equal(store.getFilters().infl, true, 'tapping the bigger button flips the switch');
  await screen.unmount();
});

test('Reset puts every control back', async () => {
  const screen = await show();
  await act(async () => { store.setFilters({ budget: 60, dist: 5, cat: 'Food', infl: true, offers: true }); });
  assert.equal(lastText((t) => t.startsWith('Up to')), 'Up to AED 60');
  const reset = [...rec.pressables].reverse().find((p) => p.accessibilityLabel === 'Reset all filters');
  await act(async () => { reset.onPress(); });
  assert.deepStrictEqual(store.getFilters(), rules.NO_FILTERS);
  assert.equal(lastText((t) => t.endsWith('budget')), 'Any budget');
  assert.equal(rec.slider.value, 500);
  assert.deepStrictEqual(rec.switches.slice(-2).map((s) => s.value), [false, false]);
  assert.equal(lastText((t) => t.startsWith('Show')), 'Show 15 places');
  await screen.unmount();
});

test('the big button closes the sheet; so does tapping the dark area', async () => {
  const screen = await show();
  sheetRef.current = { dismiss: () => { rec.dismissed++; } };
  const cta = [...rec.pressables].reverse().find((p) => typeof p.style === 'function');
  cta.onPress();
  assert.equal(rec.dismissed, 1);
  const backdrop = rec.modal.backdropComponent({ animatedIndex: 0 });
  assert.equal(backdrop.props.pressBehavior, 'close');
  assert.equal(backdrop.props.disappearsOnIndex, -1);
  await screen.unmount();
});

test('with Reduce Motion the sheet opens at once; otherwise it slides for 0.4 s', async () => {
  let screen = await show();
  assert.equal(rec.timing.duration, 400);
  await screen.unmount();
  rec.reduce = true;
  screen = await show();
  assert.equal(rec.timing.duration, 0);
  await screen.unmount();
});

test('the shared filters: a change made elsewhere shows on the sheet at once', async () => {
  const screen = await show();
  await act(async () => { store.setFilters({ budget: 80, cat: 'Fun' }); });
  assert.equal(rec.slider.value, 80);
  assert.equal(chipState('Fun'), true);
  await screen.unmount();
});
