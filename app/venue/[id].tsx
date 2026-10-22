import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionRow } from '@/src/components/place/ActionRow';
import { Dropdown } from '@/src/components/place/Dropdown';
import { InfluencerRecs } from '@/src/components/place/InfluencerRecs';
import { MenuSheet } from '@/src/components/place/MenuSheet';
import { OffersList } from '@/src/components/place/OffersList';
import { PlaceHero } from '@/src/components/place/PlaceHero';
import { Toast } from '@/src/components/place/Toast';
import { AppText } from '@/src/components/ui/ui';
import { placeById } from '@/src/data/mock';
import { mapsUrl, offerCount, placeSubtitle, recommendationsFor, saveToast } from '@/src/place/placeData';
import { toggleSaved, useSavedIds } from '@/src/state/saved';
import { useTheme } from '@/src/theme/ThemeProvider';

// The Place page (prototype: PLACE PAGE). It slides in from the right.
//   hero picture . name . "Category . AED lo-hi per person . distance"
//   [Location] [Menu]                                  [bookmark]
//   Influencer recommendations (open)      Offers (closed)
// Opening it with ?menu=1 (the Menu button on a Home card) shows the menu straight away.
// Opening it with ?offers=1 (an offer on the New In tab) opens the Offers dropdown and folds the recommendations.
export default function VenueScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, menu, offers } = useLocalSearchParams<{ id: string; menu?: string; offers?: string }>();
  const place = placeById(id);
  const savedIds = useSavedIds();

  const [recsOpen, setRecsOpen] = useState(offers !== '1'); // recommendations: open by default (folded when we came for an offer)
  const [offersOpen, setOffersOpen] = useState(offers === '1'); // offers: closed by default (open when we came for an offer)
  const [menuOpen, setMenuOpen] = useState(menu === '1');
  const [toast, setToast] = useState<string | null>(null);

  // The short message disappears after about 2 seconds.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2300);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const recs = useMemo(() => (place ? recommendationsFor(place) : []), [place]);

  const openLink = useCallback(
    (url: string | null) => {
      if (!url) return showToast("Couldn't open that link");
      Linking.openURL(url).catch(() => showToast("Couldn't open that link"));
    },
    [showToast]
  );

  if (!place) {
    return (
      <View style={[styles.missing, { backgroundColor: palette.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppText tone="muted">This place was not found.</AppText>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={[styles.backLink, { backgroundColor: palette.chip }]}>
          <AppText tone="acc" weight="600">Go back</AppText>
        </Pressable>
      </View>
    );
  }

  const saved = savedIds.has(place.id);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        <PlaceHero place={place} onBack={() => router.back()} />

        <View style={[styles.sheet, { backgroundColor: palette.bg }]}>
          <AppText weight="700" size={24} style={{ letterSpacing: -0.3 }} accessibilityRole="header">{place.name}</AppText>
          <AppText tone="muted" size={13} style={{ marginTop: 4 }}>{placeSubtitle(place)}</AppText>

          <ActionRow
            placeName={place.name}
            saved={saved}
            onLocation={() => openLink(mapsUrl(place))}
            onMenu={() => setMenuOpen(true)}
            onToggleSave={() => showToast(saveToast(place, toggleSaved(place.id)))}
          />

          <View style={{ marginTop: 22 }}>
            <Dropdown
              title="Influencer recommendations"
              count={recs.length}
              icon="star"
              iconColor="#E07A1F"
              open={recsOpen}
              onToggle={() => setRecsOpen((v) => !v)}>
              <InfluencerRecs
                recs={recs}
                onOpenInfluencer={(influencerId) => router.push(`/influencer/${influencerId}` as never)}
                onOpenReel={(rec) => openLink(rec.reelUrl)}
              />
            </Dropdown>
          </View>

          <View style={{ marginTop: 12 }}>
            <Dropdown
              title="Offers"
              count={offerCount(place)}
              icon="tag"
              iconColor={palette.red}
              open={offersOpen}
              onToggle={() => setOffersOpen((v) => !v)}>
              <OffersList place={place} />
            </Dropdown>
          </View>
        </View>
      </ScrollView>

      <MenuSheet place={place} visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toast message={toast} bottom={insets.bottom + 30} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { marginTop: -18, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  backLink: { minHeight: 44, paddingHorizontal: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
