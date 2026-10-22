import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { NewBadge } from '@/src/components/NewBadge';
import { Animated, useRiseIn } from '@/src/components/motion';
import { SourceBadge } from '@/src/components/place/OffersList';
import { AppText } from '@/src/components/ui/ui';
import { fmt, thumbColors } from '@/src/data/mock';
import { NewOfferCard } from '@/src/newin/newInData';
import { NEW_BADGE } from '@/src/newin/newInData';
import { heroPhotoUrl } from '@/src/place/placeData';
import { cardShadow } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

export const OFFER_CARD_WIDTH = 250;

// A card of "New offers" (prototype: .oc): the place's picture or colours on top with a shimmering NEW badge
// and the source (Fazaa / Esaad / Spotted), then the offer text, place name and distance, and the time left in red.
// Tapping it opens the Place page with the Offers dropdown already open.
export function OfferCard({ card, onPress }: { card: NewOfferCard; onPress: () => void }) {
  const { palette } = useTheme();
  const rise = useRiseIn(card.delay);
  const { offer, place } = card;
  const photo = heroPhotoUrl(place);

  return (
    <Animated.View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line, boxShadow: cardShadow(palette) }, rise]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${offer.text}, ${place.name}, ${fmt(place.dist)}, ${offer.ends}`}>
        <View style={styles.top}>
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
          ) : (
            <LinearGradient colors={thumbColors(place)} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={StyleSheet.absoluteFill}>
              <View style={styles.awning}>
                {Array.from({ length: 13 }, (_, i) => (
                  <View key={i} style={{ width: 10, backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'transparent' }} />
                ))}
              </View>
            </LinearGradient>
          )}
          <View style={styles.newBadge}><NewBadge label={NEW_BADGE} /></View>
          <SourceBadge offer={offer} />
        </View>
        <View style={styles.body}>
          <AppText weight="700" size={15}>{offer.text}</AppText>
          <AppText tone="muted" size={12}>{place.name} · {fmt(place.dist)}</AppText>
          <AppText tone="red" weight="600" size={12}>{offer.ends}</AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: OFFER_CARD_WIDTH, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  top: { height: 88, padding: 12, justifyContent: 'flex-end', alignItems: 'flex-start', overflow: 'hidden' },
  awning: { position: 'absolute', top: 0, left: 0, right: 0, height: 16, flexDirection: 'row' },
  newBadge: { position: 'absolute', top: 24, right: 12 },
  body: { gap: 4, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
});
