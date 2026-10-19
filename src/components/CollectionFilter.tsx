import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Collection } from '@/src/db';

// A second row of round buttons on My Places: All lists / one button per collection.
// It only appears when the user has made at least one collection.
export function CollectionFilter({
  collections,
  selected,
  onSelect,
}: {
  collections: Collection[];
  selected: string; // 'all' or a collection id
  onSelect: (id: string) => void;
}) {
  const theme = Colors[useColorScheme()];
  if (collections.length === 0) return null;

  const chips = [{ id: 'all', name: 'All lists' }, ...collections];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {chips.map((chip) => {
        const isSelected = chip.id === selected;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onSelect(chip.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? theme.tintStrong : 'transparent',
                borderColor: isSelected ? theme.tintStrong : theme.outline,
              },
            ]}>
            <Text style={[styles.label, { color: isSelected ? '#FFFFFF' : theme.text }]} numberOfLines={1}>
              {chip.id === 'all' ? chip.name : `📁 ${chip.name}`}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: {
    minHeight: 44,
    maxWidth: 220,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600' },
});
