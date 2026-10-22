// SAMPLE DATA for the Spotted design preview.
//
// Copied from the design prototype (spotted-prototype-reference.html). These are made-up places,
// influencers, offers and loyalty cards (set around Abu Dhabi). Screens read from here for now.
// Later this file is replaced by real data from a backend. Keep the shapes (the types below).

export type PlaceGroup = 'Food' | 'Shopping' | 'Fun';
export type Platform = 'ig' | 'tt' | 'yt'; // Instagram, TikTok, YouTube
export type OfferSource = 'Esaad' | 'Fazaa' | 'Spotted';

export interface MenuItem {
  name: string;
  price: number; // AED
}

// A discount or deal. Esaad and Fazaa are partner discounts; Spotted offers have a title.
export interface Offer {
  source: OfferSource;
  title?: string; // only Spotted offers, e.g. 'Stamp card'
  text: string;
}

export interface Place {
  id: string;
  name: string;
  mono: string; // the two letters shown in the logo
  cat: string; // e.g. 'Indian', 'Café'
  group: PlaceGroup; // the folder it belongs to
  tags: string; // extra search words
  dist: number; // km from the user (sample value)
  ang: number; // direction from the user in degrees (used to place map pins in the preview)
  lo: number; // lowest price per person, AED
  hi: number; // highest price per person, AED
  partner: boolean; // a Spotted Partner
  saved: boolean; // saved by the sample user
  isNew?: boolean; // just joined Spotted
  c1: string; // brand colours (the logo gradient goes from c2 to c1)
  c2: string;
  kind: string; // what the menu is called, e.g. 'Restaurant menu'
  menu: MenuItem[];
  partnerOffers: Offer[];
  spottedOffers: Offer[];
}

export interface Influencer {
  id: string;
  handle: string;
  initial: string;
  gradient: [string, string]; // profile circle colours
  platforms: Platform[];
  followers: string; // e.g. '48.2K'
  niche: string;
  picks: string[]; // place ids: this month's top picks, best first
  more: string[]; // place ids: other recommendations
  isNew?: boolean; // just joined Spotted
}

// An offer shown in the "New in" tab.
export interface NewOffer extends Offer {
  placeId: string;
  ends: string; // e.g. 'Ends in 3 days'
}

export interface LoyaltyCard {
  placeId: string;
  stamps: number; // 0 to 6
  gradient: [string, string]; // card colours
}

