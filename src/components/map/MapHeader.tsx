import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Animated, useRiseIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { MAP_CHIP } from '@/src/map/mapData';
import { cardShadow } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

// The floating card at the top of the map: "Map", the "15 km around you" chip, and the legend.
export function MapHeader({ top, note }: { top: number; note?: string }) {
  const { palette } = useTheme();
  const rise = useRiseIn(0);
  return (
    <Animated.View style={[styles.card, { top, backgroundColor: palette.surface, boxShadow: cardShadow(palette) }, rise]}>
      <View style={styles.row}>
        <AppText weight="700" size={15} accessibilityRole="header">Map</AppText>
        <View style={[styles.chip, { backgroundColor: palette.chip }]}>
          <AppText tone="acc" weight="600" size={12}>{MAP_CHIP}</AppText>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.item}>
          <Svg width={12} height={16} viewBox="0 0 22 30"><Path d="M0 0H22V30L11 23.4 0 30Z" fill="#D62839" /></Svg>
          <AppText tone="muted" weight="600" size={11}>Saved</AppText>
        </View>
        <View style={styles.item}>
          <View style={[styles.round, { backgroundColor: '#7B2CD6' }]} />
          <AppText tone="muted" weight="600" size={11}>Spotted Partner</AppText>
        </View>
        <View style={styles.item}>
          <View style={[styles.round, { backgroundColor: '#2F80ED', borderWidth: 2, borderColor: '#FFFFFF' }]} />
          <AppText tone="muted" weight="600" size={11}>You</AppText>
        </View>
      </View>
      {note ? <AppText tone="muted" size={11} style={{ marginTop: 6 }}>{note}</AppText> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 14, right: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { height: 26, paddingHorizontal: 12, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  round: { width: 12, height: 12, borderRadius: 6 },
});
