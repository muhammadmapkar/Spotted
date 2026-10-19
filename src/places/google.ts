import { categoryFromTypes } from './categoryFromTypes';
import { PlaceResult, PlaceSuggestion, SearchBias } from './types';

// Where the app sends place searches. Two ways to set this up (see src/places/search.ts):
//  - "proxy": our own tiny server holds the Google key (safe for store builds), or
//  - "direct": the app holds the key itself (fine for testing, but the key can be extracted).
export interface PlacesBackend {
  baseUrl: string;
  headers: Record<string, string>;
}

// Google search ("Places API (New)").
// A "session token" groups the typing and the final pick into one billed session.

// Makes a random session token.
export function newSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// "Prefer results near here" in the shape Google wants.
function locationBias(bias: SearchBias) {
  return {
    circle: {
      center: { latitude: bias.latitude, longitude: bias.longitude },
      radius: Math.min(bias.radiusMeters, 50000),
    },
  };
}

// Suggest places for the text typed so far, preferring places near `bias`.
export async function googleAutocomplete(
  backend: PlacesBackend,
  query: string,
  bias: SearchBias,
  sessionToken: string
): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${backend.baseUrl}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...backend.headers },
    body: JSON.stringify({ input: query, sessionToken, locationBias: locationBias(bias) }),
  });
  if (!response.ok) throw new Error(`Google search failed (${response.status})`);

  const data = await response.json();
  const suggestions: PlaceSuggestion[] = [];
  for (const item of data.suggestions ?? []) {
    const p = item.placePrediction;
    if (!p?.placeId) continue; // skip search-term suggestions, keep only real places
    suggestions.push({
      googlePlaceId: p.placeId,
      name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? 'Unknown place',
      address: p.structuredFormat?.secondaryText?.text ?? '',
    });
  }
  return suggestions;
}

// Turns one place from Google's answer into our own shape. Returns null if it has no position.
function toPlaceResult(p: any, fallback?: PlaceSuggestion): PlaceResult | null {
  if (!p?.location) return null;
  return {
    googlePlaceId: p.id ?? fallback?.googlePlaceId ?? '',
    name: p.displayName?.text ?? fallback?.name ?? 'Unknown place',
    address: p.formattedAddress ?? fallback?.address ?? '',
    latitude: p.location.latitude,
    longitude: p.location.longitude,
    suggestedCategory: categoryFromTypes(p.types),
  };
}

// Get the name, full address and map position of the place the user picked.
export async function googlePlaceDetails(
  backend: PlacesBackend,
  suggestion: PlaceSuggestion,
  sessionToken: string
): Promise<PlaceResult> {
  const response = await fetch(
    `${backend.baseUrl}/places/${encodeURIComponent(suggestion.googlePlaceId)}?sessionToken=${sessionToken}`,
    {
      headers: {
        ...backend.headers,
        // Only ask for the fields we need: it keeps the cost down.
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types',
      },
    }
  );
  if (!response.ok) throw new Error(`Google place lookup failed (${response.status})`);

  const result = toPlaceResult(await response.json(), suggestion);
  if (!result) throw new Error('Google did not return a location for this place');
  return result;
}

// Search by a phrase taken from a caption (like "Arabian Tea House Al Fahidi").
// Returns full places (with positions) so no second lookup is needed.
export async function googleTextSearch(
  backend: PlacesBackend,
  text: string,
  bias: SearchBias,
  maxResults = 3
): Promise<PlaceResult[]> {
  const response = await fetch(`${backend.baseUrl}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...backend.headers,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify({ textQuery: text, locationBias: locationBias(bias), maxResultCount: maxResults }),
  });
  if (!response.ok) throw new Error(`Google search failed (${response.status})`);

  const data = await response.json();
  const found: PlaceResult[] = [];
  for (const p of data.places ?? []) {
    const result = toPlaceResult(p);
    if (result && result.googlePlaceId) found.push(result);
  }
  return found;
}