export const PLACES: Place[] = [
  {
    id: 'saffron', name: 'Saffron Lane', mono: 'SL', cat: 'Indian', group: 'Food', tags: 'indian curry biryani restaurant',
    dist: 1.2, ang: -35, lo: 35, hi: 80,
    partner: true, saved: true,
    c1: '#D9661A', c2: '#F6B26B', kind: 'Restaurant menu',
    menu: [{ name: 'Butter chicken', price: 48 }, { name: 'Lamb biryani', price: 55 }, { name: 'Paneer tikka', price: 38 }, { name: 'Garlic naan', price: 12 }, { name: 'Mango lassi', price: 18 }],
    partnerOffers: [{ source: 'Esaad', text: '15% off the total bill' }, { source: 'Fazaa', text: '10% off dine-in' }],
    spottedOffers: [{ source: 'Spotted', title: 'Stamp card', text: 'Collect stamps, discount rises up to 25%' }, { source: 'Spotted', title: 'Lunch deal', text: 'Free lassi with any biryani, 12–4 pm' }],
  },
  {
    id: 'brew', name: 'Brew Theory', mono: 'BT', cat: 'Café', group: 'Food', tags: 'coffee cafe breakfast',
    dist: 2.4, ang: 150, lo: 20, hi: 45,
    partner: true, saved: true,
    c1: '#6F4E37', c2: '#C49A6C', kind: 'Café menu',
    menu: [{ name: 'Spanish latte', price: 22 }, { name: 'Pistachio croissant', price: 18 }, { name: 'Cold brew', price: 20 }, { name: 'Avocado toast', price: 36 }],
    partnerOffers: [{ source: 'Esaad', text: '10% off all drinks' }],
    spottedOffers: [{ source: 'Spotted', title: 'Stamp card', text: 'Every 6th coffee on us, plus rising discounts' }],
  },
  {
    id: 'taco', name: 'Taco Norte', mono: 'TN', cat: 'Mexican', group: 'Food', tags: 'mexican tacos',
    dist: 3.8, ang: 70, lo: 30, hi: 70,
    partner: false, saved: true,
    c1: '#1F8A7E', c2: '#7BD3C5', kind: 'Restaurant menu',
    menu: [{ name: 'Birria tacos', price: 42 }, { name: 'Street corn', price: 18 }, { name: 'Burrito bowl', price: 45 }, { name: 'Churros', price: 22 }],
    partnerOffers: [],
    spottedOffers: [],
  },
  {
    id: 'stack', name: 'Stack Burger Co.', mono: 'SB', cat: 'Burgers', group: 'Food', tags: 'burger american fast food',
    dist: 4.6, ang: -120, lo: 40, hi: 90,
    partner: true, saved: true,
    c1: '#C81D2E', c2: '#F27059', kind: 'Restaurant menu',
    menu: [{ name: 'Double smash burger', price: 49 }, { name: 'Truffle fries', price: 24 }, { name: 'Crispy chicken burger', price: 42 }, { name: 'Salted caramel shake', price: 26 }],
    partnerOffers: [{ source: 'Fazaa', text: '15% off weekdays' }],
    spottedOffers: [{ source: 'Spotted', title: 'Combo', text: 'Free truffle fries with any burger' }, { source: 'Spotted', title: 'Stamp card', text: 'Collect stamps, discount rises up to 25%' }],
  },
  {
    id: 'luma', name: 'Luma Boutique', mono: 'LB', cat: 'Clothes', group: 'Shopping', tags: 'clothes fashion abaya dresses shopping boutique',
    dist: 6.1, ang: 20, lo: 120, hi: 400,
    partner: false, saved: true,
    c1: '#A3168F', c2: '#F15BB5', kind: 'Catalogue',
    menu: [{ name: 'Linen abaya', price: 320 }, { name: 'Silk scarf', price: 120 }, { name: 'Kaftan dress', price: 280 }, { name: 'Leather tote', price: 150 }],
    partnerOffers: [{ source: 'Fazaa', text: '20% off the new season' }],
    spottedOffers: [],
  },
  {
    id: 'forno', name: 'Forno 900', mono: 'F9', cat: 'Pizza', group: 'Food', tags: 'pizza italian',
    dist: 7.3, ang: 200, lo: 45, hi: 110,
    partner: false, saved: true,
    c1: '#B3121E', c2: '#E85D04', kind: 'Restaurant menu',
    menu: [{ name: 'Margherita', price: 45 }, { name: 'Truffle funghi', price: 68 }, { name: 'Burrata salad', price: 52 }, { name: 'Tiramisu', price: 32 }],
    partnerOffers: [{ source: 'Esaad', text: '10% off the bill' }],
    spottedOffers: [],
  },
  {
    id: 'starlight', name: 'Starlight Cinemas', mono: 'SC', cat: 'Movies', group: 'Fun', tags: 'movies cinema film fun',
    dist: 8.9, ang: -80, lo: 45, hi: 75,
    partner: false, saved: true,
    c1: '#1D3557', c2: '#457B9D', kind: 'Tickets & snacks',
    menu: [{ name: 'Standard ticket', price: 45 }, { name: 'Recliner ticket', price: 75 }, { name: 'Popcorn combo', price: 38 }],
    partnerOffers: [{ source: 'Esaad', text: '25% off tickets, Mon–Thu' }],
    spottedOffers: [],
  },
  {
    id: 'kaze', name: 'Sushi Kaze', mono: 'SK', cat: 'Japanese', group: 'Food', tags: 'sushi japanese',
    dist: 10.2, ang: 110, lo: 60, hi: 180,
    partner: true, saved: true,
    c1: '#20444F', c2: '#2A9D8F', kind: 'Restaurant menu',
    menu: [{ name: 'Salmon nigiri set', price: 85 }, { name: 'Dragon roll', price: 62 }, { name: 'Wagyu gyoza', price: 58 }, { name: 'Matcha mochi', price: 28 }],
    partnerOffers: [{ source: 'Esaad', text: '20% off weekday lunch' }],
    spottedOffers: [{ source: 'Spotted', title: 'Stamp card', text: 'Collect stamps, discount rises up to 25%' }],
  },
  {
    id: 'thread', name: 'Thread & Co.', mono: 'TC', cat: 'Clothes', group: 'Shopping', tags: 'clothes fashion shoes sneakers shopping',
    dist: 11.6, ang: -10, lo: 90, hi: 340,
    partner: false, saved: true,
    c1: '#3A0CA3', c2: '#7209B7', kind: 'Catalogue',
    menu: [{ name: 'Abaya set', price: 260 }, { name: 'Denim jacket', price: 190 }, { name: 'Sneakers', price: 340 }],
    partnerOffers: [],
    spottedOffers: [],
  },
  {
    id: 'shawarma', name: 'Shawarma Station', mono: 'SS', cat: 'Arabic', group: 'Food', tags: 'arabic shawarma lebanese',
    dist: 13.4, ang: 250, lo: 12, hi: 35,
    partner: false, saved: true,
    c1: '#8A5A3C', c2: '#DDB892', kind: 'Restaurant menu',
    menu: [{ name: 'Chicken shawarma', price: 15 }, { name: 'Mixed grill platter', price: 35 }, { name: 'Falafel wrap', price: 12 }, { name: 'Fresh lemon mint', price: 14 }],
    partnerOffers: [],
    spottedOffers: [],
  },
  {
    id: 'glow', name: 'Glow Arcade', mono: 'GA', cat: 'Arcade', group: 'Fun', tags: 'games arcade bowling fun',
    dist: 5.2, ang: -60, lo: 50, hi: 80,
    partner: true, saved: false, isNew: true,
    c1: '#3451D1', c2: '#4CC9F0', kind: 'Games & prices',
    menu: [{ name: 'Game card (30 credits)', price: 50 }, { name: 'Bowling lane, 1 hour', price: 80 }, { name: 'VR session', price: 60 }],
    partnerOffers: [],
    spottedOffers: [{ source: 'Spotted', title: 'Welcome', text: '2 free games on your first visit' }],
  },
  {
    id: 'masala', name: 'Masala Junction', mono: 'MJ', cat: 'Indian', group: 'Food', tags: 'indian dosa south indian',
    dist: 6.8, ang: 160, lo: 22, hi: 45,
    partner: false, saved: false,
    c1: '#D35F00', c2: '#FCBF49', kind: 'Restaurant menu',
    menu: [{ name: 'Chicken 65', price: 32 }, { name: 'Masala dosa', price: 22 }, { name: 'Veg thali', price: 45 }],
    partnerOffers: [{ source: 'Esaad', text: '10% off dine-in' }],
    spottedOffers: [],
  },
  {
    id: 'casa', name: 'Casa Verde', mono: 'CV', cat: 'Mexican', group: 'Food', tags: 'mexican nachos',
    dist: 9.5, ang: 40, lo: 38, hi: 75,
    partner: true, saved: false, isNew: true,
    c1: '#2D6A4F', c2: '#52B788', kind: 'Restaurant menu',
    menu: [{ name: 'Quesadilla', price: 38 }, { name: 'Nachos grande', price: 42 }, { name: 'Horchata', price: 18 }],
    partnerOffers: [],
    spottedOffers: [{ source: 'Spotted', title: 'Welcome', text: 'Double stamps on your first visit' }],
  },
  {
    id: 'kiln', name: 'Kiln Bakery', mono: 'KB', cat: 'Bakery', group: 'Food', tags: 'bakery bread cakes dessert',
    dist: 14.1, ang: 230, lo: 16, hi: 40,
    partner: false, saved: false,
    c1: '#A8581C', c2: '#DDA15E', kind: 'Bakery menu',
    menu: [{ name: 'Sourdough loaf', price: 28 }, { name: 'Cardamom bun', price: 16 }, { name: 'Date cake', price: 30 }],
    partnerOffers: [],
    spottedOffers: [],
  },
  {
    id: 'dune', name: 'Dune Coffee', mono: 'DC', cat: 'Café', group: 'Food', tags: 'coffee cafe',
    dist: 12, ang: -150, lo: 18, hi: 40,
    partner: true, saved: false, isNew: true,
    c1: '#6E4A31', c2: '#B08968', kind: 'Café menu',
    menu: [{ name: 'Saffron latte', price: 24 }, { name: 'Date & tahini cookie', price: 14 }, { name: 'Iced V60', price: 22 }],
    partnerOffers: [{ source: 'Fazaa', text: '10% off all orders' }],
    spottedOffers: [{ source: 'Spotted', title: 'Stamp card', text: 'Collect stamps, discount rises up to 25%' }],
  },
];

