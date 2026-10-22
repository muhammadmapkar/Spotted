import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { formatDistance } from '@/src/location/distance';
import { SavedPlace } from '@/src/db';

// One rounded card in the My Places list.
// Tap = open the place. Long-press = show Edit / Delete choices.
export function PlaceCard({
  place,
  distanceMeters,
  onPress,
  onLongPress,
}: {
  place: SavedPlace;
  distanceMeters?: number; // only known when location is allowed
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = Colors[useColorScheme()];
  const category = CATEGORIES[place.category];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityHint="Long-press for edit and delete"
      style={({ pressed }) => [styles.card, { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }]}>
      {/* Coloured stripe on the left shows the category at a glance */}
      <View style={[styles.stripe, { backgroundColor: category.color }]} />
      <View style={styles.body} lightColor="transparent" darkColor="transparent">
        <View style={styles.topRow} lightColor="transparent" darkColor="transparent">
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={[styles.pill, { backgroundColor: category.strongColor }]}>
            <Text style={styles.pillText}>
              {category.label}
            </Text>
          </View>
        </View>
        <Text style={[styles.address, { color: theme.mutedText }]} numberOfLines={1}>
          {place.address}
        </Text>
        {distanceMeters !== undefined ? (
          <Text style={[styles.distance, { color: theme.tintText }]}>{formatDistance(distanceMeters)} away</Text>
        ) : null}
        {place.note ? (
          <Text style={[styles.note, { color: theme.mutedText }]} numberOfLines={2}>
            “{place.note}”
          </Text>
        ) : null}
      </View>
    </Pressable>
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
  distance: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  note: { fontSize: 14, fontStyle: 'italic', marginTop: 8 },
});
