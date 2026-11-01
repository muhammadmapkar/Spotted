import { DEFAULT_SETTINGS, SavedPlace, Settings } from '../src/db/types';

// A saved place for tests. Pass only the parts that matter for the test.
export function makePlace(overrides: Partial<SavedPlace> = {}): SavedPlace {
  return {
    id: 'p1',
    googlePlaceId: 'g1',
    name: 'Arabian Tea House',
    address: 'Al Fahidi, Dubai',
    latitude: 25.2635,
    longitude: 55.297,
    category: 'food',
    createdAt: '2026-10-01T10:00:00.000Z',
    collectionIds: [],
    muted: false,
    ...overrides,
  };
}

export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}
