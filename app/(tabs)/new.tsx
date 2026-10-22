import { useFocusEffect, useRouter } from 'expo-router';
import { ReactNode, useCallback } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/src/components/icons/Icon';
import { IconName } from '@/src/components/icons/paths';
import { Animated, useRiseIn } from '@/src/components/motion';
import { NewInfluencerCircle } from '@/src/components/newin/NewInfluencerCircle';
import { OFFER_CARD_WIDTH, OfferCard } from '@/src/components/newin/OfferCard';
import { PlaceInfoCard } from '@/src/components/PlaceInfoCard';
import { AppText } from '@/src/components/ui/ui';
import { SECTION_DELAYS, SECTION_TITLES, SUBTITLE, newInfluencers, newOfferCards, newPlaces } from '@/src/newin/newInData';
import { markNewInSeen } from '@/src/state/newIn';
import { useSavedIds } from '@/src/state/saved';
import { useTheme } from '@/src/theme/ThemeProvider';

// A section that slides in a little after the one above it.
function Section({ delay, icon, iconColor, title, children }: { delay: number; icon: IconName; iconColor: string; title: string; children: ReactNode }) {
  const rise = useRiseIn(delay);
  return (
    <Animated.View style={[styles.section, rise]}>
      <View style={styles.sectionTitle}>
        <Icon name={icon} size={20} color={iconColor} />
        <AppText weight="700" size={17} accessibilityRole="header">{title}</AppText>
      </View>
      {children}
    </Animated.View>
  );
}

// New In (prototype: NEW IN): what is fresh within 15 km: new offers, new influencers and new places.
// Opening this tab clears the red dot on its icon.
export default function NewInScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const savedIds = useSavedIds();
  const titleRise = useRiseIn(0);

  useFocusEffect(useCallback(() => { markNewInSeen(); }, []));

  const offers = newOfferCards();
  const influencers = newInfluencers();
  const places = newPlaces();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.padded, titleRise]}>
        <AppText weight="700" size={26} style={{ letterSpacing: -0.3 }} accessibilityRole="header">New in</AppText>
        <AppText tone="muted" size={13} style={{ marginTop: 2 }}>{SUBTITLE}</AppText>
      </Animated.View>

      <Section delay={SECTION_DELAYS.offers} icon="tag" iconColor={palette.red} title={SECTION_TITLES.offers}>
        <FlatList
          horizontal
          data={offers}
          keyExtractor={(card) => card.offer.placeId + card.offer.text}
          showsHorizontalScrollIndicator={false}
          snapToInterval={OFFER_CARD_WIDTH + 14}
          decelerationRate="fast"
          contentContainerStyle={styles.row}
          renderItem={({ item }) => <OfferCard card={item} onPress={() => router.push(`/venue/${item.place.id}?offers=1` as never)} />}
        />
      </Section>

      <Section delay={SECTION_DELAYS.influencers} icon="star" iconColor={palette.acc} title={SECTION_TITLES.influencers}>
        <FlatList
          horizontal
          data={influencers}
          keyExtractor={(item) => item.influencer.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          renderItem={({ item }) => <NewInfluencerCircle item={item} onPress={() => router.push(`/influencer/${item.influencer.id}` as never)} />}
        />
      </Section>

      <Section delay={SECTION_DELAYS.places} icon="home" iconColor={palette.acc} title={SECTION_TITLES.places}>
        <View style={styles.places}>
          {places.map(({ place, index }) => (
            <PlaceInfoCard
              key={place.id}
              place={place}
              saved={savedIds.has(place.id)}
              index={index}
              justJoined
              onPress={() => router.push(`/venue/${place.id}` as never)}
              onMenuPress={() => router.push(`/venue/${place.id}?menu=1` as never)}
            />
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: 20 },
  section: { marginTop: 22 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  row: { gap: 14, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  places: { gap: 12, paddingHorizontal: 20, paddingTop: 10 },
});
