import { useSyncExternalStore } from 'react';

import { Filters, NO_FILTERS } from '../home/homeData';

// The filter choices, shared by Home and the Saved tab (the filter sheet in a later step changes them).

let filters: Filters = NO_FILTERS;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const getFilters = (): Filters => filters;

// Change some of the filters, e.g. setFilters({ dist: 5 }).
export function setFilters(patch: Partial<Filters>): void {
  filters = { ...filters, ...patch }; // a new object each time, so screens notice
  notify();
}

export function resetFilters(): void {
  filters = NO_FILTERS;
  notify();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useFilters = (): Filters => useSyncExternalStore(subscribe, getFilters, getFilters);