export const INFLUENCERS: Influencer[] = [
  { id: 'capital', handle: 'capital.bites', initial: 'C', gradient: ['#7B2CBF', '#E5383B'], platforms: ['ig', 'tt'], followers: '48.2K', niche: 'Food in Abu Dhabi', picks: ['saffron', 'stack', 'kaze', 'brew', 'taco', 'forno', 'shawarma'], more: ['masala', 'kiln', 'casa'] },
  { id: 'forkful', handle: 'forkful.ad', initial: 'F', gradient: ['#F77F00', '#D62839'], platforms: ['ig', 'yt'], followers: '31.5K', niche: 'Honest food reviews', picks: ['forno', 'saffron', 'brew', 'kaze', 'masala', 'kiln', 'dune'], more: ['stack', 'taco'] },
  { id: 'lunchmap', handle: 'thelunchmap', initial: 'L', gradient: ['#2A9D8F', '#264653'], platforms: ['tt'], followers: '92K', niche: 'Lunch spots under AED 50', picks: ['shawarma', 'taco', 'stack', 'masala', 'casa', 'saffron', 'kiln'], more: ['brew'] },
  { id: 'spice', handle: 'spice.trail.uae', initial: 'S', gradient: ['#E85D04', '#9D4EDD'], platforms: ['ig', 'tt', 'yt'], followers: '64.8K', niche: 'Spice lovers, UAE', picks: ['saffron', 'masala', 'kaze', 'taco', 'casa', 'shawarma', 'forno'], more: ['stack', 'dune'] },
  { id: 'rack', handle: 'rackandrail.ad', initial: 'R', gradient: ['#B5179E', '#3A0CA3'], platforms: ['ig'], followers: '27.1K', niche: 'Fashion & weekends', picks: ['luma', 'thread', 'glow', 'starlight', 'brew', 'dune', 'kaze'], more: [] },
  { id: 'weekend', handle: 'weekend.plans.ad', initial: 'W', gradient: ['#4361EE', '#4CC9F0'], platforms: ['ig', 'tt'], followers: '12.4K', niche: 'Things to do this weekend', picks: ['starlight', 'glow', 'casa', 'stack', 'brew', 'forno', 'luma'], more: [], isNew: true },
  { id: 'sweet', handle: 'the.sweet.stop', initial: 'T', gradient: ['#FF6B9A', '#C77DFF'], platforms: ['ig'], followers: '8.9K', niche: 'Desserts & coffee', picks: ['kiln', 'brew', 'dune', 'kaze', 'forno', 'saffron', 'casa'], more: [], isNew: true },
];

