import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { barHeight } from '@/src/components/tabBarMath';
import { MapHeader } from '@/src/components/map/MapHeader';
import { MapPlaceCard } from '@/src/components/map/MapPlaceCard';
import { RealMap } from '@/src/components/map/RealMap';
import { SketchMap } from '@/src/components/map/SketchMap';
import { GOOGLE_MAPS_KEY_IN_BUILD } from '@/src/config';
import { PLACES } from '@/src/data/mock';
import { useUserLocation } from '@/src/location/useUserLocation';
import { PREVIEW_NOTE, mapPins } from '@/src/map/mapData';
import { SAMPLE_CENTER } from '@/src/place/placeData';
import { useSavedIds } from '@/src/state/saved';
import { useTheme } from '@/src/theme/ThemeProvider';

// The Map tab: the 15 km circle around you, your saved places (red bookmarks) and Spotted Partners you have
// not saved (purple pins). Tap a pin to see a small card with an Open button.
//
// On Android the Google map CRASHES the whole app if no Google Maps key is built in, so without a key we show
// a drawn preview of the same screen instead (SketchMap). iPhone uses Apple Maps, which needs no key.
export default function MapScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const savedIds = useSavedIds();
  const location = useUserLocation(); // null if location is not allowed: the sample area is used instead
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const center = useMemo(
    () => (location ? { latitude: location.latitude, longitude: location.longitude } : SAMPLE_CENTER),
    [location]
  );
  const pins = useMemo(() => mapPins(savedIds), [savedIds]);
  const selected = selectedId ? PLACES.find((p) => p.id === selectedId) ?? null : null;

  const mapIsSafe = Platform.OS !== 'android' || GOOGLE_MAPS_KEY_IN_BUILD;
  const clear = () => setSelectedId(null);

  return (
    <View style={{ flex: 1, backgroundColor: palette.mapLand }}>
      {mapIsSafe ? (
        <RealMap center={center} pins={pins} selectedId={selectedId} onSelect={setSelectedId} onClear={clear} />
      ) : (
        <SketchMap pins={pins} selectedId={selectedId} onSelect={setSelectedId} onClear={clear} />
      )}
      <MapHeader top={insets.top + 12} note={mapIsSafe ? undefined : PREVIEW_NOTE} />
      {selected ? (
        <MapPlaceCard place={selected} bottom={barHeight(insets.bottom) + 12} onOpen={() => router.push(`/venue/${selected.id}` as never)} />
      ) : null}
    </View>
  );
}
