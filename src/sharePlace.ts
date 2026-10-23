import { SavedPlace } from './db/types';

// A Google Maps link that opens the place. It is a plain web link, so it needs no key.
// The place id makes Maps show the real business page; demo places have a made-up id, so they use only the position.
export function mapsLink(place: Pick<SavedPlace, 'name' | 'latitude' | 'longitude' | 'googlePlaceId'>): string {
  const position = `${place.latitude},${place.longitude}`;
  const hasRealId = place.googlePlaceId !== '' && !place.googlePlaceId.startsWith('demo-');
  return hasRealId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.googlePlaceId)}`
    : `https://www.google.com/maps/search/?api=1&query=${position}`;
}

// The message a friend receives when you share a place: name, your note, a Google Maps link and the reel link.
// Lines that don't apply (no note, no reel) are left out.
export function placeShareText(place: SavedPlace): string {
  const lines = [`📍 ${place.name}`];
  if (place.address) lines.push(place.address);
  if (place.note) lines.push(`“${place.note}”`);
  lines.push('', `Google Maps: ${mapsLink(place)}`);
  if (place.reelUrl) lines.push(`Reel: ${place.reelUrl}`);
  lines.push('', 'Saved with Spotted');
  return lines.join('\n');
}
