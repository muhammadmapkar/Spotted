import { PLACES, Place, placeById } from '../data/mock';
import { loadSavedPlaceIds } from '../services/savedPlaces';
import { coordinatesOf } from '../place/placeData';
import { WatchTarget } from './rules';

// Saved Spotted places (the ones in the Saved tab) can send nearby alerts too.
// The phone calls their circles "venue:<id>", so they cannot be mixed up with places saved from reels.

const PREFIX = 'venue:';

export const venueRegionId = (placeId: string): string => PREFIX + placeId;

// "venue:saffron" -> "saffron", anything else -> null
export const parseVenueRegion = (identifier: string): string | null => (identifier.startsWith(PREFIX) ? identifier.slice(PREFIX.length) : null);

// The saved Spotted places, from the phone. Never saved or removed anything yet = the starting saved places.
export async function savedVenueIds(): Promise<string[]> {
  const stored = await loadSavedPlaceIds();
  const ids = stored ?? PLACES.filter((p) => p.saved).map((p) => p.id);
  return ids.filter((id) => placeById(id) !== undefined);
}

export interface VenueTarget extends WatchTarget {
  place: Place;
}

// The circles to watch for the saved Spotted places.
export async function venueTargets(): Promise<VenueTarget[]> {
  const targets: VenueTarget[] = [];
  for (const id of await savedVenueIds()) {
    const place = placeById(id);
    if (place) targets.push({ identifier: venueRegionId(id), place, ...coordinatesOf(place) });
  }
  return targets;
}
