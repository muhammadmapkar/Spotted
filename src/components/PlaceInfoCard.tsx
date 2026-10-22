import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { NewBadge } from '@/src/components/NewBadge';
import { Icon } from '@/src/components/icons/Icon';
import { Animated, useRiseIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { Place, fmt, recsFor, thumbColors } from '@/src/data/mock';
import { categoryLine } from '@/src/home/homeData';
import { PARTNER_BORDER, cardShadow, partnerGlow } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

// A place as a card (prototype: .card). Used on Home, and reused in other tabs.
//   [logo with striped awning]  Name  (red bookmark if saved)
//                               Category . AED lo-hi pp
//                               pin  1.2 km away
//                               [Spotted Partner] [Spotted by 3]        [Menu]
// Cards slide up and fade in as they appear.
export function PlaceInfoCard({
  place,
  saved,
  index = 0,
  onPress,
  onMenuPress,
  justJoined = false,
}: {
  place: Place;
  saved: boolean;
  index?: number; // position in the list: later cards appear a little later
  onPress: () => void;
  onMenuPress: () => void;
  justJoined?: boolean; // show the shimmering "JUST JOINED" badge (New In tab)
}) {
  const { palette, scheme } = useTheme();
  const rise = useRiseIn(Math.min(index, 8) * 70);
  const recommendedBy = recsFor(place.id).length;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: place.partner ? PARTNER_BORDER : palette.line,
          boxShadow: place.partner ? partnerGlow(palette) : cardShadow(palette),
        },
        rise,
      ]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${place.name}, ${place.cat}, ${fmt(place.dist)}${saved ? ', saved' : ''}`}
        style={styles.main}>
        {/* The logo thumbnail with a striped awning across the top */}
        <LinearGradient colors={thumbColors(place)} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={styles.thumb}>
          <View style={styles.awning}>
            {Array.from({ length: 8 }, (_, i) => (
              <View key={i} style={{ width: 10, backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'transparent' }} />
            ))}
          </View>
          <AppText tone="onBrand" weight="800" size={22}>{place.mono}</AppText>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <AppText weight="700" size={15} numberOfLines={1} style={{ flexShrink: 1 }}>{place.name}</AppText>
            {saved ? <Icon name="bookmark" size={13} color={palette.red} filled label="Saved" /> : null}
          </View>
          <AppText tone="muted" size={12} numberOfLines={1}>{categoryLine(place)}</AppText>
          <View style={styles.metaRow}>
            <Icon name="pin" size={13} color={palette.muted} />
            <AppText tone="muted" size={12}>{fmt(place.dist)}</AppText>
          </View>
          <View style={styles.badges}>
            {justJoined ? <NewBadge label="JUST JOINED" /> : null}
            {place.partner ? (
              <LinearGradient colors={['#6A1FB0', '#9D4EDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
                <AppText tone="onBrand" weight="700" size={10}>Spotted Partner</AppText>
              </LinearGradient>
            ) : null}
            {recommendedBy > 0 ? (
              <View style={[styles.badge, { backgroundColor: scheme === 'dark' ? '#4A2A12' : '#FFE9D6' }]}>
                <Icon name="star" size={13} color={scheme === 'dark' ? '#FFD3AE' : '#8A3B00'} />
                <AppText weight="700" size={10} style={{ color: scheme === 'dark' ? '#FFD3AE' : '#8A3B00' }}>
                  Spotted by {recommendedBy}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* The separate Menu button */}
      <Pressable
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel={`Open menu for ${place.name}`}
        style={[styles.menuButton, { backgroundColor: palette.chip }]}>
        <Icon name="menu" size={20} color={palette.acc} />
        <AppText tone="acc" weight="700" size={10}>Menu</AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'stretch', gap: 4, borderRadius: 20, borderWidth: 1, padding: 10 },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 76, height: 76, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  awning: { position: 'absolute', top: 0, left: 0, right: 0, height: 14, flexDirection: 'row' },
  body: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  menuButton: { width: 56, minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
