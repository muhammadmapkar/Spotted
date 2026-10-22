import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/ui';
import { Country } from '@/src/auth/phone';
import { useTheme } from '@/src/theme/ThemeProvider';

// The UAE flag drawn from coloured blocks (as in the prototype). Other countries show their
// two-letter code in a small tag instead of a flag.
export function FlagBadge({ country }: { country: Country }) {
  const { palette } = useTheme();
  if (country.code === 'AE') {
    return (
      <View style={styles.flag} accessibilityLabel="United Arab Emirates flag">
        <View style={{ width: 6, backgroundColor: '#E31B23' }} />
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: '#00843D' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#111111' }} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.tag, { backgroundColor: palette.chip }]}>
      <AppText tone="acc" weight="700" size={10}>{country.code}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flag: { width: 22, height: 15, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
  tag: { minWidth: 22, height: 15, borderRadius: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
});
