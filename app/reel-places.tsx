import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CollectionFilter } from '@/src/components/CollectionFilter';
import { Filter, FilterChips } from '@/src/components/FilterChips';
import { PlaceCard } from '@/src/components/PlaceCard';
import { RemindersBanner } from '@/src/components/RemindersBanner';
import { distanceMeters } from '@/src/location/distance';
import { useUserLocation } from '@/src/location/useUserLocation';
import { Collection, SavedPlace, deletePlace, listCollections, listPlaces } from '@/src/db';
import { filterPlaces } from '@/src/placeFilters';

// The original list of places saved from reels: newest first, with filter chips on top.
// It opens from the Saved tab, and has a Map button for the matching map (app/reel-map.tsx).
export default function PlacesScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  const userLocation = useUserLocation(); // null if location is not allowed
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string>('all'); // 'all' or a collection id

  // Reload the list every time this screen is shown.
  const reload = useCallback(async () => {
    try {
      const [loadedPlaces, loadedCollections] = await Promise.all([listPlaces(), listCollections()]);
      setPlaces(loadedPlaces);
      setCollections(loadedCollections);
      // If the collection we were filtering by was deleted, go back to "All lists".
      setCollectionFilter((current) =>
        current === 'all' || loadedCollections.some((c) => c.id === current) ? current : 'all'
      );
    } catch {
      setPlaces([]); // if loading fails, show the empty list instead of crashing
      setCollections([]);
    }
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

  // Show places that match BOTH the category chip and the collection chip.
  const visible = filterPlaces(places, filter, collectionFilter);

  // Message shown when the list is empty.
  const emptyTitle = places.length === 0 ? 'No places yet' : 'No matching places';
  const emptyText =
    places.length === 0
      ? 'Tap the + button to save a place from a reel, and we will remind you when you are nearby.'
      : 'Nothing matches these filters. Try another one, or save more places.';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/reel-map' as never)}
              accessibilityRole="button"
              accessibilityLabel="Show these places on a map"
              style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.tintText, fontWeight: '700' }}>Map</Text>
            </Pressable>
          ),
        }}
      />
      <RemindersBanner />
      <FilterChips selected={filter} onSelect={setFilter} />
      <CollectionFilter collections={collections} selected={collectionFilter} onSelect={setCollectionFilter} />

      <FlatList
        data={visible}
        keyExtractor={(place) => place.id}
        renderItem={({ item }) => (
          <PlaceCard
            place={item}
            distanceMeters={userLocation ? distanceMeters(userLocation, item) : undefined}
            onPress={() => openPlace(item)}
            onLongPress={() => showMenu(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>{emptyText}</Text>
          </View>
        }
      />

      {/* The big round + button that opens Add Place */}
      <Pressable
        onPress={() => router.push('/add-place' as never)}
        accessibilityRole="button"
        accessibilityLabel="Add a place"
        style={({ pressed }) => [styles.fab, { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 110, flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#FFFFFF', fontSize: 32, lineHeight: 36, fontWeight: '400' },
});
