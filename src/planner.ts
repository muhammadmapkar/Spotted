// "Plan my weekend": picks a few saved places you haven't been to yet, close to you,
// mixing Food, Shopping and Fun when it can. Written as a plain function so it is easy to test.

import { SavedPlace } from './db/types';
import { Coords, distanceMeters } from './location/distance';

// We pick from this many of the closest places, so "Shuffle" gives some variety
// without suggesting something on the other side of the city.
export const PLANNER_POOL_SIZE = 10;

export function pickPlacesToTry(
  places: SavedPlace[],
  position: Coords | null,
  count = 3,
  random: () => number = Math.random // tests pass a fixed one, so results are predictable
): SavedPlace[] {
  // Only places you haven't been to yet.
  let pool = places.filter((place) => !place.visitedAt);

  // With a position: the closest ones. Without: all of them.
  if (position) {
    pool = [...pool]
      .sort((a, b) => distanceMeters(position, a) - distanceMeters(position, b))
      .slice(0, PLANNER_POOL_SIZE);
  }

  // Shuffle (the Fisher-Yates way: fair, every order equally likely).
  pool = [...pool];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // First one of each category, then fill up with whatever is left.
  const picks: SavedPlace[] = [];
  const usedCategories = new Set<string>();
  for (const place of pool) {
    if (picks.length >= count) break;
    if (!usedCategories.has(place.category)) {
      picks.push(place);
      usedCategories.add(place.category);
    }
  }
  for (const place of pool) {
    if (picks.length >= count) break;
    if (!picks.includes(place)) picks.push(place);
  }

  // Show the closest first, so it reads like a little route.
  if (position) picks.sort((a, b) => distanceMeters(position, a) - distanceMeters(position, b));
  return picks;
}
