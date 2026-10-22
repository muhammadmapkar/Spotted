import { DEMO_PLACES } from './demoPlaces';
import { googleAutocomplete, googlePlaceDetails } from './google';
import { DUBAI_BIAS, PlaceResult, PlaceSuggestion, SearchBias } from './types';

// The Google key comes from the .env file (see .env.example). If it is empty,
// the app uses a small built-in list of Dubai places instead (free, no key).
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
export const SEARCH_IS_DEMO = API_KEY === '';

// Google needs at least this many letters before we search (saves money).
const MIN_LETTERS = 3;

// Find places for what the user typed, preferring places near `bias`.
export async function searchPlaces(
  query: string,
  sessionToken: string,
  bias: SearchBias = DUBAI_BIAS
): Promise<PlaceSuggestion[]> {
  const text = query.trim();
  if (SEARCH_IS_DEMO) return searchDemo(text);
  if (text.length < MIN_LETTERS) return [];
  return googleAutocomplete(API_KEY, text, bias, sessionToken);
}

// Get the full details (including map position) of a picked place.
export async function getPlaceDetails(
  suggestion: PlaceSuggestion,
  sessionToken: string
): Promise<PlaceResult> {
  if (SEARCH_IS_DEMO) {
    const found = DEMO_PLACES.find((p) => p.googlePlaceId === suggestion.googlePlaceId);
    if (!found) throw new Error('Place not found');
    return found;
  }
  return googlePlaceDetails(API_KEY, suggestion, sessionToken);
}

// Demo search: every word typed must appear in the name or address, in any order.
function searchDemo(text: string): PlaceSuggestion[] {
  // Ignore punctuation, so "Arabian Tea House, Al Fahidi" matches "Arabian Tea House".
  const plain = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const words = plain(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return DEMO_PLACES.filter((place) => {
    const haystack = plain(`${place.name} ${place.address}`);
    return words.every((word) => haystack.includes(word));
  }).slice(0, 8);
}
