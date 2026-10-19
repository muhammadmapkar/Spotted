import { Category, SavedPlace } from './db/types';

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
