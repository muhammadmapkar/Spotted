import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native';
import { Place } from './data';
import { font, radius, space, useTheme } from './theme';

export function T({ style, ...p }: TextProps) {
  const c = useTheme();
  return <Text {...p} style={[{ fontFamily: font.regular, fontSize: 15, color: c.text }, style]} />;
}

export function Button({ label, onPress, kind = 'primary', icon, disabled, style }: {
  label: string; onPress: () => void; kind?: 'primary' | 'accent' | 'ghost'; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; style?: ViewStyle;
}) {
  const c = useTheme();
  const bg = kind === 'primary' ? c.primary : kind === 'accent' ? c.accent : 'transparent';
  const fg = kind === 'ghost' ? c.primary : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
      style={[{ minHeight: 44, borderRadius: radius.md, backgroundColor: bg, paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: space.sm, opacity: disabled ? 0.5 : 1, borderWidth: kind === 'ghost' ? 1 : 0, borderColor: c.primary }, style]}
    >
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      <T style={{ color: fg, fontFamily: font.semi }}>{label}</T>
    </Pressable>
  );
}

export function PlaceLogo({ place, size = 72 }: { place: Place; size?: number }) {
  const initials = place.name.split(' ').filter((w) => /[A-Za-z]/.test(w[0])).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <LinearGradient colors={[place.c2, place.c1]} style={{ width: size, height: size, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}>
      <T style={{ color: '#FFFFFF', fontFamily: font.bold, fontSize: size / 3 }}>{initials}</T>
    </LinearGradient>
  );
}

export function Stat({ label, value, icon, color }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.xs }}>
      <Ionicons name={icon} size={20} color={color} />
      <T style={{ fontFamily: font.bold, fontSize: 24 }}>{value}</T>
      <T style={{ fontSize: 12, color: c.muted }}>{label}</T>
    </View>
  );
}

export function PlaceCard({ place, caption, onPress, right }: { place: Place; caption?: string; onPress?: () => void; right?: React.ReactNode }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${place.name}`} onPress={onPress}
      style={{ flexDirection: 'row', gap: space.md, padding: space.sm, backgroundColor: c.surface, borderRadius: radius.md, alignItems: 'center' }}>
      <PlaceLogo place={place} />
      <View style={{ flex: 1, gap: 2 }}>
        <T numberOfLines={1} style={{ fontFamily: font.semi, fontSize: 18 }}>{place.name}</T>
        <T style={{ fontSize: 12, color: c.muted }}>{caption ?? `${place.area}, ${place.city}`}</T>
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          {place.offer && (
            <View style={{ backgroundColor: c.soft, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 2 }}>
              <T style={{ fontSize: 12, color: '#3C096C', fontFamily: font.medium }}>Offer</T>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Ionicons name="star" size={14} color={c.save} /><T style={{ fontSize: 12 }}>{place.saves} saves</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Ionicons name="star" size={14} color={c.visit} /><T style={{ fontSize: 12 }}>{place.visits} visits</T>
          </View>
        </View>
      </View>
      {right}
    </Pressable>
  );
}

export const screen = StyleSheet.create({
  root: { flex: 1, padding: space.md, gap: space.md },
});
