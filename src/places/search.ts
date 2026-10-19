import { extractPlaceClues } from './clues';
import { DEMO_PLACES } from './demoPlaces';
import { PlacesBackend, googleAutocomplete, googlePlaceDetails, googleTextSearch } from './google';
import { DUBAI_BIAS, PlaceResult, PlaceSuggestion, SearchBias } from './types';

// Where do place searches go? (See .env.example.)
//  1. EXPO_PUBLIC_PLACES_PROXY_URL set -> our own small server (server/places-proxy) holds the
//     Google key. USE THIS for builds you give to other people or put in a store.
//  2. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY set -> the app talks to Google directly. Fine for your own
//     testing, but the key is inside the app and can be extracted by anyone who has it.
//  3. Neither -> a small built-in list of Dubai places (free, no key).
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const PROXY_URL = (process.env.EXPO_PUBLIC_PLACES_PROXY_URL ?? '').replace(/\/+$/, '');

const backend: PlacesBackend | null = PROXY_URL
  ? { baseUrl: `${PROXY_URL}/v1`, headers: {} }
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

// How many suggestions we show after reading a caption.
const MAX_SUGGESTIONS = 4;
// How many clues we search for (each one is one Google request, so we keep this small).
const MAX_CLUE_SEARCHES = 3;

// Read a caption and suggest which place it is about. The user always confirms.
// Never throws: if anything fails you just get an empty list and the normal search box stays.
export async function suggestPlacesFromCaption(
  caption: string,
  bias: SearchBias = DUBAI_BIAS
): Promise<PlaceResult[]> {
  try {
    if (!caption.trim()) return [];
    if (!backend) return suggestFromCaptionDemo(caption);

    const clues = extractPlaceClues(caption).slice(0, MAX_CLUE_SEARCHES);
    const answers = await Promise.all(clues.map((clue) => googleTextSearch(backend, clue.text, bias).catch(() => [])));

    // Best clue first; skip places we already have.
    const seen = new Set<string>();
    const suggestions: PlaceResult[] = [];
    for (const answer of answers) {
      for (const place of answer) {
        if (seen.has(place.googlePlaceId)) continue;
        seen.add(place.googlePlaceId);
        suggestions.push(place);
      }
    }
    return suggestions.slice(0, MAX_SUGGESTIONS);
  } catch {
    return [];
  }
}

// Demo search: every word typed must appear in the name or address, in any order.
function searchDemo(text: string): PlaceSuggestion[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return DEMO_PLACES.filter((place) => {
    const haystack = `${place.name} ${place.address}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  }).slice(0, 8);
}

// Demo suggestions (no Google key): a built-in place whose name appears in the caption.
function suggestFromCaptionDemo(caption: string): PlaceResult[] {
  const lower = caption.toLowerCase();
  return DEMO_PLACES.filter((place) => lower.includes(place.name.toLowerCase())).slice(0, MAX_SUGGESTIONS);
}
