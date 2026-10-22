import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { InfluencerAvatar } from '@/src/components/home/InfluencerCard';
import { AppText } from '@/src/components/ui/ui';
import { INFLUENCERS } from '@/src/data/mock';
import { pickCount, platformText } from '@/src/home/homeData';
import { useTheme } from '@/src/theme/ThemeProvider';

// An influencer. A simple placeholder until the full Influencer page is built.
export default function InfluencerScreen() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const influencer = INFLUENCERS.find((i) => i.id === id);

  return (
    <ScrollView style={{ backgroundColor: palette.bg }} contentContainerStyle={{ alignItems: 'center', padding: 24, gap: 6 }}>
      <Stack.Screen options={{ title: influencer ? `@${influencer.handle}` : 'Influencer' }} />
      {influencer ? (
        <>
          <InfluencerAvatar influencer={influencer} size={96} />
          <AppText weight="700" size={22} style={{ marginTop: 10 }}>@{influencer.handle}</AppText>
          <AppText tone="muted" size={13}>{platformText(influencer)} · {influencer.followers} followers</AppText>
          <AppText tone="muted" size={13}>{influencer.niche} · {pickCount(influencer)} picks</AppText>
          <AppText tone="muted" size={13} style={{ textAlign: 'center', marginTop: 16 }}>The full influencer page arrives in a later step.</AppText>
        </>
      ) : (
        <AppText tone="muted">This influencer was not found.</AppText>
      )}
    </ScrollView>
  );
}
