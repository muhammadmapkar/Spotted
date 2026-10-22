import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetScrollView, useBottomSheetTimingConfigs } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import { RefObject, useCallback } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/ui';
import { CATEGORY_FILTERS, DISTANCE_FILTERS } from '@/src/data/mock';
import { ANY_BUDGET, BUDGET_STEP, Filters, MIN_BUDGET, budgetLabel, showPlacesLabel, snapBudget } from '@/src/home/homeData';
import { resetFilters, setFilters, useFilters } from '@/src/state/filters';
import { useTheme } from '@/src/theme/ThemeProvider';

export type FilterSheetRef = RefObject<BottomSheetModal | null>;

// The filter sheet (prototype: FILTER SHEET). It slides up from the bottom and changes the ONE shared
// filter state (src/state/filters.ts), so Home and the Saved tab always agree. Every change applies at once,
// so the list behind the sheet reshuffles while you slide. Open it with  sheetRef.current?.present().
//
//   Filters                                              Reset
//   How much do you want to spend today?   [ Up to AED 150 ]   slider
//   Distance      1 km  5 km  10 km  15 km
//   Category      All Food Shopping Fun Indian Mexican Cafe
//   Spotted by influencers only        (switch)
//   Has offers (Fazaa, Esaad, Spotted) (switch)
//   [ Show 12 places ]
//
// `matchCount` says how many places pass the filters on the screen that opened the sheet.
export function FilterSheet({ sheetRef, matchCount }: { sheetRef: FilterSheetRef; matchCount: (filters: Filters) => number }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const filters = useFilters();
  const animationConfigs = useBottomSheetTimingConfigs({ duration: reduceMotion ? 0 : 400 });

  const close = useCallback(() => sheetRef.current?.dismiss(), [sheetRef]);
  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />,
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['88%']}
      enableDynamicSizing={false}
      // Dragging the content would fight with the slider; the handle and the dark area still close the sheet.
      enableContentPanningGesture={false}
      animationConfigs={animationConfigs}
      backdropComponent={backdrop}
      backgroundStyle={{ backgroundColor: palette.bg }}
      handleIndicatorStyle={{ backgroundColor: palette.line, width: 42 }}>
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <AppText weight="700" size={20} accessibilityRole="header">Filters</AppText>
          <Pressable onPress={resetFilters} accessibilityRole="button" accessibilityLabel="Reset all filters" style={styles.reset}>
            <AppText tone="acc" weight="600" size={13}>Reset</AppText>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <AppText weight="600" size={14}>How much do you want to spend today?</AppText>
          <AppText tone="acc" weight="800" size={30} style={{ marginTop: 6 }} accessibilityLiveRegion="polite">{budgetLabel(filters.budget)}</AppText>
          <AppText tone="muted" size={12}>per person</AppText>
          <Slider
            style={styles.slider}
            minimumValue={MIN_BUDGET}
            maximumValue={ANY_BUDGET}
            step={BUDGET_STEP}
            value={filters.budget}
            onValueChange={(value) => setFilters({ budget: snapBudget(value) })}
            minimumTrackTintColor="#7B2CD6"
            maximumTrackTintColor={palette.line}
            thumbTintColor="#7B2CD6"
            accessibilityLabel="Budget per person"
            accessibilityValue={{ min: MIN_BUDGET, max: ANY_BUDGET, now: filters.budget, text: budgetLabel(filters.budget) }}
          />
          <View style={styles.scale}>
            <AppText tone="muted" size={11}>AED {MIN_BUDGET}</AppText>
            <AppText tone="muted" size={11}>AED {ANY_BUDGET}+</AppText>
          </View>
        </View>

        <AppText weight="600" size={14} style={styles.label}>Distance</AppText>
        <View style={styles.chips}>
          {DISTANCE_FILTERS.map((km) => (
            <Chip key={km} label={`${km} km`} selected={filters.dist === km} onPress={() => setFilters({ dist: km })} />
          ))}
        </View>

        <AppText weight="600" size={14} style={styles.label}>Category</AppText>
        <View style={styles.chips}>
          {CATEGORY_FILTERS.map((category) => (
            <Chip key={category} label={category} selected={filters.cat === category} onPress={() => setFilters({ cat: category })} />
          ))}
        </View>

        <ToggleRow label="Spotted by influencers only" value={filters.infl} onChange={(infl) => setFilters({ infl })} top={18} />
        <ToggleRow label="Has offers (Fazaa, Esaad, Spotted)" value={filters.offers} onChange={(offers) => setFilters({ offers })} top={6} />

        <Pressable
          onPress={close}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, { backgroundColor: palette.btn, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <AppText tone="onBrand" weight="600" size={16}>{showPlacesLabel(matchCount(filters))}</AppText>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? palette.btn : palette.chip }]}>
      <AppText weight="600" size={12} style={{ color: selected ? '#FFFFFF' : palette.acc }}>{label}</AppText>
    </Pressable>
  );
}

function ToggleRow({ label, value, onChange, top }: { label: string; value: boolean; onChange: (value: boolean) => void; top: number }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.toggleRow, { marginTop: top }]}>
      <AppText weight="600" size={14} style={{ flex: 1 }}>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: palette.line, true: '#7B2CD6' }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reset: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  card: { marginTop: 8, padding: 16, borderRadius: 20, borderWidth: 1 },
  slider: { width: '100%', height: 44 },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  cta: { marginTop: 22, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(106,31,176,0.35)' },
});
