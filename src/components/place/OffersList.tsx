import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/ui';
import { Offer, Place } from '@/src/data/mock';
import { NO_PARTNER_OFFERS, NO_SPOTTED_OFFERS, offerBadge } from '@/src/place/placeData';
import { useTheme } from '@/src/theme/ThemeProvider';

// The coloured badge at the start of an offer row (prototype: .src). Esaad is green, Fazaa blue, Spotted purple.
const BADGE_COLORS = {
  light: { esaad: ['#DFF3EA', '#0B6B43'], fazaa: ['#E2ECFB', '#1B4F9C'] },
  dark: { esaad: ['#113D2A', '#9FE3C2'], fazaa: ['#14284A', '#AFCBF5'] },
} as const;

// The coloured source badge (Esaad, Fazaa, or the title of a Spotted offer). Also used on the New In tab.
export function SourceBadge({ offer }: { offer: Offer }) {
  const { scheme } = useTheme();
  const badge = offerBadge(offer);
  return badge.kind === 'spotted' ? (
    <LinearGradient colors={['#6A1FB0', '#9D4EDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
      <AppText tone="onBrand" weight="800" size={10} style={styles.badgeText}>{badge.label}</AppText>
    </LinearGradient>
  ) : (
    <View style={[styles.badge, { backgroundColor: BADGE_COLORS[scheme][badge.kind][0] }]}>
      <AppText weight="800" size={10} style={[styles.badgeText, { color: BADGE_COLORS[scheme][badge.kind][1] }]}>{badge.label}</AppText>
    </View>
  );
}

function OfferRow({ offer, first }: { offer: Offer; first: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.offer, !first && { borderTopWidth: 1, borderTopColor: palette.line }]}>
      <SourceBadge offer={offer} />
      <AppText size={13} style={{ flex: 1 }}>{offer.text}</AppText>
    </View>
  );
}

// The body of the "Offers" dropdown: "Partner discounts" (Fazaa / Esaad) and "Spotted offers"
// (the loyalty stamp card and other Spotted deals), each with a friendly message when empty.
export function OffersList({ place }: { place: Place }) {
  return (
    <View>
      <AppText tone="muted" weight="700" size={11} style={styles.sub}>PARTNER DISCOUNTS</AppText>
      {place.partnerOffers.length === 0 ? (
        <AppText tone="muted" size={13} style={styles.empty}>{NO_PARTNER_OFFERS}</AppText>
      ) : (
        place.partnerOffers.map((offer, i) => <OfferRow key={offer.source + offer.text} offer={offer} first={i === 0} />)
      )}
      <AppText tone="muted" weight="700" size={11} style={styles.sub}>SPOTTED OFFERS</AppText>
      {place.spottedOffers.length === 0 ? (
        <AppText tone="muted" size={13} style={styles.empty}>{NO_SPOTTED_OFFERS}</AppText>
      ) : (
        place.spottedOffers.map((offer, i) => <OfferRow key={(offer.title ?? '') + offer.text} offer={offer} first={i === 0} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { letterSpacing: 0.8, paddingTop: 12, paddingBottom: 2 },
  empty: { marginVertical: 6 },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { letterSpacing: 0.3 },
});
