import { DEMO_PLACES } from './demoPlaces';
import { PlaceResult } from './types';

// true = we search a small built-in list of Dubai places (free, no key needed).
// When the Google key is ready, we replace the body of searchPlaces() with the
// real Google Places search and set this to false. Nothing else changes.
export const SEARCH_IS_DEMO = true;

// Find places that match what the user typed. Every word they type must appear
// in the place's name or address, in any order.
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return DEMO_PLACES.filter((place) => {
    const text = `${place.name} ${place.address}`.toLowerCase();
    return words.every((word) => text.includes(word));
  }).slice(0, 8);
}
