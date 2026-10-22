import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/src/components/icons/Icon';
import { PlatformTile } from '@/src/components/influencer/PlatformTile';
import { ProfileRing } from '@/src/components/influencer/ProfileRing';
import { RecommendationRow } from '@/src/components/influencer/RecommendationRow';
import { TOP_CARD_WIDTH, TopCard } from '@/src/components/influencer/TopCard';
import { Toast } from '@/src/components/place/Toast';
import { AppText } from '@/src/components/ui/ui';
import { allRecommendations, findInfluencer, followersLine, monthLabel, openWithFallback, platformButtons, topSeven } from '@/src/influencer/influencerData';
import { useTheme } from '@/src/theme/ThemeProvider';

// The Influencer page (prototype: INFLUENCER PAGE).
//   (rotating ring)  @handle
//                    48.2K followers . Food in Abu Dhabi
//   [Instagram] [TikTok]            <- open their profile on that platform
//   This month's top 7  [October]   <- swipe sideways, tap a card to open the place
//   All recommendations             <- every place, with a play button for the reel
export default function InfluencerScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const influencer = findInfluencer(id);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2300);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const buttons = useMemo(() => (influencer ? platformButtons(influencer) : []), [influencer]);
  const top = useMemo(() => (influencer ? topSeven(influencer) : []), [influencer]);
  const all = useMemo(() => (influencer ? allRecommendations(influencer) : []), [influencer]);

  const openPlace = (placeId: string) => router.push(`/venue/${placeId}` as never);
  const openReel = (url: string | null) => {
    if (!url) return showToast("Couldn't open that link");
    Linking.openURL(url).catch(() => showToast("Couldn't open that link"));
  };

  const backButton = (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={[styles.back, { top: insets.top + 10 }]}>
      <Icon name="back" size={22} color="#1C0F2E" />
    </Pressable>
  );

  if (!influencer) {
    return (
      <View style={[styles.missing, { backgroundColor: palette.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        {backButton}
        <AppText tone="muted">This influencer was not found.</AppText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 76, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <ProfileRing influencer={influencer} />
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <AppText weight="700" size={19} accessibilityRole="header">@{influencer.handle}</AppText>
            <AppText tone="muted" size={12}>{followersLine(influencer)}</AppText>
          </View>
        </View>

        <View style={styles.platforms}>
          {buttons.map((button) => (
            <PlatformTile
              key={button.platform}
              platform={button.platform}
              label={button.label}
              delay={button.delay}
              onPress={() => { openWithFallback(button.links, (url) => Linking.openURL(url)).then((result) => { if (result === 'failed') showToast("Couldn't open that link"); }); }}
            />
          ))}
        </View>

        <View style={styles.headingRow}>
          <AppText weight="700" size={17} accessibilityRole="header">This month's top 7</AppText>
          <View style={[styles.month, { backgroundColor: palette.chip }]}>
            <AppText tone="acc" weight="600" size={12}>{monthLabel()}</AppText>
          </View>
        </View>
        <FlatList
          horizontal
          data={top}
          keyExtractor={(card) => card.place.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={TOP_CARD_WIDTH + 14}
          decelerationRate="fast"
          contentContainerStyle={styles.topList}
          style={{ marginTop: 10 }}
          renderItem={({ item }) => <TopCard card={item} onPress={() => openPlace(item.place.id)} />}
        />

        <View style={styles.all}>
          <AppText weight="700" size={17} accessibilityRole="header">All recommendations</AppText>
          {all.map((row) => (
            <RecommendationRow
              key={row.place.id}
              row={row}
              onOpenPlace={() => openPlace(row.place.id)}
              onOpenReel={() => openReel(row.reelUrl)}
            />
          ))}
        </View>
      </ScrollView>
      {backButton}
      <Toast message={toast} bottom={insets.bottom + 30} />
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: 'absolute',
    left: 16,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
  },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 },
  platforms: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginTop: 14 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24 },
  month: { height: 26, paddingHorizontal: 12, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  topList: { gap: 14, paddingHorizontal: 20, paddingBottom: 8 },
  all: { paddingHorizontal: 20, marginTop: 24, gap: 10 },
});
