import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/src/components/icons/Icon';
import { Animated, useRiseIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { Platform, fmt, thumbColors } from '@/src/data/mock';
import { RecommendationRow as RowData } from '@/src/influencer/influencerData';
import { heroPhotoUrl } from '@/src/place/placeData';
import { MONO_SHADOW } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

// The play button colours by platform (prototype: .reel).
const INSTAGRAM_GRADIENT: [string, string, string] = ['#F58529', '#DD2A7B', '#8134AF'];
const FLAT: Partial<Record<Platform, string>> = { tt: '#111111', yt: '#E52D27' };

// One line of "All recommendations": the place (tap to open it) and a play button that opens the reel.
export function RecommendationRow({ row, onOpenPlace, onOpenReel }: { row: RowData; onOpenPlace: () => void; onOpenReel: () => void }) {
  const { palette } = useTheme();
  const rise = useRiseIn(row.delay);
  const { place } = row;
  const photo = heroPhotoUrl(place);

  return (
    <Animated.View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.line }, rise]}>
      <Pressable
        onPress={onOpenPlace}
        accessibilityRole="button"
        accessibilityLabel={`${place.name}, ${place.cat}, ${fmt(place.dist)}`}
        style={styles.place}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.thumb} accessibilityIgnoresInvertColors />
        ) : (
          <LinearGradient colors={thumbColors(place)} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={[styles.thumb, styles.center]}>
            <AppText tone="onBrand" weight="800" size={16} style={MONO_SHADOW}>{place.mono}</AppText>
          </LinearGradient>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText weight="700" size={14} numberOfLines={1}>{place.name}</AppText>
          <AppText tone="muted" size={12}>{place.cat} · {fmt(place.dist)}</AppText>
        </View>
      </Pressable>
      <Pressable onPress={onOpenReel} accessibilityRole="link" accessibilityLabel={`Watch the reel about ${place.name}`}>
        {row.platform === 'ig' ? (
          <LinearGradient colors={INSTAGRAM_GRADIENT} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.play, styles.center]}>
            <Icon name="play" size={16} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={[styles.play, styles.center, { backgroundColor: FLAT[row.platform] }]}>
            <Icon name="play" size={16} color="#FFFFFF" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 18, borderWidth: 1 },
  place: { flex: 1, minWidth: 0, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 54, height: 54, borderRadius: 14, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  play: { width: 44, height: 44, borderRadius: 14 },
});
