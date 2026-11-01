// The shapes of the data Spotted stores on the phone (see SPEC.md section 8).

export type Category = 'food' | 'shopping' | 'fun';

// One of the user's own lists, like "Dubai brunch spots".
export interface Collection {
  id: string;
  name: string; // 1-40 characters, unique ignoring upper/lower case
  createdAt: string;
}

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
  muted: boolean; // true = never send "you're near" reminders for this place
  visitedAt?: string; // when the user marked "I've been here" (reminders stop after that)
  snoozedUntil?: string; // "Not now" on a reminder: no reminders for this place until this date
  collectionIds: string[]; // the collections this place is in (can be empty)
}

// What the user types in when adding a place (id and dates are filled in for them).
export type NewPlace = Omit<SavedPlace, 'id' | 'createdAt' | 'lastNotifiedAt' | 'collectionIds' | 'muted' | 'visitedAt' | 'snoozedUntil'> & {
  collectionIds?: string[];
};

export interface Settings {
  remindersEnabled: boolean;
  radiusMeters: 200 | 300 | 500 | 1000;
  quietHoursEnabled: boolean;
  quietStart: string; // "22:00"
  quietEnd: string; // "08:00"
  maxRemindersPerDay: number; // most reminders in any 24 hours; 0 = no limit
}

// What a brand-new user gets before they change anything.
export const DEFAULT_SETTINGS: Settings = {
  remindersEnabled: true,
  radiusMeters: 300,
  quietHoursEnabled: true,
  quietStart: '22:00',
  quietEnd: '08:00',
  maxRemindersPerDay: 2,
};
