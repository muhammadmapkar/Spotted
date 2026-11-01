import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { PUBLIC_BASE } from '../../src/data';
import { useStore } from '../../src/store';
import { font, space, useTheme } from '../../src/theme';
import { Button, PlaceCard, T } from '../../src/ui';

export default function ListScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lists, placeOf, toggleInList, deleteList, handle } = useStore();
  const list = lists.find((l) => l.id === id);
  if (!list) return <View style={{ padding: space.md }}><T>This list isn't available.</T></View>;
  const places = list.placeIds.map(placeOf).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <T style={{ fontFamily: font.bold, fontSize: 24 }}>{list.name}</T>
      <Button label="Share list" icon="share-outline" disabled={places.length === 0}
        onPress={() => Share.share({ message: `${list.name} by @${handle}\n${places.map((p, i) => `${i + 1}. ${p.name}, ${p.area}`).join('\n')}\n${PUBLIC_BASE}/@${handle}/lists/${list.id}` })} />
      {places.length === 0 && <T style={{ color: c.muted }}>Empty. Open a place and tap Add to list.</T>}
      {places.map((p) => (
        <View key={p.id} style={{ gap: 4 }}>
          <PlaceCard place={p} onPress={() => router.push(`/place/${p.id}`)} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.name} from list`} onPress={() => toggleInList(list.id, p.id)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <T style={{ color: c.accent, fontSize: 12 }}>Remove from list</T>
          </Pressable>
        </View>
      ))}
      <Button label="Delete list" kind="ghost" onPress={() => Alert.alert('Delete this list?', list.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { deleteList(list.id); router.back(); } }])} />
    </ScrollView>
  );
}
