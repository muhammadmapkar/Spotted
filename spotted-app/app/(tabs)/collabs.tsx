import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, View } from 'react-native';
import { COLLABS } from '../../src/data';
import { useStore } from '../../src/store';
import { font, radius, space, useTheme } from '../../src/theme';
import { Button, PlaceLogo, T, screen } from '../../src/ui';

export default function Collabs() {
  const c = useTheme();
  const { collabs, respondCollab, placeOf } = useStore();
  return (
    <View style={screen.root}>
      <FlatList data={COLLABS} keyExtractor={(x) => x.id} contentContainerStyle={{ gap: space.md }}
        renderItem={({ item }) => {
          const place = placeOf(item.placeId);
          const status = collabs[item.id];
          if (!place) return null;
          return (
            <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm, opacity: status === 'declined' ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                <PlaceLogo place={place} size={48} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: font.semi }}>{item.title}</T>
                  <T style={{ fontSize: 12, color: c.muted }}>{place.name} · {item.startDate} to {item.endDate}</T>
                </View>
              </View>
              <T>{item.brief}</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Ionicons name="gift" size={18} color={c.primary} />
                <T style={{ fontFamily: font.medium }}>{item.offerType}: {item.offerValue}</T>
              </View>
              {status ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <T style={{ fontFamily: font.semi, color: status === 'accepted' ? c.visit : c.muted }}>{status === 'accepted' ? 'Accepted' : 'Declined'}</T>
                  <Button label="Undo" kind="ghost" onPress={() => respondCollab(item.id, status === 'accepted' ? 'declined' : 'accepted')} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button label="Accept" onPress={() => respondCollab(item.id, 'accepted')} style={{ flex: 1 }} />
                  <Button label="Decline" kind="ghost" onPress={() => respondCollab(item.id, 'declined')} style={{ flex: 1 }} />
                </View>
              )}
            </View>
          );
        }} />
    </View>
  );
}
