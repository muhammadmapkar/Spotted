import { useIsFocused, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChipsRow } from '@/src/components/home/FilterChipsRow';
import { HomeSearchBar } from '@/src/components/home/HomeSearchBar';
import { InfluencerCard } from '@/src/components/home/InfluencerCard';
import { LocationRow } from '@/src/components/home/LocationRow';
import { SavedStory } from '@/src/components/home/SavedStory';
import { PlaceInfoCard } from '@/src/components/PlaceInfoCard';
import { AppText } from '@/src/components/ui/ui';
import { Influencer, PLACES, Place } from '@/src/data/mock';
import {
  Filters,
  NEAR_KM,
  NO_FILTERS,
  activeFilterChips,
  exploreFeed,
  resultsTitle,
  searchHome,
  storiesFor,
} from '@/src/home/homeData';
import { useTypingPlaceholder } from '@/src/home/useTypingPlaceholder';
import { resetFilters, setFilters, useFilters } from '@/src/state/filters';
import { useSavedIds } from '@/src/state/saved';
import { useTheme } from '@/src/theme/ThemeProvider';

// One line in the list under the search bar.
type Row =
  | { type: 'heading'; key: string; title: string; subtitle?: string }
  | { type: 'influencer'; key: string; influencer: Influencer; index: number }
  | { type: 'place'; key: string; place: Place; index: number }
  | { type: 'empty'; key: string };

// Home: where you are, your saved places near you (the circles), search, and the Explore feed.
export default function HomeScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const savedIds = useSavedIds();
  const filters = useFilters();
  const [query, setQuery] = useState('');

  const typedExample = useTypingPlaceholder(isFocused && query.length === 0);
  const stories = useMemo(() => storiesFor(PLACES, savedIds), [savedIds]);
  const chips = useMemo(() => activeFilterChips(filters), [filters]);
  const searchText = query.trim();
  const searching = searchText.length > 0;

  // Everything under the search bar: search results while typing, otherwise the Explore feed.
  const rows = useMemo<Row[]>(() => {
    if (searching) {
      const found = searchHome(searchText, filters);
      const list: Row[] = [];
      if (found.influencers.length > 0) {
        list.push({ type: 'heading', key: 'h-influencers', title: 'Influencers' });
        found.influencers.forEach((influencer, index) => list.push({ type: 'influencer', key: `i-${influencer.id}`, influencer, index }));
      }
      list.push({ type: 'heading', key: 'h-places', title: resultsTitle(found.places.length) });
      found.places.forEach((place, index) => list.push({ type: 'place', key: `p-${place.id}`, place, index }));
      if (found.places.length === 0 && found.influencers.length === 0) list.push({ type: 'empty', key: 'empty' });
      return list;
    }
    const feed = exploreFeed(PLACES, filters);
    return [
      { type: 'heading', key: 'h-explore', title: 'Explore nearby', subtitle: `Every place within ${NEAR_KM} km, Spotted Partners first` },
      ...feed.map((place, index): Row => ({ type: 'place', key: `p-${place.id}`, place, index })),
    ];
  }, [searching, searchText, filters]);

  const openPlace = (place: Place) => router.push(`/venue/${place.id}` as never);
  const openMenu = (place: Place) => Alert.alert(place.name, 'The menu viewer arrives in a later step.');

  // Testing builds only: press and hold the filter button to step through sample filters, so the
  // badge and chips can be seen before the real filter sheet exists.
  const previewStep = useRef(0);
  const previews: Partial<Filters>[] = [{ budget: 50 }, { dist: 5, cat: 'Food' }, { infl: true, offers: true }, NO_FILTERS];
  const cyclePreview = () => {
    resetFilters();
    setFilters(previews[previewStep.current % previews.length]);
    previewStep.current += 1;
  };

  const header = (
    <View>
      <View style={{ paddingTop: insets.top + 12 }}>
        <LocationRow />
      </View>

      <View style={styles.sectionRow}>
        <AppText weight="700" size={17}>Saved places near you</AppText>
        <View style={[styles.chip, { backgroundColor: palette.chip }]}>
          <AppText tone="acc" weight="600" size={12}>Within {NEAR_KM} km</AppText>
        </View>
      </View>

      {stories.length > 0 ? (
        <FlatList
          horizontal
          data={stories}
          keyExtractor={(story) => story.place.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stories}
          renderItem={({ item, index }) => <SavedStory place={item.place} ring={item.ring} index={index} onPress={() => openPlace(item.place)} />}
        />
      ) : (
        <AppText tone="muted" size={13} style={styles.noStories}>Places you save will show up here, nearest first.</AppText>
      )}

      <View style={styles.searchArea}>
        <HomeSearchBar
          value={query}
          onChangeText={setQuery}
          typedExample={typedExample}
          filterCount={chips.length}
          onFilterPress={() => Alert.alert('Filters', 'The filter sheet arrives in a later step.')}
          onFilterLongPress={__DEV__ ? cyclePreview : undefined}
          accessibilityLabel="Search places, food, shops or influencers"
        />
        <FilterChipsRow chips={chips} onClear={(chip) => setFilters(chip.clear)} />
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.bg }}
      data={rows}
      keyExtractor={(row) => row.key}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      windowSize={7}
      contentContainerStyle={{ paddingBottom: 24 }}
      renderItem={({ item }) => {
        if (item.type === 'heading') {
          return (
            <View style={styles.heading}>
              <AppText weight="700" size={17}>{item.title}</AppText>
              {item.subtitle ? <AppText tone="muted" size={12} style={{ marginTop: 2 }}>{item.subtitle}</AppText> : null}
            </View>
          );
        }
        if (item.type === 'influencer') {
          return (
            <View style={styles.cardSlot}>
              <InfluencerCard influencer={item.influencer} index={item.index} onPress={() => router.push(`/influencer/${item.influencer.id}` as never)} />
            </View>
          );
        }
        if (item.type === 'place') {
          return (
            <View style={styles.cardSlot}>
              <PlaceInfoCard
                place={item.place}
                saved={savedIds.has(item.place.id)}
                index={item.index}
                onPress={() => openPlace(item.place)}
                onMenuPress={() => openMenu(item.place)}
              />
            </View>
          );
        }
        return (
          <AppText tone="muted" size={14} style={styles.empty}>
            Nothing nearby matches that yet. Try another word or loosen your filters.
          </AppText>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  chip: { minHeight: 26, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 16 },
  stories: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, gap: 14 },
  noStories: { paddingHorizontal: 20, paddingTop: 14 },
  searchArea: { paddingHorizontal: 20, marginTop: 16 },
  heading: { paddingHorizontal: 20, marginTop: 22, marginBottom: 12 },
  cardSlot: { paddingHorizontal: 20, marginBottom: 12 },
  empty: { textAlign: 'center', paddingVertical: 20, paddingHorizontal: 20 },
});
