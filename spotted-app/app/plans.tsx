import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { PLACES } from '../src/data';
import { useStore } from '../src/store';
import { font, radius, space, useTheme } from '../src/theme';
import { Button, PlaceLogo, T } from '../src/ui';

export default function Plans() {
  const c = useTheme();
  const router = useRouter();
  const { plans, createPlan, placeOf } = useStore();
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((x) => x.includes(id) ? x.filter((y) => y !== id) : [...x, id]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
        <T style={{ fontFamily: font.semi, fontSize: 18 }}>New group plan</T>
        <TextInput accessibilityLabel="Plan name" placeholder="Where should we eat on Saturday?" placeholderTextColor={c.muted} value={title} onChangeText={setTitle}
          style={{ minHeight: 44, borderRadius: radius.md, backgroundColor: c.bg, paddingHorizontal: space.md, fontFamily: font.regular, color: c.text }} />
        <T style={{ fontSize: 12, color: c.muted }}>Pick at least two spots to vote between.</T>
        {PLACES.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Pick ${p.name}`} onPress={() => toggle(p.id)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <PlaceLogo place={p} size={36} />
            <T style={{ flex: 1 }}>{p.name}</T>
            <Ionicons name={picked.includes(p.id) ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={picked.includes(p.id) ? c.visit : c.muted} />
          </Pressable>
        ))}
        <Button label="Create plan" disabled={picked.length < 2} onPress={() => { const id = createPlan(title, picked); setTitle(''); setPicked([]); router.push(`/plan/${id}`); }} />
      </View>

      {plans.map((pl) => (
        <Pressable key={pl.id} accessibilityRole="button" accessibilityLabel={`Open ${pl.title}`} onPress={() => router.push(`/plan/${pl.id}`)}
          style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.surface, borderRadius: radius.md, paddingHorizontal: space.md }}>
          <Ionicons name="people" size={22} color={c.primary} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.semi }}>{pl.title}</T>
            <T style={{ fontSize: 12, color: c.muted }}>{pl.placeIds.map((id) => placeOf(id)?.name).filter(Boolean).join(' · ')}</T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
