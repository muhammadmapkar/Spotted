import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { CollectionPicker } from '@/src/components/CollectionPicker';
import { Category, addPlace, listPlaces } from '@/src/db';
import { newSessionToken } from '@/src/places/google';
import { SEARCH_IS_DEMO, getPlaceDetails, searchPlaces } from '@/src/places/search';
import { useUserLocation } from '@/src/location/useUserLocation';
import { reelLinkFromText } from '@/src/share/links';
import { DUBAI_BIAS, PlaceResult, PlaceSuggestion } from '@/src/places/types';

// Add Place: 1) search and pick the place, 2) choose category + note, then save.
export default function AddPlaceScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  // When a reel is shared to Spotted, its link arrives here as ?reelUrl=...
  const params = useLocalSearchParams<{ reelUrl?: string }>();
  const userLocation = useUserLocation();
  // Prefer results near the user. Without location, prefer central Dubai.
  const lat = userLocation?.latitude;
  const lon = userLocation?.longitude;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  // One token per search session: Google bills the typing + final pick as one.
  const sessionToken = useRef(newSessionToken());
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState<Category>('food');
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [reelUrl, setReelUrl] = useState(params.reelUrl ?? '');
  const [saving, setSaving] = useState(false);

  // Search when the user pauses typing (waiting a moment saves Google requests).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const bias = lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon, radiusMeters: 50000 } : DUBAI_BIAS;
      searchPlaces(query, sessionToken.current, bias)
        .then((found) => {
          if (cancelled) return;
          setResults(found);
          setSearchError(false);
        })
        .catch(() => {
          if (!cancelled) setSearchError(true);
        });
    }, SEARCH_IS_DEMO ? 0 : 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, lat, lon]);

  // The user tapped a result: fetch its full details (map position) then show the form.
  const choose = async (suggestion: PlaceSuggestion) => {
    setLoadingPlace(true);
    try {
      const place = await getPlaceDetails(suggestion, sessionToken.current);
      setSelected(place);
      if (place.suggestedCategory) setCategory(place.suggestedCategory);
      sessionToken.current = newSessionToken(); // the session is over, start a new one
    } catch {
      Alert.alert('Could not load this place', 'Check your internet connection and try again.');
    } finally {
      setLoadingPlace(false);
    }
  };

  const save = async () => {
    if (!selected || saving) return;

    // The field may contain a whole pasted message: pick out the link and tidy it.
    const typed = reelUrl.trim();
    const link = typed ? reelLinkFromText(typed) : null;
    if (typed && !link) {
      Alert.alert('Check the reel link', 'We could not find a link there. Paste the full link, starting with https://');
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
        reelUrl: link ?? undefined,
        collectionIds,
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
          {params.reelUrl ? (
            <View style={[styles.attached, { backgroundColor: theme.card }]}>
              <Text style={{ fontWeight: '600' }}>🔗 Reel link attached</Text>
              <Text style={{ color: theme.mutedText, fontSize: 13 }} numberOfLines={1}>
                {params.reelUrl}
              </Text>
            </View>
          ) : null}
          <Text style={styles.label}>Which place is it?</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a place"
            placeholderTextColor={theme.mutedText}
            autoFocus
            autoCorrect={false}
            style={[styles.input, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
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

          {searchError ? (
            <Text style={[styles.hint, { color: theme.mutedText }]}>
              Search is not available right now. Check your internet connection.
            </Text>
          ) : null}

          {loadingPlace ? <Text style={[styles.hint, { color: theme.mutedText }]}>Loading…</Text> : null}

          {!searchError && (SEARCH_IS_DEMO || query.trim().length >= 3) && results.length === 0 && query.trim() ? (
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
              <Text style={{ color: theme.tintText, fontWeight: '600' }}>Change</Text>
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
                      backgroundColor: isSelected ? CATEGORIES[key].strongColor : 'transparent',
                      borderColor: isSelected ? CATEGORIES[key].strongColor : theme.outline,
                    },
                  ]}>
                  <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                    {CATEGORIES[key].emoji} {CATEGORIES[key].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Save to collection (optional)</Text>
          <CollectionPicker selectedIds={collectionIds} onChange={setCollectionIds} />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. try the pistachio croissant"
            placeholderTextColor={theme.mutedText}
            multiline
            maxLength={200}
            style={[styles.input, styles.noteInput, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
          />

          <Text style={styles.label}>Reel link (optional)</Text>
          <Text style={[styles.hint, { color: theme.mutedText, marginTop: -4 }]}>
            Copy the link in Instagram, then press and hold here and choose Paste.
          </Text>
          <TextInput
            value={reelUrl}
            onChangeText={setReelUrl}
            placeholder="https://www.instagram.com/reel/..."
            placeholderTextColor={theme.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[styles.input, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
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
  attached: { borderRadius: 14, padding: 14, marginBottom: 4 },
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
  saveText: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
});
