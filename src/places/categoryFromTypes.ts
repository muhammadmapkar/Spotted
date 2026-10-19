import { Category } from '../db/types';

// Google describes every place with "types" (like "cafe" or "shopping_mall").
// We turn those into our three categories so the right one is pre-selected.
// If we don't recognise any type we return undefined and the user's choice stays as it is.

const FOOD = ['restaurant', 'cafe', 'coffee_shop', 'bakery', 'bar', 'food', 'meal_takeaway', 'meal_delivery', 'ice_cream_shop', 'dessert_shop', 'pub', 'brunch_restaurant'];
const SHOPPING = ['shopping_mall', 'store', 'clothing_store', 'department_store', 'market', 'book_store', 'jewelry_store', 'shoe_store', 'supermarket', 'home_goods_store'];
const FUN = ['tourist_attraction', 'amusement_park', 'park', 'museum', 'night_club', 'beach', 'art_gallery', 'aquarium', 'zoo', 'movie_theater', 'spa', 'gym', 'bowling_alley', 'casino', 'stadium'];

export function categoryFromTypes(types: string[] | undefined): Category | undefined {
  if (!types || types.length === 0) return undefined;
  // Google lists the most specific type first, so the first match wins.
  for (const type of types) {
    if (FOOD.includes(type)) return 'food';
    if (SHOPPING.includes(type)) return 'shopping';
    if (FUN.includes(type)) return 'fun';
  }
  return undefined;
}
