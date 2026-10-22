import { INFLUENCERS, Influencer, NEW_OFFERS, NewOffer, PLACES, Place, placeById } from '../data/mock';
import { NEAR_KM } from '../home/homeData';

// The rules behind the New In tab, kept apart from the drawing so they can be tested.
// Everything is within 15 km of the user. The sections slide in one after another.

export const SUBTITLE = `Fresh within ${NEAR_KM} km of you`;
export const SECTION_TITLES = { offers: 'New offers', influencers: 'New influencers on Spotted', places: 'New places on Spotted' } as const;
export const SECTION_DELAYS = { offers: 150, influencers: 300, places: 450 } as const; // ms: each section starts a little later

export interface NewOfferCard {
  offer: NewOffer;
  place: Place;
  delay: number;
}

// New offers, with the place they belong to. Offers of places farther than 15 km are left out.
export function newOfferCards(offers: NewOffer[] = NEW_OFFERS): NewOfferCard[] {
  const cards: NewOfferCard[] = [];
  for (const offer of offers) {
    const place = placeById(offer.placeId);
    if (place && place.dist <= NEAR_KM) cards.push({ offer, place, delay: cards.length * 90 });
  }
  return cards;
}

export interface NewInfluencerItem {
  influencer: Influencer;
  delay: number;
}

export const newInfluencers = (influencers: Influencer[] = INFLUENCERS): NewInfluencerItem[] =>
  influencers.filter((i) => i.isNew).map((influencer, i) => ({ influencer, delay: 300 + i * 100 }));

export interface NewPlaceItem {
  place: Place;
  index: number;
}

// Places that just joined Spotted as partners, within 15 km, nearest first.
export const newPlaces = (places: Place[] = PLACES): NewPlaceItem[] =>
  places
    .filter((p) => p.isNew && p.dist <= NEAR_KM)
    .sort((a, b) => a.dist - b.dist)
    .map((place, index) => ({ place, index }));

export const NEW_BADGE = 'NEW';
export const JUST_JOINED = 'JUST JOINED';
