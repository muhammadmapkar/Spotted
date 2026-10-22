import { PLACES, Place, PlaceGroup } from '../data/mock';
import { Filters, activeFilterChips, matchesQuery, passesFilters } from '../home/homeData';

// The rules behind the Saved tab, kept apart from the drawing so they can be tested.
// (prototype: the "saved tab" part of its script)

// A folder is a Food / Shopping / Fun group, or "All saved". A saved place goes into the folder of its group.
export type FolderKey = 'all' | PlaceGroup;

export interface FolderDef {
  key: FolderKey;
  name: string;
  colors: [string, string]; // the tile gradient, light to dark
}

export const FOLDERS: FolderDef[] = [
  { key: 'all', name: 'All saved', colors: ['#9D4EDD', '#5A189A'] },
  { key: 'Food', name: 'Food', colors: ['#F4A259', '#D62839'] },
  { key: 'Shopping', name: 'Shopping', colors: ['#F15BB5', '#7209B7'] },
  { key: 'Fun', name: 'Fun', colors: ['#4CC9F0', '#3451D1'] },
];

export const folderName = (key: FolderKey): string => FOLDERS.find((f) => f.key === key)?.name ?? '';

// The user's saved places, nearest first.
export const savedPlaces = (savedIds: ReadonlySet<string>, places: Place[] = PLACES): Place[] =>
  places.filter((p) => savedIds.has(p.id)).sort((a, b) => a.dist - b.dist);

export const countLabel = (count: number): string => `${count} ${count === 1 ? 'place' : 'places'}`;

// "12 places you've spotted"
export const savedTotalLabel = (count: number): string => `${countLabel(count)} you've spotted`;

export interface FolderTile {
  key: FolderKey;
  name: string;
  colors: [string, string];
  count: number;
  countLabel: string;
  minis: Place[]; // up to 3 places, shown as small overlapping logos
  delay: number; // ms: the tiles pop in one after another
}

export function folderTiles(saved: Place[]): FolderTile[] {
  return FOLDERS.map((folder, i) => {
    const inside = folder.key === 'all' ? saved : saved.filter((p) => p.group === folder.key);
    return { key: folder.key, name: folder.name, colors: folder.colors, count: inside.length, countLabel: countLabel(inside.length), minis: inside.slice(0, 3), delay: i * 80 };
  });
}

// What the list shows: the places of the open folder (or all saved), that match the search words and the filters.
export function visibleSaved(saved: Place[], folder: FolderKey | null, query: string, filters: Filters): Place[] {
  const inFolder = folder && folder !== 'all' ? saved.filter((p) => p.group === folder) : saved;
  return inFolder.filter((p) => matchesQuery(p, query) && passesFilters(p, filters));
}

// Folder tiles are shown only when there is nothing to narrow the list down: no folder open, nothing typed, no filter on.
export const showFolderTiles = (folder: FolderKey | null, query: string, filters: Filters): boolean =>
  !folder && query.trim() === '' && activeFilterChips(filters).length === 0;

// The number on the filter sheet's button: saved places that pass the filters (the search words do not count).
export const savedMatchCount = (saved: Place[], filters: Filters): number => saved.filter((p) => passesFilters(p, filters)).length;

export const NO_SAVED_MATCH = 'No saved places match. Try another word or clear a filter.';
export const NOTHING_SAVED_YET = 'Nothing saved yet. Tap the bookmark on a place to keep it here.';
