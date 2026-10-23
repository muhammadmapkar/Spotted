import { Category, SavedPlace } from './db/types';
import { Coords, distanceMeters } from './location/distance';

// The two filter rows on My Places. 'all' means "don't filter by this".
export type CategoryFilter = 'all' | Category;
export type CollectionFilterValue = 'all' | string; // 'all' or a collection id

// Keep the places that match BOTH the category chip and the collection chip.
export function filterPlaces(
  places: SavedPlace[],
  category: CategoryFilter,
  collectionId: CollectionFilterValue
): SavedPlace[] {
  return places.filter(
    (place) =>
      (category === 'all' || place.category === category) &&
      (collectionId === 'all' || place.collectionIds.includes(collectionId))
  );
}

// Keep the places whose name, address (area) or note contains what the user typed.
// Upper/lower case does not matter. Several words all have to match, in any order
// ("tea dubai" finds "Arabian Tea House, Dubai"). An empty search keeps everything.
export function searchSavedPlaces(places: SavedPlace[], query: string): SavedPlace[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return places;
  return places.filter((place) => {
    const text = `${place.name} ${place.address} ${place.note ?? ''}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

// How My Places is ordered.
export type PlaceSort = 'newest' | 'nearest';

// Put the places in order: newest first, or closest to the user first.
// "Nearest" needs the user's position. Without it we fall back to newest first.
// Always returns a new list; the one you pass in is not changed.
export function sortPlaces(places: SavedPlace[], sort: PlaceSort, position: Coords | null): SavedPlace[] {
  const newestFirst = [...places].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === 'newest' || !position) return newestFirst;
  // Work out each distance once, then sort by it (ties stay newest first).
  const distances = new Map(newestFirst.map((place) => [place.id, distanceMeters(position, place)]));
  return newestFirst.sort((a, b) => distances.get(a.id)! - distances.get(b.id)!);
}
