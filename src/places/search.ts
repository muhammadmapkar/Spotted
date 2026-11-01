import { DEMO_PLACES } from './demoPlaces';
import { PlacesBackend, googleAutocomplete, googlePlaceDetails } from './google';
import { DUBAI_BIAS, PlaceResult, PlaceSuggestion, SearchBias } from './types';

// Where do place searches go? (See .env.example.)
//  1. EXPO_PUBLIC_PLACES_PROXY_URL set -> our own small server (server/places-proxy) holds the
//     Google key. USE THIS for builds you give to other people or put in a store.
//  2. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY set -> the app talks to Google directly. Fine for your own
//     testing, but the key is inside the app and can be extracted by anyone who has it.
//  3. Neither -> a small built-in list of Dubai places (free, no key).
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const PROXY_URL = (process.env.EXPO_PUBLIC_PLACES_PROXY_URL ?? '').replace(/\/+$/, '');
// Optional password for the proxy (server/places-proxy/README.md). Empty = the proxy has none.
const PROXY_SECRET = process.env.EXPO_PUBLIC_PLACES_PROXY_SECRET ?? '';

const backend: PlacesBackend | null = PROXY_URL
  ? { baseUrl: `${PROXY_URL}/v1`, headers: PROXY_SECRET ? { 'X-Spotted-Key': PROXY_SECRET } : {} }
  : API_KEY
    ? { baseUrl: 'https://places.googleapis.com/v1', headers: { 'X-Goog-Api-Key': API_KEY } }
    : null;

export const SEARCH_IS_DEMO = backend === null;

// Google needs at least this many letters before we search (saves money).
const MIN_LETTERS = 3;

// Find places for what the user typed, preferring places near `bias`.
export async function searchPlaces(
  query: string,
  sessionToken: string,
  bias: SearchBias = DUBAI_BIAS
): Promise<PlaceSuggestion[]> {
  const text = query.trim();
  if (!backend) return searchDemo(text);
  if (text.length < MIN_LETTERS) return [];
  return googleAutocomplete(backend, text, bias, sessionToken);
}

// Get the full details (including map position) of a picked place.
export async function getPlaceDetails(
  suggestion: PlaceSuggestion,
  sessionToken: string
): Promise<PlaceResult> {
  if (!backend) {
    const found = DEMO_PLACES.find((p) => p.googlePlaceId === suggestion.googlePlaceId);
    if (!found) throw new Error('Place not found');
    return found;
  }
  return googlePlaceDetails(backend, suggestion, sessionToken);
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
