import { PlaceClue, findPlaceClues } from './clues';
import { PlaceSuggestion } from './types';

// Looks up places for one search phrase (the app passes in the real search).
export type SearchFunction = (query: string) => Promise<PlaceSuggestion[]>;

export interface CaptionSuggestions {
  clues: PlaceClue[]; // what we found in the caption
  suggestions: PlaceSuggestion[]; // places matching those clues, best first
}

// Caption in, place suggestions out.
// 1. Find the clues in the caption.  2. Search for the best few.  3. Merge the results.
// The user then taps the right place. Nothing is saved without their tap.
export async function suggestFromCaption(
  caption: string,
  search: SearchFunction,
  options: { maxClues?: number; maxResults?: number } = {}
): Promise<CaptionSuggestions> {
  const { maxClues = 3, maxResults = 6 } = options;
  const clues = findPlaceClues(caption).slice(0, maxClues);

  const suggestions: PlaceSuggestion[] = [];
  const seen = new Set<string>();
  for (const clue of clues) {
    let results = await search(clue.searchText);
    // If adding the area found nothing (for example the area is wrong), try the clue on its own.
    if (results.length === 0 && clue.searchText !== clue.text) results = await search(clue.text);
    for (const place of results) {
      if (seen.has(place.googlePlaceId)) continue;
      seen.add(place.googlePlaceId);
      suggestions.push(place);
    }
    if (suggestions.length >= maxResults) break;
  }
  return { clues, suggestions: suggestions.slice(0, maxResults) };
}
