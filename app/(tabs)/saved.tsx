import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterSheet } from '@/src/components/filters/FilterSheet';
import { FilterChipsRow } from '@/src/components/home/FilterChipsRow';
import { HomeSearchBar } from '@/src/components/home/HomeSearchBar';
import { Icon } from '@/src/components/icons/Icon';
import { Animated, useListLayout } from '@/src/components/motion';
import { PlaceInfoCard } from '@/src/components/PlaceInfoCard';
import { FolderTile } from '@/src/components/saved/FolderTile';
import { AppText } from '@/src/components/ui/ui';
import { Place } from '@/src/data/mock';
import { Filters, activeFilterChips } from '@/src/home/homeData';
import {
  FolderKey,
  FolderTile as FolderTileData,
  NOTHING_SAVED_YET,
  NO_SAVED_MATCH,
  countLabel,
  folderName,
  folderTiles,
  savedMatchCount,
  savedPlaces,
  savedTotalLabel,
  showFolderTiles,
  visibleSaved,
} from '@/src/saved/savedData';
import { setFilters, useFilters } from '@/src/state/filters';
import { useSavedIds } from '@/src/state/saved';
import { useTheme } from '@/src/theme/ThemeProvider';

// One line of the list under the search bar.
type Row =
  | { type: 'tiles'; key: string; tiles: FolderTileData[] }
  | { type: 'bar'; key: string }
  | { type: 'place'; key: string; place: Place; index: number }
  | { type: 'empty'; key: string; message: string }
  | { type: 'reels'; key: string };

// The Saved tab: your saved places, in folders (All saved, Food, Shopping, Fun).
// Searching or switching a filter on shows the matching places instead of the folders.
export default function SavedScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listLayout = useListLayout(); // rows glide when the results change
  const savedIds = useSavedIds();
  const filters = useFilters();

  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<FolderKey | null>(null); // the open folder, if any
  const sheetRef = useRef<BottomSheetModal>(null);

  // Leaving the tab closes the open folder, like the prototype.
  useFocusEffect(useCallback(() => () => setFolder(null), []));
  // The phone's back button closes the open folder first.
  useEffect(() => {
    if (!folder) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setFolder(null);
      return true;
    });
    return () => subscription.remove();
  }, [folder]);

  const saved = useMemo(() => savedPlaces(savedIds), [savedIds]);
  const chips = activeFilterChips(filters);
  const tilesMode = showFolderTiles(folder, query, filters);
  const results = useMemo(() => visibleSaved(saved, folder, query, filters), [saved, folder, query, filters]);
  const matchCount = useCallback((f: Filters) => savedMatchCount(saved, f), [saved]);

  const rows = useMemo<Row[]>(() => {
    if (tilesMode) {
      const tiles = folderTiles(saved);
      return [
        { type: 'tiles', key: 'tiles-1', tiles: tiles.slice(0, 2) },
        { type: 'tiles', key: 'tiles-2', tiles: tiles.slice(2, 4) },
        { type: 'reels', key: 'reels' },
      ];
    }
    const list: Row[] = [{ type: 'bar', key: 'bar' }];
    results.forEach((place, index) => list.push({ type: 'place', key: place.id, place, index }));
    if (results.length === 0) list.push({ type: 'empty', key: 'empty', message: saved.length === 0 ? NOTHING_SAVED_YET : NO_SAVED_MATCH });
    return list;
  }, [tilesMode, saved, results]);

  const openPlace = (place: Place) => router.push(`/venue/${place.id}` as never);
  const openMenu = (place: Place) => router.push(`/venue/${place.id}?menu=1` as never);

  const header = (
    <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 20 }}>
      <AppText weight="800" size={26} accessibilityRole="header">Saved</AppText>
      <AppText tone="muted" size={13} style={{ marginTop: 2, marginBottom: 14 }}>{savedTotalLabel(saved.length)}</AppText>
      <HomeSearchBar
        value={query}
        onChangeText={setQuery}
        filterCount={chips.length}
        onFilterPress={() => sheetRef.current?.present()}
        placeholder="Search your saved places…"
        accessibilityLabel="Search your saved places"
      />
      <FilterChipsRow chips={chips} onClear={(chip) => setFilters(chip.clear)} />
    </View>
  );

  return (
    <>
      <Animated.FlatList
        style={{ flex: 1, backgroundColor: palette.bg }}
        itemLayoutAnimation={listLayout}
        data={rows}
        keyExtractor={(row) => row.key}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          if (item.type === 'tiles') {
            return (
              <View style={styles.tileRow}>
                {item.tiles.map((tile) => (
                  <FolderTile key={tile.key} tile={tile} onPress={() => setFolder(tile.key)} />
                ))}
              </View>
            );
          }
          if (item.type === 'bar') {
            return (
              <View style={styles.barRow}>
                {folder ? (
                  <Pressable
                    onPress={() => setFolder(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Back to folders"
                    style={styles.folderBack}>
                    <Icon name="back" size={22} color={palette.text} />
                    <AppText weight="700" size={17}>{folderName(folder)}</AppText>
                  </Pressable>
                ) : (
                  <AppText weight="700" size={17}>Results</AppText>
                )}
                <AppText tone="muted" size={12}>{countLabel(results.length)}</AppText>
              </View>
            );
          }
          if (item.type === 'place') {
            return (
              <View style={styles.cardSlot}>
                <PlaceInfoCard place={item.place} saved index={item.index} onPress={() => openPlace(item.place)} onMenuPress={() => openMenu(item.place)} />
              </View>
            );
          }
          if (item.type === 'reels') {
            return (
              <Pressable
                onPress={() => router.push('/reel-places' as never)}
                accessibilityRole="button"
                style={[styles.reels, { backgroundColor: palette.chip }]}>
                <AppText tone="acc" weight="600" size={13}>Places you saved from reels</AppText>
                <Icon name="chevron" size={16} color={palette.acc} />
              </Pressable>
            );
          }
          return <AppText tone="muted" size={14} style={styles.empty}>{item.message}</AppText>;
        }}
      />
      <FilterSheet sheetRef={sheetRef} matchCount={matchCount} />
    </>
  );
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, marginTop: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 18, marginBottom: 4 },
  folderBack: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  cardSlot: { paddingHorizontal: 20, marginTop: 12 },
  empty: { textAlign: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  reels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginHorizontal: 20, marginTop: 18, paddingHorizontal: 16, borderRadius: 16 },
});
