import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Category } from '../../src/data';
import { useStore } from '../../src/store';
import { font, radius, space, useTheme } from '../../src/theme';
import { Button, PlaceCard, T, screen } from '../../src/ui';

const FILTERS: ('All' | Category)[] = ['All', 'Food', 'Cafe', 'Shops'];

export default function Home() {
  const c = useTheme();
  const router = useRouter();
  const { spots, placeOf, removeSpot } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'All' | Category>('All');

  const rows = useMemo(() => spots.flatMap((s) => {
    const p = placeOf(s.placeId);
    if (!p) return [];
    if (filter !== 'All' && p.category !== filter) return [];
    if (q && !`${p.name} ${p.area}`.toLowerCase().includes(q.toLowerCase())) return [];
    return [{ spot: s, place: p }];
  }), [spots, filter, q, placeOf]);

  return (
    <View style={screen.root}>
      <TextInput
        accessibilityLabel="Search your spots" placeholder="Search your spots" placeholderTextColor={c.muted}
        value={q} onChangeText={setQ}
        style={{ minHeight: 44, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md, fontFamily: font.regular, color: c.text }}
      />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {FILTERS.map((f) => (
          <Pressable key={f} accessibilityRole="button" accessibilityLabel={`Filter ${f}`} onPress={() => setFilter(f)}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.lg, backgroundColor: filter === f ? c.primary : c.surface }}>
            <T style={{ color: filter === f ? '#FFFFFF' : c.text, fontFamily: font.medium }}>{f}</T>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={rows} keyExtractor={(r) => r.place.id} contentContainerStyle={{ gap: space.sm, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.lg }}>
            <Ionicons name="location" size={48} color={c.soft} />
            <T style={{ textAlign: 'center', color: c.muted }}>Nothing spotted yet. Tag the place from your latest reel.</T>
            <Button label="Spot it" icon="add" onPress={() => router.push('/spot-it')} />
          </View>
        }
        renderItem={({ item }) => (
          <PlaceCard place={item.place} caption={item.spot.dish ? `${item.spot.dish} · ${item.place.area}` : undefined}
            onPress={() => router.push(`/place/${item.place.id}`)}
            right={<Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.place.name}`} onPress={() => removeSpot(item.place.id)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trash-outline" size={20} color={c.muted} />
            </Pressable>} />
        )}
      />
      {rows.length > 0 && <Button label="Spot it" icon="add" kind="accent" onPress={() => router.push('/spot-it')} />}
    </View>
  );
}
