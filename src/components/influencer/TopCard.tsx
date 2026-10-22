import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Animated, useFanIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { fmt, thumbColors } from '@/src/data/mock';
import { heroPhotoUrl } from '@/src/place/placeData';
import { TopCard as TopCardData } from '@/src/influencer/influencerData';
import { cardShadow } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

export const TOP_CARD_WIDTH = 236;

// One card of "This month's top 7" (prototype: .top7): the place picture with its rank number, the name,
// category and distance, and the items the influencer recommends with prices. Cards fan in from the right.
// Tapping the card opens the Place page.
export function TopCard({ card, onPress }: { card: TopCardData; onPress: () => void }) {
  const { palette } = useTheme();
  const fan = useFanIn(card.delay);
  const { place } = card;
  const photo = heroPhotoUrl(place);

  return (
    <Animated.View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line, boxShadow: cardShadow(palette) }, fan]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Number ${card.rank}, ${place.name}, ${place.cat}, ${fmt(place.dist)}`}>
        <View style={styles.picture}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.fill} resizeMode="cover" accessibilityIgnoresInvertColors />
          ) : (
            <LinearGradient colors={thumbColors(place)} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={styles.fill}>
              <View style={styles.awning}>
                {Array.from({ length: 12 }, (_, i) => (
                  <View key={i} style={{ width: 10, backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'transparent' }} />
                ))}
              </View>
              <AppText tone="onBrand" weight="800" size={22} style={styles.mono}>{place.mono}</AppText>
            </LinearGradient>
          )}
          <AppText tone="onBrand" weight="800" size={54} style={styles.rank}>{card.rank}</AppText>
        </View>
        <View style={styles.text}>
          <AppText weight="700" size={15} numberOfLines={1}>{place.name}</AppText>
          <AppText tone="muted" size={12}>{place.cat} · {fmt(place.dist)}</AppText>
        </View>
      </Pressable>
      <View style={styles.items}>
        {card.items.map((item) => (
          <View key={item.name} style={styles.dish}>
            <AppText size={13} style={{ flexShrink: 1 }}>{item.name}</AppText>
            <AppText tone="acc" weight="700" size={13}>AED {item.price}</AppText>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: TOP_CARD_WIDTH, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  picture: { height: 100, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  awning: { position: 'absolute', top: 0, left: 0, right: 0, height: 16, flexDirection: 'row' },
  mono: { position: 'absolute', right: 12, bottom: 10, opacity: 0.9 },
  rank: { position: 'absolute', left: 12, bottom: -6, lineHeight: 58, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 14 },
  text: { gap: 2, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  items: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 },
  dish: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 3 },
});
