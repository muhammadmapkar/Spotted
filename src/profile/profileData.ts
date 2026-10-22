import { LEVEL, LOYALTY, LoyaltyCard, Place, placeById } from '../data/mock';

// The rules behind the Profile tab, kept apart from the drawing so they can be tested.

// ---- savings ---------------------------------------------------------------------------------

export const SAVINGS_TOTAL = 340; // sample value (AED) until real savings come from a backend
export const COUNT_STEP = 11; // the big number goes up by this much...
export const COUNT_EVERY_MS = 28; // ...every 28 ms, so it reaches 340 in under a second

// The next value of the count-up: 0, 11, 22 ... never past the total.
export const nextCount = (current: number, total: number = SAVINGS_TOTAL): number => Math.min(total, current + COUNT_STEP);

export interface SavingsPart {
  label: 'Spotted' | 'Esaad' | 'Fazaa';
  value: number; // AED
}

// The split of the savings. Spotted 145 + Esaad 120 + Fazaa 75 = 340; while the number counts up, the parts follow it.
export function savingsBreakdown(shown: number, total: number = SAVINGS_TOTAL): SavingsPart[] {
  return [
    { label: 'Spotted', value: Math.round((shown * 145) / total) },
    { label: 'Esaad', value: Math.round((shown * 120) / total) },
    { label: 'Fazaa', value: Math.round((shown * 75) / total) },
  ];
}

// The little gold coins that burst out when the card appears (prototype: .coin).
export const COINS = [
  { left: 0.7, top: 0.4, dx: 40, dy: -60, delay: 900 },
  { left: 0.72, top: 0.45, dx: 70, dy: -20, delay: 1000 },
  { left: 0.68, top: 0.42, dx: -20, dy: -70, delay: 1100 },
  { left: 0.7, top: 0.5, dx: 50, dy: 30, delay: 1050 },
] as const;

// ---- loyalty cards ---------------------------------------------------------------------------

export const MAX_STAMPS = 6;
export const MAX_DISCOUNT = Math.max(...LEVEL); // 25

// The discount (percent) a stamp count gives. Stamps outside 0 to 6 are treated as the nearest valid number.
export const discountFor = (stamps: number): number => LEVEL[Math.min(MAX_STAMPS, Math.max(0, Math.floor(stamps)))];

// The next stamp count that raises the discount, or null when the top level is reached.
export function nextLevel(stamps: number): { stamps: number; discount: number } | null {
  const have = Math.min(MAX_STAMPS, Math.max(0, Math.floor(stamps)));
  if (have >= MAX_STAMPS) return null;
  const now = LEVEL[have];
  let next = have + 1;
  while (next < MAX_STAMPS && LEVEL[next] === now) next++;
  return { stamps: next, discount: LEVEL[next] };
}

export interface StampSlot {
  index: number;
  state: 'filled' | 'next' | 'empty'; // filled = stamped, next = glows gold, empty = still to collect
  delay: number; // ms: the stamps press in one by one
}

export interface LoyaltyView {
  card: LoyaltyCard;
  place: Place;
  stampsLabel: string; // "4 of 6 stamps"
  now: number; // current discount, percent
  nowLabel: string; // "10% off"
  nextLabel: string; // "15% at 5 stamps · max 25%"
  slots: StampSlot[];
}

export function loyaltyView(card: LoyaltyCard): LoyaltyView | null {
  const place = placeById(card.placeId);
  if (!place) return null;
  const have = Math.min(MAX_STAMPS, Math.max(0, card.stamps));
  const next = nextLevel(have);
  return {
    card,
    place,
    stampsLabel: `${have} of ${MAX_STAMPS} stamps`,
    now: discountFor(have),
    nowLabel: `${discountFor(have)}% off`,
    nextLabel: next ? `${next.discount}% at ${next.stamps} stamps · max ${MAX_DISCOUNT}%` : `Max ${MAX_DISCOUNT}% reached`,
    slots: Array.from({ length: MAX_STAMPS }, (_, index) => ({
      index,
      state: index < have ? 'filled' : index === have ? 'next' : 'empty',
      delay: 300 + index * 140,
    })),
  };
}

export const loyaltyViews = (cards: LoyaltyCard[] = LOYALTY): LoyaltyView[] =>
  cards.map(loyaltyView).filter((view): view is LoyaltyView => view !== null);

// ---- notifications ---------------------------------------------------------------------------

export const whatsappMessage = (on: boolean): string => (on ? 'New offers will come to your WhatsApp' : 'WhatsApp offers turned off');
export const whatsappSubtitle = (phoneDisplay: string): string => `New deals within 15 km, sent to ${phoneDisplay}`;
export const NEARBY_SUBTITLE = 'App notifications, e.g. "A place you saved is 1 km away"';
