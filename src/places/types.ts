import { Category } from '@/src/db';

// One search result: a real-world place the user can pick.
export interface PlaceResult {
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  suggestedCategory?: Category; // we pre-select this, the user can change it
}
