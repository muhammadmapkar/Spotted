import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { Category, addPlace, listPlaces } from '@/src/db';
import { PlaceResult } from '@/src/places/types';
import { SEARCH_IS_DEMO, searchPlaces } from '@/src/places/search';

// Add Place: 1) search and pick the place, 2) choose category + note, then save.
export default function AddPlaceScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  // When a reel is shared to Spotted, its link arrives here as ?reelUrl=...
  const params = useLocalSearchParams<{ reelUrl?: string }>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState<Category>('food');
  const [note, setNote] = useState('');
  const [reelUrl, setReelUrl] = useState(params.reelUrl ?? '');
  const [saving, setSaving] = useState(false);

  // Search again every time the text changes.
  useEffect(() => {
    let cancelled = false;
    searchPlaces(query).then((found) => {
      if (!cancelled) setResults(found);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const choose = (place: PlaceResult) => {
    setSelected(place);
    if (place.suggestedCategory) setCategory(place.suggestedCategory);
  };

  const save = async () => {
    if (!selected || saving) return;

    const link = reelUrl.trim();
    if (link && !/^https?:\/\//i.test(link)) {
      Alert.alert('Check the reel link', 'The link should start with http:// or https://');
      return;
    }

    // Don't save the same place twice.
    const existing = await listPlaces();
    if (existing.some((p) => p.googlePlaceId === selected.googlePlaceId)) {
      Alert.alert('Already saved', `"${selected.name}" is already in your places.`);
      return;
    }

    setSaving(true);
    try {
      await addPlace({
        googlePlaceId: selected.googlePlaceId,
        name: selected.name,
        address: selected.address,
        latitude: selected.latitude,
        longitude: selected.longitude,
        category,
        note: note.trim() || undefined,
        reelUrl: link || undefined,
      });
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Could not save', 'Something went wrong. Please try again.');
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Add place' }} />

      {!selected ? (
        <>
          <Text style={styles.label}>Which place is it?</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a place"
            placeholderTextColor={theme.mutedText}
            autoFocus
            autoCorrect={false}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          />
          {SEARCH_IS_DEMO ? (
            <Text style={[styles.hint, { color: theme.mutedText }]}>
              Demo search: a small list of Dubai places. Try “mall”, “beach” or “tea”.
            </Text>
          ) : null}

          {results.map((place) => (
            <Pressable
              key={place.googlePlaceId}
              onPress={() => choose(place)}
              style={({ pressed }) => [
                styles.result,
                { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Text style={styles.resultName}>{place.name}</Text>
              <Text style={[styles.resultAddress, { color: theme.mutedText }]}>{place.address}</Text>
            </Pressable>
          ))}

          {query.trim() && results.length === 0 ? (
            <Text style={[styles.hint, { color: theme.mutedText }]}>No places found. Try another word.</Text>
          ) : null}
        </>
      ) : (
        <>
          <View style={[styles.chosen, { backgroundColor: theme.card }]}>
            <View style={styles.chosenText} lightColor="transparent" darkColor="transparent">
              <Text style={styles.resultName}>{selected.name}</Text>
              <Text style={[styles.resultAddress, { color: theme.mutedText }]}>{selected.address}</Text>
            </View>
            <Pressable onPress={() => setSelected(null)} style={styles.changeButton}>
              <Text style={{ color: theme.tint, fontWeight: '600' }}>Change</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.row}>
            {(Object.keys(CATEGORIES) as Category[]).map((key) => {
              const isSelected = key === category;
              return (
                <Pressable
                  key={key}
                  onPress={() => setCategory(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? CATEGORIES[key].color : 'transparent',
                      borderColor: isSelected ? CATEGORIES[key].color : theme.border,
                    },
                  ]}>
                  <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                    {CATEGORIES[key].emoji} {CATEGORIES[key].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. try the pistachio croissant"
            placeholderTextColor={theme.mutedText}
            multiline
            maxLength={200}
            style={[styles.input, styles.noteInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          />

          <Text style={styles.label}>Reel link (optional)</Text>
          <TextInput
            value={reelUrl}
            onChangeText={setReelUrl}
            placeholder="https://www.instagram.com/reel/..."
            placeholderTextColor={theme.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          />

          <Pressable
            onPress={save}
            disabled={saving}
            style={[styles.saveButton, { backgroundColor: theme.tint, opacity: saving ? 0.6 : 1 }]}>
            <Text style={styles.saveText}>Save place</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  hint: { fontSize: 13, marginTop: 8, marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  noteInput: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  result: { borderRadius: 14, padding: 16, marginTop: 8, minHeight: 64, justifyContent: 'center' },
  resultName: { fontSize: 17, fontWeight: '700' },
  resultAddress: { fontSize: 14, marginTop: 2 },
  chosen: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16 },
  chosenText: { flex: 1 },
  changeButton: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
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
  saveButton: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  saveText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
