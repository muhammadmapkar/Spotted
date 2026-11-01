import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { PLACES, Place } from '../src/data';
import { useStore } from '../src/store';
import { font, radius, space, useTheme } from '../src/theme';
import { Button, PlaceLogo, T } from '../src/ui';

// Step 1: pick the place. Step 2: add the dish and reel link. One tap on "Spot it" saves the pin.
export default function SpotIt() {
  const c = useTheme();
  const router = useRouter();
  const { tagSpot, spots } = useStore();
  const [q, setQ] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [dish, setDish] = useState('');
  const [reel, setReel] = useState('');
  const [done, setDone] = useState(false);

  const results = useMemo(() => PLACES.filter((p) => `${p.name} ${p.area}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const input = { minHeight: 44, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md, fontFamily: font.regular, color: c.text } as const;

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.back(), 1200);
    return () => clearTimeout(t);
  }, [done, router]);

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
        <Ionicons name="checkmark-circle" size={72} color={c.visit} />
        <T style={{ fontFamily: font.bold, fontSize: 24 }}>Spotted!</T>
        <T style={{ color: c.muted }}>{place?.name} is now a pin on your map.</T>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={{ flex: 1, padding: space.md, gap: space.md }}>
        <TextInput accessibilityLabel="Search restaurants" placeholder="Search for the restaurant" placeholderTextColor={c.muted} value={q} onChangeText={setQ} style={input} />
        <FlatList data={results} keyExtractor={(p) => p.id} contentContainerStyle={{ gap: space.sm }}
          ListEmptyComponent={<T style={{ color: c.muted, textAlign: 'center' }}>We couldn't find that place. Try another name.</T>}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`Pick ${item.name}`} onPress={() => setPlace(item)}
              style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', minHeight: 44 }}>
              <PlaceLogo place={item} size={48} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.semi }}>{item.name}</T>
                <T style={{ fontSize: 12, color: c.muted }}>{item.area}, {item.city}</T>
              </View>
              {spots.some((s) => s.placeId === item.id) && <T style={{ fontSize: 12, color: c.visit }}>Already spotted</T>}
            </Pressable>
          )} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <PlaceLogo place={place} size={56} />
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: font.semi, fontSize: 18 }}>{place.name}</T>
          <T style={{ fontSize: 12, color: c.muted }}>{place.area}, {place.city}</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Change place" onPress={() => setPlace(null)} style={{ minHeight: 44, justifyContent: 'center' }}>
          <T style={{ color: c.primary, fontFamily: font.medium }}>Change</T>
        </Pressable>
      </View>
      <TextInput accessibilityLabel="Dish" placeholder="Dish you featured (optional)" placeholderTextColor={c.muted} value={dish} onChangeText={setDish} style={input} />
      <TextInput accessibilityLabel="Reel link" placeholder="Reel link (optional)" placeholderTextColor={c.muted} value={reel} onChangeText={setReel} autoCapitalize="none" keyboardType="url" style={input} />
      <Button label="Spot it" kind="accent" icon="location" onPress={() => { tagSpot(place.id, dish, reel); setDone(true); }} />
    </View>
  );
}
