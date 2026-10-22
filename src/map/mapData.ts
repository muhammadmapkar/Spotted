import { PLACES, Place, fmt } from '../data/mock';
import { NEAR_KM } from '../home/homeData';
import { coordinatesAround } from '../place/placeData';

// The rules behind the Map tab, kept apart from the drawing so they can be tested.
// (prototype: the "map" part of its script)

export const MAP_RADIUS_KM = NEAR_KM; // the circle around you

export type PinKind = 'saved' | 'partner';

export interface MapPin {
  place: Place;
  kind: PinKind; // saved = red bookmark, partner = purple pin
  delay: number; // ms: the pins pop in one by one
}

// Pins: your saved places (red bookmarks), and Spotted Partners you have not saved (purple pins),
// all within 15 km.
export function mapPins(savedIds: ReadonlySet<string>, places: Place[] = PLACES): MapPin[] {
  return places
    .filter((p) => p.dist <= MAP_RADIUS_KM && (savedIds.has(p.id) || p.partner))
    .map((place, i) => ({ place, kind: savedIds.has(place.id) ? 'saved' : 'partner', delay: 200 + i * 70 }) as MapPin);
}

// Pins are drawn around the user (sample places have only a distance and a direction).
export const pinCoordinates = (center: { latitude: number; longitude: number }, place: Place) =>
  place.latitude !== undefined && place.longitude !== undefined
    ? { latitude: place.latitude, longitude: place.longitude }
    : coordinatesAround(center, place);

// The part of the real map shown at the start: the whole 15 km circle with a little room around it.
export function startRegion(center: { latitude: number; longitude: number }) {
  const latitudeDelta = (MAP_RADIUS_KM * 2.4) / 111;
  const longitudeDelta = latitudeDelta / Math.cos((center.latitude * Math.PI) / 180);
  return { ...center, latitudeDelta, longitudeDelta };
}

export const circleMeters = MAP_RADIUS_KM * 1000;

// Where a pin sits on the drawn (preview) map, measured from the user's dot: the further the place, the further out.
export function sketchOffset(place: Pick<Place, 'dist' | 'ang'>, radiusPx: number): { x: number; y: number } {
  const r = (place.dist / MAP_RADIUS_KM) * radiusPx;
  const a = (place.ang * Math.PI) / 180;
  return { x: Math.round(r * Math.cos(a)), y: Math.round(r * Math.sin(a)) };
}

// The words on the card of the tapped pin.
export const cardLine = (place: Place): string => `${place.cat} · AED ${place.lo}–${place.hi} pp`;
export const cardDistance = (place: Place): string => fmt(place.dist);

export const LEGEND = [
  { key: 'saved', label: 'Saved' },
  { key: 'partner', label: 'Spotted Partner' },
  { key: 'you', label: 'You' },
] as const;

export const MAP_CHIP = `${MAP_RADIUS_KM} km around you`;
export const PREVIEW_NOTE = 'Preview map. The real map appears once a Google Maps key is added.';
