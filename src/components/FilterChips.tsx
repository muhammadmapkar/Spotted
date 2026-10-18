import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { Category } from '@/src/db';

export type Filter = 'all' | Category;

const CHIPS: { value: Filter; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: Colors.light.tint },
  ...(Object.keys(CATEGORIES) as Category[]).map((key) => ({
    value: key as Filter,
    label: CATEGORIES[key].label,
    color: CATEGORIES[key].color,
  })),
];

// The row of round buttons at the top: All / Food / Shopping / Fun.
export function FilterChips({
  selected,
  onSelect,
}: {
  selected: Filter;
  onSelect: (filter: Filter) => void;
}) {
  const theme = Colors[useColorScheme()];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {CHIPS.map((chip) => {
        const isSelected = chip.value === selected;
        return (
          <Pressable
            key={chip.value}
            onPress={() => onSelect(chip.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? chip.color : 'transparent',
                borderColor: isSelected ? chip.color : theme.border,
              },
            ]}>
            <Text style={[styles.label, { color: isSelected ? '#FFFFFF' : theme.text }]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    minHeight: 44, // big enough to tap easily
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '600' },
});
