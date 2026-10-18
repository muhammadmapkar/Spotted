import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { SavedPlace } from '@/src/db';

// One rounded card in the My Places list.
export function PlaceCard({ place }: { place: SavedPlace }) {
  const theme = Colors[useColorScheme()];
  const category = CATEGORIES[place.category];

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {/* Coloured stripe on the left shows the category at a glance */}
      <View style={[styles.stripe, { backgroundColor: category.color }]} />
      <View style={styles.body} lightColor="transparent" darkColor="transparent">
        <View style={styles.topRow} lightColor="transparent" darkColor="transparent">
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={[styles.pill, { backgroundColor: category.color }]}>
            <Text style={styles.pillText}>
              {category.emoji} {category.label}
            </Text>
          </View>
        </View>
        <Text style={[styles.address, { color: theme.mutedText }]} numberOfLines={1}>
          {place.address}
        </Text>
        {place.note ? (
          <Text style={[styles.note, { color: theme.mutedText }]} numberOfLines={2}>
            “{place.note}”
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  stripe: { width: 6 },
  body: { flex: 1, padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 17, fontWeight: '700' },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  address: { fontSize: 14, marginTop: 4 },
  note: { fontSize: 14, fontStyle: 'italic', marginTop: 8 },
});
