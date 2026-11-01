import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Share, View } from 'react-native';
import { PUBLIC_BASE } from '../src/data';
import { useStore } from '../src/store';
import { font, radius, space, useTheme } from '../src/theme';
import { Button, PlaceCard, T } from '../src/ui';

// The public link-in-bio view of the creator: all their spots, grouped by city.
export default function MyPage() {
  const c = useTheme();
  const router = useRouter();
  const { handle, spots, placeOf } = useStore();
  const places = spots.map((s) => placeOf(s.placeId)).filter((p): p is NonNullable<typeof p> => !!p);
  const saves = places.reduce((n, p) => n + p.saves, 0);
  const visits = places.reduce((n, p) => n + p.visits, 0);
  const cities = [...new Set(places.map((p) => p.city))];
  const link = `${PUBLIC_BASE}/@${handle}`;

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ color: '#FFFFFF', fontFamily: font.bold, fontSize: 28 }}>{handle.slice(0, 2).toUpperCase()}</T>
        </View>
        <T style={{ fontFamily: font.bold, fontSize: 24 }}>@{handle}</T>
        <T style={{ color: c.muted }}>{places.length} places · {saves} saves · {visits} visits</T>
      </View>
      <Button label="Share my page" icon="share-outline" onPress={() => Share.share({ message: `See where I've been Spotted: ${link}` })} />

      {places.length === 0 && <T style={{ color: c.muted, textAlign: 'center' }}>No places yet. Spot your first one.</T>}
      {cities.map((city) => (
        <View key={city} style={{ gap: space.sm }}>
          <T style={{ fontFamily: font.semi, fontSize: 18 }}>{city}</T>
          {places.filter((p) => p.city === city).map((p) => <PlaceCard key={p.id} place={p} onPress={() => router.push(`/place/${p.id}`)} />)}
        </View>
      ))}
      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md }}>
        <T style={{ fontSize: 12, color: c.muted }}>Your link: {link}</T>
      </View>
    </ScrollView>
  );
}
