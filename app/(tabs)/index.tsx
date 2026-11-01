import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CollectionFilter } from '@/src/components/CollectionFilter';
import { Filter, FilterChips } from '@/src/components/FilterChips';
import { PlaceCard } from '@/src/components/PlaceCard';
import { RemindersBanner } from '@/src/components/RemindersBanner';
import { WeekendPlanner } from '@/src/components/WeekendPlanner';
import { distanceMeters } from '@/src/location/distance';
import { useUserLocation } from '@/src/location/useUserLocation';
import { Collection, SavedPlace, deletePlace, listCollections, listPlaces } from '@/src/db';
import { PlaceSort, filterPlaces, searchSavedPlaces, sortPlaces } from '@/src/placeFilters';

// The home screen: all saved places, newest first, with filter chips on top.
export default function PlacesScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  const userLocation = useUserLocation(); // null if location is not allowed
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string>('all'); // 'all' or a collection id
  const [search, setSearch] = useState(''); // what the user typed in the search box
  const [sort, setSort] = useState<PlaceSort>('newest');

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

  // Show places that match the category chip, the collection chip AND the search words,
  // in the order the user chose. "Nearest" only works when we know where the user is.
  const visible = sortPlaces(
    searchSavedPlaces(filterPlaces(places, filter, collectionFilter), search),
    sort,
    userLocation
  );
  const canSortNearest = userLocation !== null;

  // Message shown when the list is empty.
  const emptyTitle = places.length === 0 ? 'No places yet' : 'No matching places';
  const emptyText =
    places.length === 0
      ? 'Tap the + button to save a place from a reel, and we will remind you when you are nearby.'
      : 'Nothing matches these filters. Try another one, or save more places.';

  return (
    <View style={styles.container}>
      <RemindersBanner />

      {/* Search box: name, area or note */}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search name, area or note"
        placeholderTextColor={theme.mutedText}
        accessibilityLabel="Search your places by name, area or note"
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={[styles.search, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
      />

      {/* "Plan my weekend": 3 saved places to try, close to you */}
      <WeekendPlanner places={places} position={userLocation} onOpenPlace={openPlace} />

      <FilterChips selected={filter} onSelect={setFilter} />
      <CollectionFilter collections={collections} selected={collectionFilter} onSelect={setCollectionFilter} />

      {/* Sort: Newest / Nearest */}
      <View style={styles.sortRow} lightColor="transparent" darkColor="transparent">
        <Text style={[styles.sortLabel, { color: theme.mutedText }]}>Sort</Text>
        {(['newest', 'nearest'] as PlaceSort[]).map((option) => {
          const disabled = option === 'nearest' && !canSortNearest;
          const selected = sort === option && !disabled;
          return (
            <Pressable
              key={option}
              disabled={disabled}
              onPress={() => setSort(option)}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityHint={disabled ? 'Allow location to sort by nearest' : undefined}
              style={[
                styles.sortChip,
                {
                  backgroundColor: selected ? theme.tintStrong : 'transparent',
                  borderColor: selected ? theme.tintStrong : theme.outline,
                  opacity: disabled ? 0.4 : 1,
                },
              ]}>
              <Text style={[styles.sortText, { color: selected ? '#FFFFFF' : theme.text }]}>
                {option === 'newest' ? 'Newest' : 'Nearest'}
              </Text>
            </Pressable>
          );
        })}
        {!canSortNearest ? (
          <Text style={[styles.sortHint, { color: theme.mutedText }]}>Allow location to sort by nearest</Text>
        ) : null}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(place) => place.id}
        keyboardShouldPersistTaps="handled"
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
  search: {
    minHeight: 48,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  sortRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  sortLabel: { fontSize: 14, fontWeight: '600' },
  sortChip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sortText: { fontSize: 14, fontWeight: '600' },
  sortHint: { fontSize: 12, flexShrink: 1 },
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
