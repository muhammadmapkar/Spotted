import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { CollectionPicker } from '@/src/components/CollectionPicker';
import { Category, SavedPlace, deletePlace, getPlace, updatePlace } from '@/src/db';
import { openLink } from '@/src/openLink';

// Place detail / edit screen. You can change the category and the note.
export default function PlaceScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [place, setPlace] = useState<SavedPlace | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false); // loading hit an error (not the same as "not found")
  const [busy, setBusy] = useState(false); // true while saving or deleting, so a double tap does nothing
  const [category, setCategory] = useState<Category>('food');
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [muted, setMuted] = useState(false);
  const [visited, setVisited] = useState(false);

  // Load the place. Used when the screen opens and by the "Try again" button.
  const load = useCallback(() => {
    setLoadFailed(false);
    getPlace(id)
      .then((found) => {
        if (!found) return setNotFound(true);
        setPlace(found);
        setCategory(found.category);
        setNote(found.note ?? '');
        setCollectionIds(found.collectionIds);
        setMuted(found.muted);
        setVisited(Boolean(found.visitedAt));
      })
      .catch(() => setLoadFailed(true)); // show a friendly message instead of a blank screen
  }, [id]);
  useEffect(load, [load]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updatePlace(id, {
        category,
        note: note.trim() || undefined,
        collectionIds,
        muted,
        // Keep the original date if it was already marked; set it now if newly marked; clear it if unmarked.
        visitedAt: visited ? (place?.visitedAt ?? new Date().toISOString()) : undefined,
      });
      router.back();
    } catch {
      setBusy(false);
      Alert.alert('Could not save', 'Your changes were not saved. Please try again.');
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this place?', `"${place?.name}" will be removed from Spotted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (busy) return;
          setBusy(true);
          try {
            await deletePlace(id);
            router.back();
          } catch {
            setBusy(false);
            Alert.alert('Could not delete', 'This place was not deleted. Please try again.');
          }
        },
      },
    ]);
  };

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>This place was not found</Text>
        <Text style={{ color: theme.mutedText }}>It may have been deleted.</Text>
      </View>
    );
  }
  if (loadFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Could not open this place</Text>
        <Text style={{ color: theme.mutedText, marginBottom: 16, textAlign: 'center' }}>
          Something went wrong while loading it. Please try again.
        </Text>
        <Pressable
          onPress={load}
          accessibilityRole="button"
          style={[styles.saveButton, styles.retryButton, { backgroundColor: theme.tint }]}>
          <Text style={styles.saveText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!place) {
    // Still loading: show a spinner instead of a blank screen.
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.tint} accessibilityLabel="Loading place" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: place.name }} />

      <Text style={styles.title}>{place.name}</Text>
      <Text style={[styles.address, { color: theme.mutedText }]}>{place.address}</Text>

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {(Object.keys(CATEGORIES) as Category[]).map((key) => {
          const selected = key === category;
          return (
            <Pressable
              key={key}
              onPress={() => setCategory(key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? CATEGORIES[key].strongColor : 'transparent',
                  borderColor: selected ? CATEGORIES[key].strongColor : theme.outline,
                },
              ]}>
              <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]}>
                {CATEGORIES[key].emoji} {CATEGORIES[key].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Reminders for this place</Text>
      <View style={[styles.switchCard, { backgroundColor: theme.card }]}>
        <View style={styles.switchRow} lightColor="transparent" darkColor="transparent">
          <View style={styles.switchText} lightColor="transparent" darkColor="transparent">
            <Text style={styles.switchTitle}>Remind me when I'm near</Text>
            <Text style={[styles.switchHint, { color: theme.mutedText }]}>
              Turn off for places you pass all the time.
            </Text>
          </View>
          <Switch
            value={!muted}
            onValueChange={(on) => setMuted(!on)}
            accessibilityLabel="Remind me when I'm near this place"
            trackColor={{ true: theme.tint }}
          />
        </View>
        <View style={styles.switchRow} lightColor="transparent" darkColor="transparent">
          <View style={styles.switchText} lightColor="transparent" darkColor="transparent">
            <Text style={styles.switchTitle}>I've been here ✓</Text>
            <Text style={[styles.switchHint, { color: theme.mutedText }]}>
              Spotted stops reminding you about this place.
            </Text>
          </View>
          <Switch
            value={visited}
            onValueChange={setVisited}
            accessibilityLabel="I've been here"
            trackColor={{ true: theme.tint }}
          />
        </View>
      </View>

      <Text style={styles.label}>Collections</Text>
      <CollectionPicker selectedIds={collectionIds} onChange={setCollectionIds} />

      <Text style={styles.label}>Note</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="e.g. try the pistachio croissant"
        placeholderTextColor={theme.mutedText}
        multiline
        maxLength={200}
        style={[styles.input, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
      />

      {place.reelUrl ? (
        <Pressable
          onPress={() => openLink(place.reelUrl!)}
          accessibilityRole="button"
          accessibilityLabel="Open reel" // the ▶ symbol is only decoration
          style={[styles.secondaryButton, { borderColor: theme.outline }]}>
          <Text style={styles.secondaryText}>▶ Open reel</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={save}
        disabled={busy}
        accessibilityRole="button"
        style={[styles.saveButton, { backgroundColor: theme.tint, opacity: busy ? 0.6 : 1 }]}>
        <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save changes'}</Text>
      </Pressable>

      <Pressable onPress={confirmDelete} style={styles.deleteButton}>
        <Text style={[styles.deleteText, { color: theme.danger }]}>Delete this place</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  address: { fontSize: 15, marginTop: 4, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 15, fontWeight: '600' },
  switchCard: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  switchText: { flex: 1 },
  switchTitle: { fontSize: 16, fontWeight: '600' },
  switchHint: { fontSize: 13, marginTop: 2 },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  secondaryText: { fontSize: 16, fontWeight: '600' },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  retryButton: { alignSelf: 'stretch', paddingHorizontal: 24, marginTop: 8 },
  saveText: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
  deleteButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  deleteText: { fontSize: 16, fontWeight: '600' },
});
