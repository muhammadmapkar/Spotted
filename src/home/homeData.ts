import { INFLUENCERS, Influencer, PLACES, PLATFORM_NAMES, Place, hasOffers, recsFor } from '../data/mock';

// The rules behind the Home screen, kept apart from the drawing so they can be tested.
// They follow the prototype's script (pass, matches, sortPartnerFirst, the stories row, the feed).

export const NEAR_KM = 15; // "near you" means within 15 km
export const HOT_RING_KM = 5; // closer than this gets the bright animated ring
export const MAX_STORIES = 10;
export const ANY_BUDGET = 500; // the slider's top value means "any budget"
export const MIN_BUDGET = 20;
export const BUDGET_STEP = 10;

// ---- filters ---------------------------------------------------------------------------------

export interface Filters {
  budget: number; // AED per person; 500 = any budget
  dist: number; // km
  cat: string; // 'All', a group (Food, Shopping, Fun) or a category (Indian, Café...)
  infl: boolean; // only places influencers recommend
  offers: boolean; // only places with offers
}

export const NO_FILTERS: Filters = { budget: ANY_BUDGET, dist: NEAR_KM, cat: 'All', infl: false, offers: false };

// Does the place pass the filters? A place is within budget if its LOWEST price per person fits.
export function passesFilters(place: Place, f: Filters): boolean {
  if (f.budget < ANY_BUDGET && place.lo > f.budget) return false;
  if (place.dist > f.dist) return false;
  if (f.cat !== 'All' && place.group !== f.cat && place.cat !== f.cat) return false;
  if (f.infl && recsFor(place.id).length === 0) return false;
  if (f.offers && !hasOffers(place)) return false;
  return true;
}

// What the sheet shows above the slider: "Any budget" or "Up to AED 150".
export const budgetLabel = (budget: number): string => (budget >= ANY_BUDGET ? 'Any budget' : `Up to AED ${budget}`);

// The slider hands us any number; make it a whole step between AED 20 and AED 500.
export function snapBudget(value: number): number {
  const stepped = Math.round(value / BUDGET_STEP) * BUDGET_STEP;
  return Math.min(ANY_BUDGET, Math.max(MIN_BUDGET, stepped));
}

// The text on the big button of the filter sheet: "Show 12 places" ("Show 1 place").
export const showPlacesLabel = (count: number): string => `Show ${count} ${count === 1 ? 'place' : 'places'}`;

// How many nearby places pass the filters (the live number on the sheet's button).
export const nearbyMatchCount = (places: Place[], filters: Filters): number => withinNear(places).filter((p) => passesFilters(p, filters)).length;

// The removable chips under the search bar. `clear` is what to change to remove that filter.
export interface FilterChip {
  key: keyof Filters;
  label: string;
  clear: Partial<Filters>;
}

export function activeFilterChips(f: Filters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.budget < ANY_BUDGET) chips.push({ key: 'budget', label: `Under AED ${f.budget} pp`, clear: { budget: ANY_BUDGET } });
  if (f.dist < NEAR_KM) chips.push({ key: 'dist', label: `Within ${f.dist} km`, clear: { dist: NEAR_KM } });
  if (f.cat !== 'All') chips.push({ key: 'cat', label: f.cat, clear: { cat: 'All' } });
  if (f.infl) chips.push({ key: 'infl', label: 'Influencer picks', clear: { infl: false } });
  if (f.offers) chips.push({ key: 'offers', label: 'Has offers', clear: { offers: false } });
  return chips;
}

// ---- sorting and lists -----------------------------------------------------------------------

// Spotted Partners first, then nearest first.
export function sortPartnerFirst(list: Place[]): Place[] {
  return [...list].sort((a, b) => (a.partner === b.partner ? a.dist - b.dist : a.partner ? -1 : 1));
}

export const withinNear = (places: Place[]): Place[] => places.filter((p) => p.dist <= NEAR_KM);

// The row of circles: the user's SAVED places within 15 km, nearest first, at most 10.
export interface Story {
  place: Place;
  ring: 'hot' | 'soft'; // hot = under 5 km (bright, animated); soft = 5 to 15 km
}

export function storiesFor(places: Place[], savedIds: ReadonlySet<string>): Story[] {
  return withinNear(places)
    .filter((p) => savedIds.has(p.id))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, MAX_STORIES)
    .map((place) => ({ place, ring: place.dist < HOT_RING_KM ? 'hot' : 'soft' }));
}

// "Explore nearby": every place within 15 km that passes the filters, Spotted Partners first.
export function exploreFeed(places: Place[], filters: Filters): Place[] {
  return sortPartnerFirst(withinNear(places).filter((p) => passesFilters(p, filters)));
}

// ---- search ----------------------------------------------------------------------------------

// Does what the user typed match the place's name, category, group, tags or any menu item?
export function matchesQuery(place: Place, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [place.name, place.cat, place.group, place.tags, ...place.menu.map((m) => m.name)].join(' ').toLowerCase();
  return haystack.includes(q);
}

// Influencers are found by their handle.
export function matchInfluencers(query: string, influencers: Influencer[] = INFLUENCERS): Influencer[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return influencers.filter((i) => i.handle.toLowerCase().includes(q));
}

// Searching looks at ALL nearby places (not only saved ones). Influencers are shown first by the screen.
export function searchHome(
  query: string,
  filters: Filters,
  places: Place[] = PLACES,
  influencers: Influencer[] = INFLUENCERS
): { influencers: Influencer[]; places: Place[] } {
  return {
    influencers: matchInfluencers(query, influencers),
    places: sortPartnerFirst(withinNear(places).filter((p) => matchesQuery(p, query) && passesFilters(p, filters))),
  };
}

// ---- text on the cards -----------------------------------------------------------------------

export const priceRange = (place: Place): string => `AED ${place.lo}–${place.hi}`;
export const categoryLine = (place: Place): string => `${place.cat} · ${priceRange(place)} pp`;
export const resultsTitle = (count: number): string => `Places · ${count} ${count === 1 ? 'result' : 'results'}`;
export const platformText = (influencer: Influencer): string => influencer.platforms.map((k) => PLATFORM_NAMES[k]).join(' · ');
export const pickCount = (influencer: Influencer): number => influencer.picks.length + influencer.more.length;
