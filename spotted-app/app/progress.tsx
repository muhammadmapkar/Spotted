import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { REWARD_RATES } from '../src/data';
import { useStore } from '../src/store';
import { font, radius, space, useTheme } from '../src/theme';
import { T } from '../src/ui';

export default function Progress() {
  const c = useTheme();
  const { streak, tier, nextTier, visits } = useStore();
  const tiers = REWARD_RATES.freeMealTiers;
  const base = tiers.filter((t) => visits.length >= t.visits).slice(-1)[0];
  const pct = nextTier ? (visits.length - base.visits) / (nextTier.visits - base.visits) : 1;

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.lg, alignItems: 'center', gap: space.sm }}>
        <Ionicons name="flame" size={40} color={streak > 0 ? c.accent : c.muted} />
        <T style={{ fontFamily: font.bold, fontSize: 32 }}>{streak} {streak === 1 ? 'day' : 'days'}</T>
        <T style={{ color: c.muted, textAlign: 'center' }}>{streak > 0 ? 'Keep going. Spot a place or verify a visit today.' : 'Spot a place or verify a visit to start a streak.'}</T>
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
        <T style={{ fontFamily: font.semi, fontSize: 18 }}>Level: {tier}</T>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: c.line }}>
          <View style={{ height: 10, borderRadius: 5, width: `${Math.round(pct * 100)}%`, backgroundColor: c.visit }} />
        </View>
        <T style={{ fontSize: 12, color: c.muted }}>{nextTier ? `${nextTier.visits - visits.length} verified visits to ${nextTier.name}` : 'Top level reached'}</T>
        {tiers.map((t) => (
          <View key={t.name} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 32 }}>
            <Ionicons name={visits.length >= t.visits ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={visits.length >= t.visits ? c.visit : c.muted} />
            <T>{t.name}</T><T style={{ color: c.muted, fontSize: 12 }}>{t.visits} verified visits</T>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
