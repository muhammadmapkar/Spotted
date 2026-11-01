import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { PUBLIC_BASE } from '../../src/data';
import { useStore } from '../../src/store';
import { font, radius, space, useTheme } from '../../src/theme';
import { Button, PlaceLogo, T } from '../../src/ui';

export default function PlanScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plans, placeOf, adjustVote, deletePlan } = useStore();
  const plan = plans.find((p) => p.id === id);
  if (!plan) return <View style={{ padding: space.md }}><T>This plan isn't available.</T></View>;

  const options = plan.placeIds.map(placeOf).filter((p): p is NonNullable<typeof p> => !!p);
  const top = Math.max(0, ...options.map((p) => plan.votes[p.id] ?? 0));

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <T style={{ fontFamily: font.bold, fontSize: 24 }}>{plan.title}</T>
      <Button label="Send to friends" icon="share-outline"
        onPress={() => Share.share({ message: `${plan.title}\nVote for where we go:\n${options.map((p, i) => `${i + 1}. ${p.name}, ${p.area}`).join('\n')}\nReply with a number. ${PUBLIC_BASE}/plan/${plan.id}` })} />
      <T style={{ fontSize: 12, color: c.muted }}>Friends reply in your chat. Tap + to count each vote you get. Votes sync automatically once accounts are connected.</T>

      {options.map((p) => {
        const v = plan.votes[p.id] ?? 0;
        const leading = top > 0 && v === top;
        return (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.surface, borderRadius: radius.md, padding: space.sm, borderWidth: leading ? 2 : 0, borderColor: c.visit }}>
            <PlaceLogo place={p} size={56} />
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.semi }}>{p.name}</T>
              <T style={{ fontSize: 12, color: leading ? c.visit : c.muted }}>{leading ? 'Leading' : p.area}</T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove a vote for ${p.name}`} onPress={() => adjustVote(plan.id, p.id, -1)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="remove-circle-outline" size={26} color={c.muted} />
            </Pressable>
            <T style={{ fontFamily: font.bold, fontSize: 20, minWidth: 24, textAlign: 'center' }}>{v}</T>
            <Pressable accessibilityRole="button" accessibilityLabel={`Add a vote for ${p.name}`} onPress={() => adjustVote(plan.id, p.id, 1)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add-circle" size={26} color={c.primary} />
            </Pressable>
          </View>
        );
      })}
      <Button label="Delete plan" kind="ghost" onPress={() => Alert.alert('Delete this plan?', plan.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { deletePlan(plan.id); router.back(); } }])} />
    </ScrollView>
  );
}
