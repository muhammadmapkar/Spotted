import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { COUNTRIES, Country } from '@/src/auth/phone';
import { Icon } from '@/src/components/icons/Icon';
import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';
import { FlagBadge } from './FlagBadge';

// A sheet listing the countries. Tap one to choose its code.
export function CountryPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" style={styles.scrim} onPress={onClose} accessibilityLabel="Close country list" />
      <View style={[styles.sheet, { backgroundColor: palette.bg }]}>
        <View style={[styles.grab, { backgroundColor: palette.line }]} />
        <AppText weight="700" size={20} style={{ marginBottom: 8 }}>Choose your country</AppText>
        <FlatList
          data={COUNTRIES}
          keyExtractor={(c) => c.code}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: item.code === selected.code }}
              style={[styles.row, { borderBottomColor: palette.line }]}>
              <FlagBadge country={item} />
              <AppText weight="500" size={15} style={{ flex: 1 }}>{item.name}</AppText>
              <AppText tone="muted" size={14}>{item.dial}</AppText>
              {item.code === selected.code ? <Icon name="check" size={18} color={palette.acc} strokeWidth={3} label="Selected" /> : null}
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const), backgroundColor: 'rgba(15,5,30,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '75%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 26 },
  grab: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth },
});
