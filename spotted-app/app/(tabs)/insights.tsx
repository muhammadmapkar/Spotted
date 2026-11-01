import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { REWARD_RATES } from '../../src/data';
import { useStore } from '../../src/store';
import { font, radius, space, useTheme } from '../../src/theme';
import { Button, Stat, T } from '../../src/ui';

export default function Insights() {
  const c = useTheme();
  const router = useRouter();
  const { spots, placeOf, visits, earnings } = useStore();
  const places = spots.map((s) => placeOf(s.placeId)).filter((p): p is NonNullable<typeof p> => !!p);
  const saves = places.reduce((n, p) => n + p.saves, 0);
  const wentBecause = places.reduce((n, p) => n + p.visits, 0);
  const bookings = Math.round(wentBecause * 0.3);
  const max = Math.max(1, ...places.map((p) => p.saves));

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat label="Saves" value={saves} icon="star" color={c.save} />
        <Stat label="Went because of you" value={wentBecause} icon="star" color={c.visit} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat label="Bookings" value={bookings} icon="calendar" color={c.primary} />
        <Stat label="Your verified visits" value={visits.length} icon="checkmark-circle" color={c.visit} />
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
        <T style={{ fontFamily: font.semi, fontSize: 18 }}>Saves by place</T>
        {places.length === 0 && <T style={{ color: c.muted }}>Spot a place to see how it performs.</T>}
        {places.map((p) => (
          <View key={p.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T style={{ fontSize: 12 }}>{p.name}</T><T style={{ fontSize: 12 }}>{p.saves} saves</T>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.line }}>
              <View style={{ height: 8, borderRadius: 4, width: `${(p.saves / max) * 100}%`, backgroundColor: c.primary }} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
        <T style={{ fontFamily: font.semi, fontSize: 18 }}>Earned so far: {earnings} rupees</T>
        <T style={{ fontSize: 12, color: c.muted }}>{REWARD_RATES.perVerifiedVisit} rupees per verified visit. See the full rewards breakdown.</T>
        <Button label="View rewards" kind="ghost" onPress={() => router.push('/rewards')} />
      </View>

      <T style={{ fontSize: 12, color: c.muted }}>Saves, visits and bookings are sample numbers until the Spotted server is connected.</T>
    </ScrollView>
  );
}
