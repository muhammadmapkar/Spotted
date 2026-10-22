import { useSyncExternalStore } from 'react';

import { PLACES } from '../data/mock';

// Which sample places the user has saved (by id). It starts with the sample data's saved places.
// Screens read it with useSavedIds(). For now it lives in memory; a later step stores it on the phone.

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
  return nowSaved;
}

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
