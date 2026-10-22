import { Palette } from '../../constants/Theme';

// A dark look for the Google map, in the Spotted dark purple colours (taken from the dark palette).
// In light mode the normal Google map is used, so this returns nothing.
export interface MapStyleRule {
  featureType?: string;
  elementType?: string;
  stylers: { color: string }[];
}

export function mapStyleFor(scheme: 'light' | 'dark', dark: Palette): MapStyleRule[] | undefined {
  if (scheme !== 'dark') return undefined;
  return [
    { elementType: 'geometry', stylers: [{ color: dark.mapLand }] },
    { elementType: 'labels.text.fill', stylers: [{ color: dark.muted }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: dark.bg }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: dark.mapRoad }] },
    { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: dark.mapMinor }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: dark.muted }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: dark.mapWater }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: dark.mapMinor }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: dark.mapPark }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: dark.mapMinor }] },
  ];
}
