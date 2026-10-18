import { Category } from '@/src/db';

// One line in the search results (before the user picks it).
export interface PlaceSuggestion {
  googlePlaceId: string;
  name: string;
  address: string;
}

// A fully known place, with its map position. Fetched after the user picks a suggestion.
export interface PlaceResult extends PlaceSuggestion {
  latitude: number;
  longitude: number;
  suggestedCategory?: Category; // we pre-select this, the user can change it
}

// Where to prefer results: a circle around a point (radius in metres, max 50000).
export interface SearchBias {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// Used until we know where the user is: the middle of Dubai.
export const DUBAI_BIAS: SearchBias = { latitude: 25.2048, longitude: 55.2708, radiusMeters: 50000 };
