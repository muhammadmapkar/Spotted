import { useSyncExternalStore } from 'react';

import { PLACES } from '../data/mock';
import { emitDataChanged } from '../db/changes';
import { loadSavedPlaceIds, storeSavedPlaceIds } from '../services/savedPlaces';

// Which sample places the user has saved (by id). It starts with the sample data's saved places.
// Screens read it with useSavedIds(). It is kept on the phone (through src/services/savedPlaces.ts), so it
// survives restarts: hydrateSaved() loads it when the app starts, and every change is written back.

let saved: ReadonlySet<string> = new Set(PLACES.filter((p) => p.saved).map((p) => p.id));
const listeners = new Set<() => void>();

export const getSavedIds = (): ReadonlySet<string> => saved;

// Save a place, or un-save it if it is already saved. Returns true if it is saved now.
export function toggleSaved(placeId: string): boolean {
  const next = new Set(saved);
  const nowSaved = !next.delete(placeId);
  if (nowSaved) next.add(placeId);
  saved = next; // a new Set each time, so screens notice the change
  listeners.forEach((listener) => listener());
  remember();
  return nowSaved;
}

// Write the current list to the phone. A failure never breaks the screen; the next change tries again.
let writes: Promise<void> = Promise.resolve();
function remember(): void {
  const ids = [...saved];
  // once written, tell the reminder watcher: it picks the 20 nearest places again
  writes = writes.then(() => storeSavedPlaceIds(ids)).then(emitDataChanged).catch(() => {});
}

// Load the saved list from the phone (when the app starts). Unknown ids are ignored.
export async function hydrateSaved(): Promise<void> {
  try {
    const stored = await loadSavedPlaceIds();
    if (stored) {
      const known = new Set(PLACES.map((p) => p.id));
      saved = new Set(stored.filter((id) => known.has(id)));
      listeners.forEach((listener) => listener());
    }
  } catch {
    // the phone's storage failed: carry on with the starting list
  }
}

// Wait until everything has been written (for tests).
export const savedWritesDone = (): Promise<void> => writes;

// Back to the sample data's starting point (for tests).
export function resetSaved(): void {
  saved = new Set(PLACES.filter((p) => p.saved).map((p) => p.id));
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSavedIds = (): ReadonlySet<string> => useSyncExternalStore(subscribe, getSavedIds, getSavedIds);
