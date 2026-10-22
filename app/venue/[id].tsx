import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { PlaceLogo } from '@/src/components/PlaceLogo';
import { AppText } from '@/src/components/ui/ui';
import { fmt, placeById } from '@/src/data/mock';
import { categoryLine } from '@/src/home/homeData';
import { useTheme } from '@/src/theme/ThemeProvider';

// A place from the catalogue. A simple placeholder until the full Place page is built (next step).
export default function VenueScreen() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = placeById(id);

  return (
    <ScrollView style={{ backgroundColor: palette.bg }} contentContainerStyle={{ alignItems: 'center', padding: 24, gap: 6 }}>
      <Stack.Screen options={{ title: place?.name ?? 'Place' }} />
      {place ? (
        <>
          <PlaceLogo place={place} size={96} shape="square" />
          <AppText weight="700" size={24} style={{ marginTop: 10 }}>{place.name}</AppText>
          <AppText tone="muted" size={13}>{categoryLine(place)}</AppText>
          <AppText tone="muted" size={13}>{fmt(place.dist)}</AppText>
          <View style={{ height: 16 }} />
          <AppText tone="muted" size={13} style={{ textAlign: 'center' }}>The full place page arrives in the next step.</AppText>
        </>
      ) : (
        <AppText tone="muted">This place was not found.</AppText>
      )}
    </ScrollView>
  );
}
