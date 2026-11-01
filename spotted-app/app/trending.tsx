import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { Cuisine, PLACES } from '../src/data';
import { font, radius, space, useTheme } from '../src/theme';
import { PlaceCard, T } from '../src/ui';

const CITIES = ['All cities', ...new Set(PLACES.map((p) => p.city))];
const CUISINES: ('All cuisines' | Cuisine)[] = ['All cuisines', ...new Set(PLACES.map((p) => p.cuisine))];

export default function Trending() {
  const c = useTheme();
  const router = useRouter();
  const [city, setCity] = useState(CITIES[0]);
  const [cuisine, setCuisine] = useState<string>(CUISINES[0]);

  const rows = useMemo(() => PLACES
    .filter((p) => (city === CITIES[0] || p.city === city) && (cuisine === CUISINES[0] || p.cuisine === cuisine))
    .sort((a, b) => b.weeklySaves - a.weeklySaves), [city, cuisine]);

  const Chip = ({ label, on, press }: { label: string; on: boolean; press: () => void }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`Filter ${label}`} onPress={press}
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.lg, backgroundColor: on ? c.primary : c.surface }}>
      <T style={{ color: on ? '#FFFFFF' : c.text, fontFamily: font.medium }}>{label}</T>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        {CITIES.map((x) => <Chip key={x} label={x} on={city === x} press={() => setCity(x)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        {CUISINES.map((x) => <Chip key={x} label={x} on={cuisine === x} press={() => setCuisine(x)} />)}
      </ScrollView>
      <FlatList data={rows} keyExtractor={(p) => p.id} contentContainerStyle={{ gap: space.sm }}
        ListEmptyComponent={<T style={{ color: c.muted, textAlign: 'center' }}>Nothing trending for this filter yet.</T>}
        renderItem={({ item, index }) => (
          <PlaceCard place={item} caption={`#${index + 1} · ${item.cuisine} · ${item.weeklySaves} saves this week`} onPress={() => router.push(`/place/${item.id}`)} />
        )} />
      <T style={{ fontSize: 12, color: c.muted }}>Weekly saves are sample numbers until the Spotted server is connected.</T>
    </View>
  );
}
