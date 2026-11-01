import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SavedPlace } from '@/src/db';
import { Coords, distanceMeters } from '@/src/location/distance';
import { pickPlacesToTry } from '@/src/planner';

import { PlaceCard } from './PlaceCard';

// The "Plan my weekend" button on My Places, and the pop-up with 3 places to try.
export function WeekendPlanner({
  places,
  position,
  onOpenPlace,
}: {
  places: SavedPlace[];
  position: Coords | null;
  onOpenPlace: (place: SavedPlace) => void;
}) {
  const theme = Colors[useColorScheme()];
  const [picks, setPicks] = useState<SavedPlace[] | null>(null); // null = pop-up closed

  const notVisited = places.filter((place) => !place.visitedAt).length;
  if (notVisited === 0) return null; // nothing to suggest

  const shuffle = () => setPicks(pickPlacesToTry(places, position));
  const close = () => setPicks(null);

  return (
    <>
      <Pressable
        onPress={shuffle}
        accessibilityRole="button"
        accessibilityHint="Suggests 3 saved places you haven't been to yet"
        style={[styles.openButton, { borderColor: theme.tint }]}>
        <Text style={[styles.openText, { color: theme.tintText }]}>Plan my weekend</Text>
      </Pressable>

      <Modal visible={picks !== null} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.backdrop} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <Text style={styles.title}>Places to try</Text>
            <Text style={[styles.hint, { color: theme.mutedText }]}>
              {position ? 'Close to you, and not visited yet.' : "Saved places you haven't been to yet."}
            </Text>
            <ScrollView style={styles.list}>
              {(picks ?? []).map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  distanceMeters={position ? distanceMeters(position, place) : undefined}
                  onPress={() => {
                    close();
                    onOpenPlace(place);
                  }}
                  onLongPress={() => {}}
                />
              ))}
            </ScrollView>
            <View style={styles.buttons} lightColor="transparent" darkColor="transparent">
              {notVisited > (picks?.length ?? 0) ? (
                <Pressable
                  onPress={shuffle}
                  accessibilityRole="button"
                  style={[styles.button, { borderColor: theme.outline, borderWidth: 1 }]}>
                  <Text style={styles.buttonText}>Shuffle</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={close} accessibilityRole="button" style={[styles.button, { backgroundColor: theme.tint }]}>
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  openButton: {
    minHeight: 44,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openText: { fontSize: 15, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, maxHeight: '85%' },
  title: { fontSize: 22, fontWeight: '700' },
  hint: { fontSize: 14, marginTop: 4, marginBottom: 12 },
  list: { flexGrow: 0 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, fontWeight: '700' },
});
