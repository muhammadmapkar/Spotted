import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/src/components/icons/Icon';
import { AppText } from '@/src/components/ui/ui';
import { FilterChip } from '@/src/home/homeData';
import { useTheme } from '@/src/theme/ThemeProvider';

// The filters that are on, as chips you can tap to remove (under the search bars).
export function FilterChipsRow({ chips, onClear }: { chips: FilterChip[]; onClear: (chip: FilterChip) => void }) {
  const { palette } = useTheme();
  if (chips.length === 0) return null;
  return (
    <View style={styles.row}>
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={() => onClear(chip)}
          accessibilityRole="button"
          accessibilityLabel={`Remove filter ${chip.label}`}
          style={[styles.chip, { backgroundColor: palette.chip }]}>
          <AppText tone="acc" weight="600" size={12}>{chip.label}</AppText>
          <Icon name="close" size={13} color={palette.acc} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 22 },
});
