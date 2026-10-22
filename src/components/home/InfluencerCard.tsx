import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Animated, useRiseIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { Influencer } from '@/src/data/mock';
import { pickCount, platformText } from '@/src/home/homeData';
import { cardShadow } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

// A round profile picture: the influencer's colours with their first letter (never a face or photo of a person).
export function InfluencerAvatar({ influencer, size = 46 }: { influencer: Influencer; size?: number }) {
  return (
    <LinearGradient
      colors={influencer.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <AppText tone="onBrand" weight="700" size={size * 0.39}>{influencer.initial}</AppText>
    </LinearGradient>
  );
}

// An influencer in the search results: avatar, @handle, platforms and followers, and how many picks.
export function InfluencerCard({ influencer, index = 0, onPress }: { influencer: Influencer; index?: number; onPress: () => void }) {
  const { palette, scheme } = useTheme();
  const rise = useRiseIn(Math.min(index, 8) * 70);
  return (
    <Animated.View style={rise}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`@${influencer.handle}, ${pickCount(influencer)} picks`}
        style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line, boxShadow: cardShadow(palette) }]}>
        <InfluencerAvatar influencer={influencer} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <AppText weight="700" size={15} numberOfLines={1}>@{influencer.handle}</AppText>
          <AppText tone="muted" size={12} numberOfLines={1}>{platformText(influencer)} · {influencer.followers} followers</AppText>
        </View>
        <View style={[styles.badge, { backgroundColor: scheme === 'dark' ? '#4A2A12' : '#FFE9D6' }]}>
          <AppText weight="700" size={10} style={{ color: scheme === 'dark' ? '#FFD3AE' : '#8A3B00' }}>{pickCount(influencer)} picks</AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderRadius: 20, borderWidth: 1, padding: 10 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
});
