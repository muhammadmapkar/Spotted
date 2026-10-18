import { PlaceResult, PlaceSuggestion, SearchBias } from './types';

const BASE_URL = 'https://places.googleapis.com/v1';

// Google Places search ("Places API (New)").
// A "session token" groups the typing and the final pick into one billed session.

// Makes a random session token.
export function newSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Suggest places for the text typed so far, preferring places near `bias`.
export async function googleAutocomplete(
  apiKey: string,
  query: string,
  bias: SearchBias,
  sessionToken: string
): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    body: JSON.stringify({
      input: query,
      sessionToken,
      locationBias: {
        circle: {
          center: { latitude: bias.latitude, longitude: bias.longitude },
          radius: Math.min(bias.radiusMeters, 50000),
        },
      },
    }),
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

// Get the name, full address and map position of the place the user picked.
export async function googlePlaceDetails(
  apiKey: string,
  suggestion: PlaceSuggestion,
  sessionToken: string
): Promise<PlaceResult> {
  const response = await fetch(
    `${BASE_URL}/places/${encodeURIComponent(suggestion.googlePlaceId)}?sessionToken=${sessionToken}`,
    {
      headers: {
        'X-Goog-Api-Key': apiKey,
        // Only ask for the fields we need: it keeps the cost down.
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
      },
    }
  );
  if (!response.ok) throw new Error(`Google place lookup failed (${response.status})`);

  const data = await response.json();
  if (!data.location) throw new Error('Google did not return a location for this place');
  return {
    googlePlaceId: data.id ?? suggestion.googlePlaceId,
    name: data.displayName?.text ?? suggestion.name,
    address: data.formattedAddress ?? suggestion.address,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
  };
}
