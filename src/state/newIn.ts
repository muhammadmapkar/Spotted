import { useSyncExternalStore } from 'react';

// The red dot on the "New In" tab: shown until the user opens that tab.
// (Like the prototype, it comes back each time the app starts. Later it will come back
// when there is something new.)

let seen = false;
const listeners = new Set<() => void>();

export function markNewInSeen(): void {
  if (seen) return;
  seen = true;
  listeners.forEach((listener) => listener());
}

// Only for tests and for "start again" situations.
export function resetNewInSeen(): void {
  seen = false;
  listeners.forEach((listener) => listener());
}

export function hasSeenNewIn(): boolean {
  return seen;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Use in a screen: const showDot = useShowNewInDot();
export function useShowNewInDot(): boolean {
  return !useSyncExternalStore(subscribe, hasSeenNewIn, hasSeenNewIn);
}
