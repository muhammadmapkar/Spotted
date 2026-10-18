// The shapes of the data Spotted stores on the phone (see SPEC.md section 8).

export type Category = 'food' | 'shopping' | 'fun';

// One place the user saved from a reel.
export interface SavedPlace {
  id: string; // unique id we make up when saving
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: Category;
  note?: string;
  reelUrl?: string;
  createdAt: string; // date and time, e.g. "2026-10-18T19:15:00.000Z"
  lastNotifiedAt?: string; // when we last sent a "you're near" notification
}

// What the user types in when adding a place (id and dates are filled in for them).
export type NewPlace = Omit<SavedPlace, 'id' | 'createdAt' | 'lastNotifiedAt'>;

export interface Settings {
  remindersEnabled: boolean;
  radiusMeters: 200 | 300 | 500 | 1000;
  quietHoursEnabled: boolean;
  quietStart: string; // "22:00"
  quietEnd: string; // "08:00"
}

// What a brand-new user gets before they change anything.
export const DEFAULT_SETTINGS: Settings = {
  remindersEnabled: true,
  radiusMeters: 300,
  quietHoursEnabled: true,
  quietStart: '22:00',
  quietEnd: '08:00',
};
