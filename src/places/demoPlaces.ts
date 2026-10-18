import { PlaceResult } from './types';

// A small built-in list of well-known Dubai places, used for the DEMO search.
// Coordinates are approximate. This list is replaced by Google Places later.
export const DEMO_PLACES: PlaceResult[] = [
  // Food
  { googlePlaceId: 'demo-arabian-tea-house', name: 'Arabian Tea House', address: 'Al Fahidi Historical District, Bur Dubai', latitude: 25.2635, longitude: 55.297, suggestedCategory: 'food' },
  { googlePlaceId: 'demo-al-ustad', name: 'Al Ustad Special Kebab', address: 'Al Mina Road, Al Satwa', latitude: 25.2297, longitude: 55.2764, suggestedCategory: 'food' },
  { googlePlaceId: 'demo-ravi', name: 'Ravi Restaurant', address: 'Al Satwa, Dubai', latitude: 25.2276, longitude: 55.274, suggestedCategory: 'food' },
  { googlePlaceId: 'demo-bu-qtair', name: 'Bu Qtair', address: 'Jumeirah 3, Dubai', latitude: 25.1411, longitude: 55.1989, suggestedCategory: 'food' },
  { googlePlaceId: 'demo-pierchic', name: 'Pierchic', address: 'Al Sufouh Road, Madinat Jumeirah', latitude: 25.132, longitude: 55.1844, suggestedCategory: 'food' },
  { googlePlaceId: 'demo-atmosphere', name: 'At.mosphere', address: 'Burj Khalifa, Downtown Dubai', latitude: 25.1972, longitude: 55.2744, suggestedCategory: 'food' },
  { googlePlaceId: 'demo-zuma', name: 'Zuma Dubai', address: 'Gate Village, DIFC', latitude: 25.2096, longitude: 55.2796, suggestedCategory: 'food' },

  // Shopping
  { googlePlaceId: 'demo-dubai-mall', name: 'The Dubai Mall', address: 'Downtown Dubai', latitude: 25.1972, longitude: 55.2797, suggestedCategory: 'shopping' },
  { googlePlaceId: 'demo-moe', name: 'Mall of the Emirates', address: 'Al Barsha, Dubai', latitude: 25.1181, longitude: 55.2006, suggestedCategory: 'shopping' },
  { googlePlaceId: 'demo-souk-madinat', name: 'Souk Madinat Jumeirah', address: 'Al Sufouh Road, Umm Suqeim', latitude: 25.1329, longitude: 55.1853, suggestedCategory: 'shopping' },
  { googlePlaceId: 'demo-gold-souk', name: 'Gold Souk', address: 'Deira, Dubai', latitude: 25.2863, longitude: 55.2972, suggestedCategory: 'shopping' },
  { googlePlaceId: 'demo-spice-souk', name: 'Spice Souk', address: 'Deira, Dubai', latitude: 25.2683, longitude: 55.2977, suggestedCategory: 'shopping' },
  { googlePlaceId: 'demo-city-walk', name: 'City Walk', address: 'Al Wasl, Dubai', latitude: 25.2086, longitude: 55.2625, suggestedCategory: 'shopping' },
  { googlePlaceId: 'demo-ibn-battuta', name: 'Ibn Battuta Mall', address: 'Jebel Ali, Dubai', latitude: 25.0446, longitude: 55.1177, suggestedCategory: 'shopping' },
  { googlePlaceId: 'demo-alserkal', name: 'Alserkal Avenue', address: 'Al Quoz, Dubai', latitude: 25.1417, longitude: 55.2246, suggestedCategory: 'shopping' },

  // Fun
  { googlePlaceId: 'demo-kite-beach', name: 'Kite Beach', address: 'Jumeirah 1, Dubai', latitude: 25.2121, longitude: 55.2142, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-burj-khalifa', name: 'Burj Khalifa', address: 'Downtown Dubai', latitude: 25.1972, longitude: 55.2744, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-dubai-fountain', name: 'The Dubai Fountain', address: 'Downtown Dubai', latitude: 25.1951, longitude: 55.2748, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-dubai-frame', name: 'Dubai Frame', address: 'Zabeel Park, Dubai', latitude: 25.2352, longitude: 55.3003, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-la-mer', name: 'La Mer Beach', address: 'Jumeirah 1, Dubai', latitude: 25.2331, longitude: 55.2631, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-global-village', name: 'Global Village', address: 'Sheikh Mohammed Bin Zayed Road, Dubai', latitude: 25.0688, longitude: 55.3052, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-museum-future', name: 'Museum of the Future', address: 'Sheikh Zayed Road, Dubai', latitude: 25.2193, longitude: 55.2815, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-miracle-garden', name: 'Dubai Miracle Garden', address: 'Al Barsha South, Dubai', latitude: 25.0603, longitude: 55.2433, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-ski-dubai', name: 'Ski Dubai', address: 'Mall of the Emirates, Al Barsha', latitude: 25.1181, longitude: 55.1999, suggestedCategory: 'fun' },
  { googlePlaceId: 'demo-aquaventure', name: 'Atlantis Aquaventure', address: 'Palm Jumeirah, Dubai', latitude: 25.1305, longitude: 55.1171, suggestedCategory: 'fun' },
];
