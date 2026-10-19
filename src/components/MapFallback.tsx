import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { SavedPlace, listPlaces } from '@/src/db';
import { openDirections, openLink } from '@/src/openLink';

// Shown on the Map tab instead of a map when no Google Maps key is built into the app
// (the real map would crash). It lists the saved places, each with Directions.
export function MapFallback() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  const [places, setPlaces] = useState<SavedPlace[]>([]);

  useFocusEffect(
    useCallback(() => {
      listPlaces()
        .then(setPlaces)
        .catch(() => setPlaces([]));
    }, [])
  );

  return (
    <FlatList
      data={places}
      keyExtractor={(place) => place.id}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={[styles.notice, { backgroundColor: theme.card }]}>
          <Text style={styles.noticeTitle}>🗺️ Map view is coming soon</Text>
          <Text style={[styles.noticeText, { color: theme.mutedText }]}>
            The map needs a Google Maps key, which this draft does not have yet. Your places and Directions work as normal.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: theme.mutedText }]}>Save a place and it will show up here.</Text>
      }
      renderItem={({ item }) => {
        const category = CATEGORIES[item.category];
        return (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={[styles.stripe, { backgroundColor: category.color }]} />
            <View style={styles.body} lightColor="transparent" darkColor="transparent">
              <View style={styles.topRow} lightColor="transparent" darkColor="transparent">
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={[styles.pill, { backgroundColor: category.strongColor }]}>
                  <Text style={styles.pillText}>
                    {category.emoji} {category.label}
                  </Text>
                </View>
              </View>
              <Text style={{ color: theme.mutedText }} numberOfLines={1}>
                {item.address}
              </Text>
              {item.note ? <Text style={styles.note}>“{item.note}”</Text> : null}

              <View style={styles.buttons} lightColor="transparent" darkColor="transparent">
                {item.reelUrl ? (
                  <Pressable
                    onPress={() => openLink(item.reelUrl!)}
                    style={[styles.button, { borderColor: theme.outline }]}>
                    <Text style={styles.buttonText}>▶ Open reel</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => openDirections(item)}
                  style={[styles.button, { backgroundColor: theme.tintStrong, borderColor: theme.tintStrong }]}>
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Directions</Text>
                </Pressable>
              </View>

              <Pressable onPress={() => router.push(`/place/${item.id}` as never)} style={styles.editLink}>
                <Text style={{ color: theme.tintText, fontWeight: '600' }}>Edit place</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  notice: { borderRadius: 16, padding: 16, marginBottom: 16 },
  noticeTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  noticeText: { fontSize: 14, lineHeight: 20 },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 15 },
  card: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  stripe: { width: 6 },
  body: { flex: 1, padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 17, fontWeight: '700' },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  note: { fontSize: 14, fontStyle: 'italic', marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  button: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700' },
  editLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
