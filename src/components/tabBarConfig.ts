import { IconName } from './icons/paths';

// The bottom bar, left to right. The route names are the file names in app/(tabs)/.
// Home is in the middle (index 2) and is the tab that opens first.
export interface TabItem {
  name: string; // the screen file in app/(tabs)/, e.g. 'saved' is app/(tabs)/saved.tsx
  label: string;
  icon?: IconName; // Profile has no icon: it shows the user's initial in a small circle
  center?: boolean; // Home is the raised purple circle
}

export const TABS: TabItem[] = [
  { name: 'saved', label: 'Saved', icon: 'bookmark' },
  { name: 'map', label: 'Map', icon: 'map' },
  { name: 'index', label: 'Home', icon: 'home', center: true },
  { name: 'new', label: 'New In', icon: 'sparkle' },
  { name: 'profile', label: 'Profile' },
];

export const INITIAL_TAB = 'index'; // Home opens first
