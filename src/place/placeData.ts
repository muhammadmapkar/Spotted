// The rules behind the Place page, kept apart from the screen so they are easy to test.
// (What the page shows: subtitle, Google Maps link, influencer recommendations, offers, menu viewer.)

import { Influencer, MenuItem, Offer, PLATFORM_NAMES, Place, Platform, fmt, itemsFor, recsFor } from '../data/mock';

// ---- the line under the name ---------------------------------------------------------------

// "Indian · AED 35–80 per person · 1.2 km away"
export const placeSubtitle = (place: Place): string =>
  `${place.cat} · AED ${place.lo}–${place.hi} per person · ${fmt(place.dist)}`;

// The short message after tapping the bookmark (prototype: toggleSave).
export const saveToast = (place: Place, nowSaved: boolean): string =>
  nowSaved ? `Saved to ${place.group}` : 'Removed from saved';

// ---- links ----------------------------------------------------------------------------------

// Only web links (https, or http) are ever opened. Anything else (a "tel:" or "file:" link, or
// plain text) is refused, so a bad link in the data cannot do anything surprising.
export function safeWebUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https?:\/\/[^\s]+$/i.test(trimmed) ? trimmed : null;
}

// The sample places have no GPS position, so one is worked out from their distance and direction,
// around the sample area (Khalifa City, Abu Dhabi). Real places carry their own latitude/longitude.
const SAMPLE_CENTER = { latitude: 24.42, longitude: 54.58 };
const KM_PER_DEGREE = 111;

export function coordinatesOf(place: Place): { latitude: number; longitude: number } {
  if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
    return { latitude: place.latitude, longitude: place.longitude };
  }
  const radians = (place.ang * Math.PI) / 180;
  const latitude = SAMPLE_CENTER.latitude + (place.dist * Math.cos(radians)) / KM_PER_DEGREE;
  const longitude =
    SAMPLE_CENTER.longitude + (place.dist * Math.sin(radians)) / (KM_PER_DEGREE * Math.cos((SAMPLE_CENTER.latitude * Math.PI) / 180));
  return { latitude: Math.round(latitude * 1e6) / 1e6, longitude: Math.round(longitude * 1e6) / 1e6 };
}

// The Google Maps link for the Location button:
//   https://www.google.com/maps/search/?api=1&query=<lat>,<lng>&query_place_id=<googlePlaceId>
// (the place id is added only when the place has one)
export function mapsUrl(place: Place): string {
  const { latitude, longitude } = coordinatesOf(place);
  let url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  if (place.googlePlaceId) url += `&query_place_id=${encodeURIComponent(place.googlePlaceId)}`;
  return url;
}

// ---- influencer recommendations -------------------------------------------------------------

export interface Recommendation {
  influencer: Influencer;
  handle: string;
  initial: string;
  gradient: [string, string];
  profilePicUrl: string | null; // their picture when we have one; otherwise the screen draws gradient + initial
  platform: Platform; // the platform of the reel (their first one)
  platformLabel: string; // "Instagram"
  followers: string;
  items: MenuItem[]; // what they recommend, with prices
  reelUrl: string | null; // opens that exact reel
}

// Where a reel link goes when the data has no exact reel: the influencer's page on that platform.
export function profileUrl(handle: string, platform: Platform): string {
  if (platform === 'tt') return `https://www.tiktok.com/@${handle}`;
  if (platform === 'yt') return `https://www.youtube.com/@${handle}`;
  return `https://www.instagram.com/${handle}/`;
}

// The link for "watch the reel about this place": the exact reel when the data has it, otherwise the
// influencer's page on that platform. Never anything but a web link.
export function reelUrlFor(influencer: Influencer, placeId: string, platform: Platform): string | null {
  return safeWebUrl(influencer.reels?.[placeId]) ?? safeWebUrl(profileUrl(influencer.handle, platform));
}

export function recommendationsFor(place: Place): Recommendation[] {
  return recsFor(place.id).map(({ influencer, index }) => {
    const platform = influencer.platforms[0];
    return {
      influencer,
      handle: influencer.handle,
      initial: influencer.initial,
      gradient: influencer.gradient,
      profilePicUrl: safeWebUrl(influencer.profilePicUrl),
      platform,
      platformLabel: PLATFORM_NAMES[platform],
      followers: influencer.followers,
      items: place.menu.length > 0 ? itemsFor(index, place) : [], // a place with no menu items has nothing to recommend
      reelUrl: reelUrlFor(influencer, place.id, platform),
    };
  });
}

// ---- offers ---------------------------------------------------------------------------------

export const offerCount = (place: Place): number => place.partnerOffers.length + place.spottedOffers.length;

// The coloured source badge: Fazaa and Esaad have their own colours, Spotted offers show their title.
export const offerBadge = (offer: Offer): { label: string; kind: 'esaad' | 'fazaa' | 'spotted' } =>
  offer.source === 'Spotted'
    ? { label: offer.title ?? 'Spotted', kind: 'spotted' }
    : { label: offer.source, kind: offer.source === 'Esaad' ? 'esaad' : 'fazaa' };

export const NO_PARTNER_OFFERS = 'No Fazaa or Esaad discount here yet.';
export const NO_SPOTTED_OFFERS = 'Spotted offers appear once this place becomes a Spotted Partner.';
export const NO_RECOMMENDATIONS = 'No influencer has spotted this place yet.';

// ---- the menu -------------------------------------------------------------------------------

// What the menu sheet shows: the real PDF (inside the app) when the place has a menuPdfUrl,
// otherwise the items drawn like a paper menu.
export type MenuView =
  | { kind: 'pdf'; pdfUrl: string; viewerUri: string; fileName: string }
  | { kind: 'paper' };

// Android's built-in web view cannot show a PDF by itself (it would just offer a download), so on
// Android the PDF link is wrapped in Google's free document viewer. iPhones show PDFs directly.
export function pdfViewerUri(pdfUrl: string, os: string): string {
  return os === 'android' ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` : pdfUrl;
}

// "https://x.com/files/Saffron%20Menu.pdf?v=2" -> "Saffron Menu.pdf"
export function pdfFileName(pdfUrl: string, fallbackName: string): string {
  try {
    const last = decodeURIComponent(pdfUrl.split('?')[0].split('#')[0].split('/').filter(Boolean).pop() ?? '');
    if (/\.pdf$/i.test(last)) return last;
  } catch {
    // a badly encoded link: use the fallback below
  }
  return `${fallbackName.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}-menu.pdf`;
}

export function menuViewFor(place: Place, os: string): MenuView {
  const pdfUrl = safeWebUrl(place.menuPdfUrl);
  if (!pdfUrl) return { kind: 'paper' };
  return { kind: 'pdf', pdfUrl, viewerUri: pdfViewerUri(pdfUrl, os), fileName: pdfFileName(pdfUrl, place.name) };
}

// The file name shown at the top of the paper menu (prototype: "<name>-menu.pdf")
export const paperFileName = (place: Place): string => pdfFileName('', place.name);

// ---- the hero picture -----------------------------------------------------------------------

// The place's photo when it has a usable link; otherwise the screen draws the illustrated shop front.
export const heroPhotoUrl = (place: Place): string | null => safeWebUrl(place.photoUrl);
