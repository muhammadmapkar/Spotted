export type Category = 'Food' | 'Cafe' | 'Shops';

export type Place = {
  id: string; name: string; area: string; city: string; category: Category;
  lat: number; lng: number; c1: string; c2: string;
  offer?: { title: string; conditions: string; expires: string };
  saves: number; visits: number;
};

export const PLACES: Place[] = [
  { id: 'p1', name: 'Biryani Junction', area: 'Bandra West', city: 'Mumbai', category: 'Food', lat: 19.0596, lng: 72.8295, c1: '#6A1FB0', c2: '#C9A2FF', offer: { title: 'Free dessert with any biryani', conditions: 'Dine-in only. One per table.', expires: '31 Jan 2027' }, saves: 214, visits: 61 },
  { id: 'p2', name: 'Chai & Co', area: 'Colaba', city: 'Mumbai', category: 'Cafe', lat: 18.9067, lng: 72.8147, c1: '#E5383B', c2: '#FFB4B5', saves: 132, visits: 40 },
  { id: 'p3', name: 'The Brunch Table', area: 'Bandra West', city: 'Mumbai', category: 'Food', lat: 19.0544, lng: 72.8402, c1: '#2BB673', c2: '#A8EBCB', offer: { title: '10% off your brunch bill', conditions: 'Weekends before 1pm.', expires: '15 Feb 2027' }, saves: 98, visits: 27 },
  { id: 'p4', name: 'Thread Lane', area: 'Linking Road', city: 'Mumbai', category: 'Shops', lat: 19.0663, lng: 72.8341, c1: '#FFC93C', c2: '#FFE9A8', saves: 51, visits: 12 },
  { id: 'p5', name: 'Kebab Corner', area: 'Mohammed Ali Road', city: 'Mumbai', category: 'Food', lat: 18.9606, lng: 72.8327, c1: '#3C096C', c2: '#8E44D6', saves: 176, visits: 55 },
  { id: 'p6', name: 'Bean Bar', area: 'Powai', city: 'Mumbai', category: 'Cafe', lat: 19.1176, lng: 72.906, c1: '#7B2CBF', c2: '#E0C3FC', saves: 77, visits: 19 },
];

export type CollabOffer = 'Free meal' | 'Fee' | 'Commission';
export type Collab = {
  id: string; placeId: string; title: string; brief: string; offerType: CollabOffer;
  offerValue: string; startDate: string; endDate: string;
};

export const COLLABS: Collab[] = [
  { id: 'c1', placeId: 'p1', title: 'Biryani festival reel', brief: 'One reel featuring our festival thali. Tag the restaurant and the dish.', offerType: 'Fee', offerValue: '3,000 rupees', startDate: '10 Jan', endDate: '20 Jan' },
  { id: 'c2', placeId: 'p3', title: 'Weekend brunch story set', brief: 'Three stories at the brunch table. We cover the meal for two.', offerType: 'Free meal', offerValue: 'Meal for two', startDate: '5 Jan', endDate: '31 Jan' },
  { id: 'c3', placeId: 'p5', title: 'Late-night kebab spot', brief: 'Show the grill. You earn commission on every verified visit.', offerType: 'Commission', offerValue: '40 rupees per visit', startDate: '1 Feb', endDate: '28 Feb' },
];

// Rewards: shown to the creator upfront, before they accept anything.
export const REWARD_RATES = {
  perVerifiedVisit: 25,
  referralBonus: 100,
  freeMealTiers: [
    { name: 'Newcomer', visits: 0 },
    { name: 'Local', visits: 25 },
    { name: 'Tastemaker', visits: 100 },
  ],
};

export const PUBLIC_BASE = 'https://spotted.app';
