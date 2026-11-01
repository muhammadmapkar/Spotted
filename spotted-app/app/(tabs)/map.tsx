import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { PLACES } from '../../src/data';
import { useStore } from '../../src/store';
import { radius, space, useTheme } from '../../src/theme';
import { Button, PlaceCard, T } from '../../src/ui';

const MUMBAI: Region = { latitude: 19.03, longitude: 72.85, latitudeDelta: 0.25, longitudeDelta: 0.25 };

export default function MapScreen() {
  const c = useTheme();
  const router = useRouter();
  const { spots, placeOf } = useStore();
  const map = useRef<MapView>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [askedLocation, setAskedLocation] = useState(false);
  const [denied, setDenied] = useState(false);

  const mine = spots.map((s) => placeOf(s.placeId)).filter((p): p is NonNullable<typeof p> => !!p);
  const shown = selected ? mine.filter((p) => p.id === selected) : mine;

  async function recenter() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setDenied(true); setAskedLocation(false); return; }
    setDenied(false);
    const pos = await Location.getCurrentPositionAsync({});
    map.current?.animateToRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView ref={map} style={{ flex: 1 }} initialRegion={MUMBAI} showsUserLocation={!denied} onPress={() => setSelected(null)}>
        {mine.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.name} description={p.area} pinColor={c.accent}
            onPress={() => setSelected(p.id)} />
        ))}
      </MapView>

      {denied && (
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => Linking.openSettings()}
          style={{ position: 'absolute', top: space.md, left: space.md, right: space.md, backgroundColor: c.primary, borderRadius: radius.md, padding: space.md }}>
          <T style={{ color: '#FFFFFF' }}>Turn on location to see yourself on the map. Tap to open Settings.</T>
        </Pressable>
      )}

      {askedLocation && (
        <View style={{ position: 'absolute', top: space.md, left: space.md, right: space.md, backgroundColor: c.bg, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
          <T>Spotted uses your location to centre the map on you. It isn't shared with anyone.</T>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Allow" onPress={() => { setAskedLocation(false); recenter(); }} style={{ flex: 1 }} />
            <Button label="Not now" kind="ghost" onPress={() => setAskedLocation(false)} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="Recenter map" onPress={() => setAskedLocation(true)}
        style={{ position: 'absolute', right: space.md, bottom: 220, width: 48, height: 48, borderRadius: 24, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="locate" size={24} color="#FFFFFF" />
      </Pressable>

      <View style={{ backgroundColor: c.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.md, maxHeight: 200 }}>
        {shown.length === 0 ? (
          <View style={{ gap: space.sm, alignItems: 'center' }}>
            <T style={{ color: c.muted, textAlign: 'center' }}>Your pins show up here. {PLACES.length} places are ready to spot.</T>
            <Button label="Spot it" icon="add" kind="accent" onPress={() => router.push('/spot-it')} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ gap: space.sm }}>
            {shown.map((p) => <PlaceCard key={p.id} place={p} onPress={() => router.push(`/place/${p.id}`)} />)}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