export const PLATFORM_NAMES: Record<Platform, string> = { ig: 'Instagram', tt: 'TikTok', yt: 'YouTube' };

// Words the Home search box types out, one after another.
export const SEARCH_EXAMPLES = ['Indian', 'clothes', 'movies', 'Mexican', 'coffee', 'sushi', 'capital.bites'];

// Category choices in the filter sheet, and the distance choices (km).
export const CATEGORY_FILTERS = ['All', 'Food', 'Shopping', 'Fun', 'Indian', 'Mexican', 'Café'];
export const DISTANCE_FILTERS = [1, 5, 10, 15];

export const NEW_OFFERS: NewOffer[] = [
  { placeId: 'saffron', source: 'Esaad', text: '15% off the whole bill', ends: 'Ends in 3 days' },
  { placeId: 'stack', source: 'Spotted', text: 'Free truffle fries with any burger', ends: 'Ends Sunday' },
  { placeId: 'luma', source: 'Fazaa', text: '20% off the new season', ends: '5 days left' },
  { placeId: 'casa', source: 'Spotted', text: 'Double stamps on your first visit', ends: 'This week only' },
];

export const LOYALTY: LoyaltyCard[] = [
  { placeId: 'saffron', stamps: 4, gradient: ['#D9661A', '#9C3D00'] },
  { placeId: 'brew', stamps: 5, gradient: ['#6F4E37', '#3B2A1E'] },
  { placeId: 'stack', stamps: 2, gradient: ['#C81D2E', '#7A0E18'] },
];

// Discount (percent) at each stamp count, 0 to 6 stamps. The most you can reach is 25%.
export const LEVEL = [0, 0, 5, 5, 10, 15, 25];

// ---- helpers -------------------------------------------------------------------------------

export const placeById = (id: string): Place | undefined => PLACES.find((p) => p.id === id);

// 1.2 -> '1.2 km away',  13.4 -> '13 km away'
export const fmt = (distanceKm: number): string =>
  (distanceKm < 10 ? distanceKm.toFixed(1) : String(Math.round(distanceKm))) + ' km away';

// Which influencers recommend a place (as a top pick or in their other recommendations).
// `index` is the influencer's position in INFLUENCERS (used to pick sample menu items).
export function recsFor(placeId: string): { influencer: Influencer; index: number }[] {
  return INFLUENCERS.map((influencer, index) => ({ influencer, index })).filter(
    ({ influencer }) => influencer.picks.includes(placeId) || influencer.more.includes(placeId)
  );
}

// Two sample menu items an influencer "recommends" at a place (one or two, never the same twice).
export function itemsFor(index: number, place: Place): MenuItem[] {
  const n = place.menu.length;
  const a = place.menu[index % n];
  const b = place.menu[(index + 2) % n];
  const items = [{ name: a.name, price: a.price }];
  if (b.name !== a.name) items.push({ name: b.name, price: b.price });
  return items;
}

// Does the place have any discount or deal?
export const hasOffers = (place: Place): boolean => place.partnerOffers.length + place.spottedOffers.length > 0;

// The two colours of a place's logo gradient, from lightest (c2) to darkest (c1).
export const thumbColors = (place: Pick<Place, 'c1' | 'c2'>): [string, string] => [place.c2, place.c1];
