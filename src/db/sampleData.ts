import { addPlace } from './places';
import { NewPlace } from './types';

// FAKE places for testing how the app looks. Only used in development.
const SAMPLE_PLACES: NewPlace[] = [
  {
    googlePlaceId: 'sample-1',
    name: 'Arabian Tea House',
    address: 'Al Fahidi Historical District, Bur Dubai',
    latitude: 25.2637,
    longitude: 55.2972,
    category: 'food',
    note: 'Try the karak chai and the lamb ouzi',
    reelUrl: 'https://www.instagram.com/reel/sample1/',
  },
  {
    googlePlaceId: 'sample-2',
    name: 'Al Ustad Special Kebab',
    address: 'Al Mina Road, Al Satwa',
    latitude: 25.2292,
    longitude: 55.2756,
    category: 'food',
    reelUrl: 'https://www.instagram.com/reel/sample2/',
  },
  {
    googlePlaceId: 'sample-3',
    name: 'Souk Madinat Jumeirah',
    address: 'Al Sufouh Road, Umm Suqeim',
    latitude: 25.1329,
    longitude: 55.1853,
    category: 'shopping',
    note: 'Look for the handmade leather bags',
  },
  {
    googlePlaceId: 'sample-4',
    name: 'The Dubai Mall',
    address: 'Downtown Dubai',
    latitude: 25.1972,
    longitude: 55.2797,
    category: 'shopping',
  },
  {
    googlePlaceId: 'sample-5',
    name: 'Kite Beach',
    address: 'Jumeirah 1, Dubai',
    latitude: 25.2121,
    longitude: 55.2142,
    category: 'fun',
    note: 'Go at sunset, rent a paddleboard',
    reelUrl: 'https://www.instagram.com/reel/sample5/',
  },
];

// Adds the 5 fake places, one after another so "newest first" has a clear order.
export async function addSamplePlaces(): Promise<void> {
  for (const place of SAMPLE_PLACES) {
    await addPlace(place);
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
