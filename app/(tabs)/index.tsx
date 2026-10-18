import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { Filter, FilterChips } from '@/src/components/FilterChips';
import { PlaceCard } from '@/src/components/PlaceCard';
import { SavedPlace, addSamplePlaces, deleteAllData, deletePlace, listPlaces } from '@/src/db';

// The home screen: all saved places, newest first, with filter chips on top.
export default function PlacesScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  // Reload the list every time this screen is shown.
  const reload = useCallback(async () => {
    setPlaces(await listPlaces());
  }, []);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const openPlace = (place: SavedPlace) => router.push(`/place/${place.id}` as never);

  // Ask before deleting, so a slip of the finger can't remove a place.
  const confirmDelete = (place: SavedPlace) => {
    Alert.alert('Delete this place?', `"${place.name}" will be removed from Spotted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePlace(place.id);
          await reload();
        },
      },
    ]);
  };

  // Long-press menu.
  const showMenu = (place: SavedPlace) =>
    Alert.alert(place.name, undefined, [
      { text: 'Edit', onPress: () => openPlace(place) },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(place) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const visible = filter === 'all' ? places : places.filter((p) => p.category === filter);

  // Message shown when the list is empty.
  const emptyTitle =
    places.length === 0 ? 'No places yet' : `No ${CATEGORIES[filter as keyof typeof CATEGORIES].label} places yet`;
  const emptyText =
    places.length === 0
      ? 'Share a reel from Instagram to Spotted, and we will remind you when you are nearby. 📍'
      : 'Places you save in this category will show up here.';

  return (
    <View style={styles.container}>
      <FilterChips selected={filter} onSelect={setFilter} />

      <FlatList
        data={visible}
        keyExtractor={(place) => place.id}
        renderItem={({ item }) => (
          <PlaceCard place={item} onPress={() => openPlace(item)} onLongPress={() => showMenu(item)} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>{emptyText}</Text>
          </View>
        }
        ListFooterComponent={
          // Testing helpers. They only appear while developing, never in the store app.
          __DEV__ ? (
            <View style={styles.devBox}>
              <Text style={[styles.devLabel, { color: theme.mutedText }]}>Testing only</Text>
              <Pressable
                style={[styles.devButton, { borderColor: theme.border }]}
                onPress={async () => {
                  await addSamplePlaces();
                  await reload();
                }}>
                <Text style={styles.devButtonText}>Add 5 sample places</Text>
              </Pressable>
              <Pressable
                style={[styles.devButton, { borderColor: theme.border }]}
                onPress={async () => {
                  await deleteAllData();
                  await reload();
                }}>
                <Text style={styles.devButtonText}>Remove all places</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  devBox: { marginTop: 24, gap: 8 },
  devLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  devButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: { fontSize: 15, fontWeight: '600' },
});
