import { Pressable, StyleSheet, View } from 'react-native';

import { Animated, useRiseIn } from '@/src/components/motion';
import { PlaceLogo } from '@/src/components/PlaceLogo';
import { AppText } from '@/src/components/ui/ui';
import { Place } from '@/src/data/mock';
import { cardDistance, cardLine } from '@/src/map/mapData';
import { useTheme } from '@/src/theme/ThemeProvider';

// The small card above the tab bar when a pin is tapped (prototype: .map-card): the place logo, name,
// category and price, distance, and an Open button that goes to the Place page.
export function MapPlaceCard({ place, bottom, onOpen }: { place: Place; bottom: number; onOpen: () => void }) {
  const { palette } = useTheme();
  const rise = useRiseIn(0);
  return (
    <Animated.View style={[styles.card, { bottom, backgroundColor: palette.surface }, rise]}>
      <PlaceLogo place={place} size={60} shape="square" />
      <View style={styles.text}>
        <AppText weight="700" size={15} numberOfLines={1}>{place.name}</AppText>
        <AppText tone="muted" size={12} numberOfLines={1}>{cardLine(place)}</AppText>
        <AppText tone="muted" size={12}>{cardDistance(place)}</AppText>
      </View>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${place.name}`}
        style={[styles.open, { backgroundColor: palette.btn }]}>
        <AppText tone="onBrand" weight="600" size={13}>Open</AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 22, boxShadow: '0 14px 34px rgba(20,0,50,0.3)' },
  text: { flex: 1, minWidth: 0, gap: 2 },
  open: { minWidth: 64, height: 46, paddingHorizontal: 16, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
