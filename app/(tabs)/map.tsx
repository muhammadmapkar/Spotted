import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { USE_OPEN_STREET_MAP } from '@/src/config';
import { SavedPlace, listPlaces } from '@/src/db';
import { openLink } from '@/src/openLink';

// Where the map starts if there are no saved places yet: Dubai.
const DUBAI = { latitude: 25.2048, longitude: 55.2708, latitudeDelta: 0.25, longitudeDelta: 0.25 };

// A dark look for the map in dark mode (Android). Apple Maps on iPhone switches by itself.
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2330' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e96a8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#14171f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3344' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#a0a6b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1118' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#232a3a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1c2a28' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#232a3a' }] },
];

// Opens Google Maps with directions to the place. Plain web link, no key needed.
// It opens the Google Maps app if it is installed, or the browser otherwise.
function openDirections(place: SavedPlace) {
  openLink(`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`);
}

// The Map tab: every saved place as a pin coloured by its category.
export default function MapScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [selected, setSelected] = useState<SavedPlace | null>(null);

  // Reload places every time this tab is shown, then zoom to fit all pins.
  useFocusEffect(
    useCallback(() => {
      listPlaces().then((all) => {
        setPlaces(all);
        setSelected(null);
        if (all.length > 0) {
          // Wait a moment so the map is ready before moving the camera.
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              all.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
              { edgePadding: { top: 80, right: 60, bottom: 200, left: 60 }, animated: true }
            );
          }, 300);
        }
      }).catch(() => setPlaces([])); // if loading fails, show an empty map instead of crashing
    }, [])
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DUBAI}
        userInterfaceStyle={scheme}
        customMapStyle={USE_OPEN_STREET_MAP ? undefined : scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        mapType={USE_OPEN_STREET_MAP ? 'none' : 'standard'} // 'none' = draw our own tiles below instead of Google's
        onPress={() => setSelected(null)} // tap the empty map to close the card
        toolbarEnabled={false}>
        {/* Free OpenStreetMap map pictures (used while we have no Google key) */}
        {USE_OPEN_STREET_MAP ? (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            tileSize={256}
            shouldReplaceMapContent
          />
        ) : null}

        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor={CATEGORIES[place.category].color}
            onPress={(event) => {
              event.stopPropagation(); // don't let the map treat this as an empty tap
              setSelected(place);
            }}
          />
        ))}
      </MapView>

      {/* OpenStreetMap asks everyone who uses its maps to show this credit */}
      {USE_OPEN_STREET_MAP ? (
        <Text style={[styles.credit, { color: '#1F2430' }]}>© OpenStreetMap contributors</Text>
      ) : null}

      {places.length === 0 ? (
        <View style={[styles.banner, { backgroundColor: theme.card }]}>
          <Text style={styles.bannerTitle}>No places on the map yet</Text>
          <Text style={{ color: theme.mutedText }}>Save a place and it will show up here as a pin.</Text>
        </View>
      ) : null}

      {selected ? (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.cardHeader} lightColor="transparent" darkColor="transparent">
            <Text style={styles.name} numberOfLines={2}>
              {selected.name}
            </Text>
            <View style={[styles.pill, { backgroundColor: CATEGORIES[selected.category].strongColor }]}>
              <Text style={styles.pillText}>
                {CATEGORIES[selected.category].emoji} {CATEGORIES[selected.category].label}
              </Text>
            </View>
          </View>

          <Text style={{ color: theme.mutedText }} numberOfLines={1}>
            {selected.address}
          </Text>
          {selected.note ? <Text style={styles.note}>“{selected.note}”</Text> : null}

          <View style={styles.buttons} lightColor="transparent" darkColor="transparent">
            {selected.reelUrl ? (
              <Pressable
                onPress={() => openLink(selected.reelUrl!)}
                style={[styles.button, { borderColor: theme.outline }]}>
                <Text style={styles.buttonText}>▶ Open reel</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => openDirections(selected)}
              style={[styles.button, styles.primary, { backgroundColor: theme.tintStrong, borderColor: theme.tintStrong }]}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Directions</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => router.push(`/place/${selected.id}` as never)} style={styles.detailsLink}>
            <Text style={{ color: theme.tintText, fontWeight: '600' }}>Edit place</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  credit: {
    position: 'absolute',
    left: 8,
    bottom: 6,
    fontSize: 11,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  banner: { position: 'absolute', top: 16, left: 16, right: 16, borderRadius: 14, padding: 16 },
  bannerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: USE_OPEN_STREET_MAP ? 30 : 16, // leaves room for the map credit
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  name: { flex: 1, fontSize: 18, fontWeight: '700' },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  note: { fontSize: 14, fontStyle: 'italic', marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {},
  buttonText: { fontSize: 15, fontWeight: '700' },
  detailsLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
