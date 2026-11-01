import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useStore } from '../../src/store';
import { font, radius, space, useTheme } from '../../src/theme';
import { T } from '../../src/ui';

export default function Profile() {
  const c = useTheme();
  const router = useRouter();
  const { handle, setHandle, tier, spots, visits, streak } = useStore();
  const Row = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.surface, borderRadius: radius.md, paddingHorizontal: space.md }}>
      <Ionicons name={icon} size={22} color={c.primary} />
      <T style={{ flex: 1, fontFamily: font.medium }}>{label}</T>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
        <T style={{ fontSize: 12, color: c.muted }}>Your handle</T>
        <TextInput accessibilityLabel="Handle" value={handle} onChangeText={setHandle} autoCapitalize="none"
          style={{ minHeight: 44, borderRadius: radius.md, backgroundColor: c.bg, paddingHorizontal: space.md, fontFamily: font.semi, fontSize: 18, color: c.text }} />
        <T style={{ fontSize: 12, color: c.muted }}>Level {tier} · {spots.length} spots · {visits.length} verified visits</T>
      </View>
      <Row icon="link" label="My Spotted page" onPress={() => router.push('/my-page')} />
      <Row icon="wallet" label="Rewards and referral code" onPress={() => router.push('/rewards')} />
      <Row icon="add-circle" label="Spot a new place" onPress={() => router.push('/spot-it')} />
      <Row icon="trending-up" label="Trending this week" onPress={() => router.push('/trending')} />
      <Row icon="list" label="My lists" onPress={() => router.push('/lists')} />
      <Row icon="people" label="Group plans" onPress={() => router.push('/plans')} />
      <Row icon="flame" label={`Streaks and levels (${streak} day streak)`} onPress={() => router.push('/progress')} />
    </ScrollView>
  );
}
