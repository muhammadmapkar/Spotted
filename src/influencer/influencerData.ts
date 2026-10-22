// The rules behind the Influencer page, kept apart from the screen so they are easy to test.

import { INFLUENCERS, Influencer, MenuItem, PLATFORM_NAMES, Place, Platform, itemsFor, placeById } from '../data/mock';
import { profileUrl, reelUrlFor } from '../place/placeData';

export const findInfluencer = (id: string | undefined): Influencer | undefined => INFLUENCERS.find((i) => i.id === id);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The chip next to "This month's top 7", e.g. "October".
export const monthLabel = (date: Date = new Date()): string => MONTHS[date.getMonth()];

// ---- profile links ---------------------------------------------------------------------------

export interface ProfileLinks {
  app: string | null; // opens the app directly, when we know how
  web: string; // the website: used when the app is not installed
}

// Instagram has a link that opens its app straight on the profile. TikTok and YouTube web links are
// opened by their apps automatically when installed, so those only need the web link.
export function profileLinks(handle: string, platform: Platform): ProfileLinks {
  return {
    app: platform === 'ig' ? `instagram://user?username=${encodeURIComponent(handle)}` : null,
    web: profileUrl(handle, platform),
  };
}

// Open a profile: the app first, and the website if the app is not installed (or anything goes wrong).
// `open` is Linking.openURL. Returns what happened, so the screen can say something if nothing worked.
export async function openWithFallback(links: ProfileLinks, open: (url: string) => Promise<unknown>): Promise<'app' | 'web' | 'failed'> {
  if (links.app) {
    try {
      await open(links.app);
      return 'app';
    } catch {
      // the app is not installed: fall through to the website
    }
  }
  try {
    await open(links.web);
    return 'web';
  } catch {
    return 'failed';
  }
}

// ---- the page --------------------------------------------------------------------------------

export interface PlatformButton {
  platform: Platform;
  label: string; // "Instagram"
  delay: number; // ms: the buttons pop in one by one
  links: ProfileLinks;
}

export const platformButtons = (influencer: Influencer): PlatformButton[] =>
  influencer.platforms.map((platform, i) => ({
    platform,
    label: PLATFORM_NAMES[platform],
    delay: 300 + i * 120,
    links: profileLinks(influencer.handle, platform),
  }));

export interface TopCard {
  rank: number; // 1 to 7
  place: Place;
  items: MenuItem[]; // what they recommend there, with prices
  delay: number; // ms: the cards fan in one after another
}

// "This month's top 7": the influencer's picks, best first (at most 7).
export function topSeven(influencer: Influencer): TopCard[] {
  const index = Math.max(0, INFLUENCERS.findIndex((i) => i.id === influencer.id));
  const cards: TopCard[] = [];
  influencer.picks.slice(0, 7).forEach((placeId, i) => {
    const place = placeById(placeId);
    if (place) cards.push({ rank: cards.length + 1, place, items: place.menu.length > 0 ? itemsFor(index + i, place) : [], delay: 200 + i * 110 });
  });
  return cards;
}

export interface RecommendationRow {
  place: Place;
  platform: Platform; // the platform of the reel (their first one)
  reelUrl: string | null;
  delay: number;
}

// "All recommendations": every place they picked or made reels about, each with a reel link.
export function allRecommendations(influencer: Influencer): RecommendationRow[] {
  const platform = influencer.platforms[0];
  const seen = new Set<string>();
  const rows: RecommendationRow[] = [];
  for (const placeId of [...influencer.picks, ...influencer.more]) {
    const place = placeById(placeId);
    if (!place || seen.has(placeId)) continue;
    seen.add(placeId);
    rows.push({ place, platform, reelUrl: reelUrlFor(influencer, placeId, platform), delay: rows.length * 50 });
  }
  return rows;
}

// "capital.bites" -> the line under the handle
export const followersLine = (influencer: Influencer): string => `${influencer.followers} followers · ${influencer.niche}`;
