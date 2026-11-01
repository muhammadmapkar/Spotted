import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, TextInput, View } from '@/components/Themed';
import { Icon } from '@/src/components/icons/Icon';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { CollectionPicker } from '@/src/components/CollectionPicker';
import { Category, addPlace, listPlaces, removeFromInbox, updatePlace } from '@/src/db';
import { newSessionToken } from '@/src/places/google';
import { suggestFromCaption } from '@/src/places/fromCaption';
import { SEARCH_IS_DEMO, getPlaceDetails, searchPlaces } from '@/src/places/search';
import { useUserLocation } from '@/src/location/useUserLocation';
import { reelLinkFromText } from '@/src/share/links';
import { fetchTikTokCaption, isTikTokUrl } from '@/src/share/tiktok';
import { DUBAI_BIAS, PlaceResult, PlaceSuggestion } from '@/src/places/types';

function reelUrlIsTikTok(url: string | undefined): boolean {
  const link = url ? reelLinkFromText(url) : null;
  return Boolean(link && isTikTokUrl(link));
}

// Add Place: 1) search and pick the place, 2) choose category + note, then save.
export default function AddPlaceScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  // When a reel is shared to Spotted, its link arrives here as ?reelUrl=...
  // When it comes from "Reels to sort", inboxId says which one (it leaves that list once saved).
  const params = useLocalSearchParams<{ reelUrl?: string; inboxId?: string }>();
  const userLocation = useUserLocation();
  // Prefer results near the user. Without location, prefer central Dubai.
  const lat = userLocation?.latitude;
  const lon = userLocation?.longitude;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  // The "paste the caption" helper
  const [captionOpen, setCaptionOpen] = useState(Boolean(params.reelUrl)); // open straight away for a shared reel
  const [caption, setCaption] = useState('');
  const [captionBusy, setCaptionBusy] = useState(false);
  const [captionResults, setCaptionResults] = useState<PlaceSuggestion[] | null>(null); // null = not searched yet
  const [captionError, setCaptionError] = useState(false);
  const [readingCaption, setReadingCaption] = useState(false); // fetching a TikTok caption
  // One token per search session: Google bills the typing + final pick as one.
  const sessionToken = useRef(newSessionToken());
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState<Category>('food');
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [reelUrl, setReelUrl] = useState(params.reelUrl ?? '');
  const [saving, setSaving] = useState(false);

  // Prefer results near the user. Without location, prefer central Dubai.
  const currentBias = () =>
    lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon, radiusMeters: 50000 } : DUBAI_BIAS;

  // A TikTok link: ask TikTok's official public service for the caption, then look for the place in it.
  // (Instagram has no official way, so there the user pastes the caption.)
  useEffect(() => {
    const link = params.reelUrl ? reelLinkFromText(params.reelUrl) : null;
    if (!link || !isTikTokUrl(link)) return;
    let cancelled = false;
    setReadingCaption(true);
    fetchTikTokCaption(link).then((text) => {
      if (cancelled) return;
      setReadingCaption(false);
      if (text) {
        setCaption(text);
        findFromCaption(text);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.reelUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search when the user pauses typing (waiting a moment saves Google requests).

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPlaces(query, sessionToken.current, currentBias())
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

  // The place is known (with its map position): show the form to finish saving it.
  const selectPlace = (place: PlaceResult) => {
    setSelected(place);
    if (place.suggestedCategory) setCategory(place.suggestedCategory);
    sessionToken.current = newSessionToken(); // the search session is over, start a new one
  };

  // The user tapped a search result: fetch its full details (map position) then show the form.
  const choose = async (suggestion: PlaceSuggestion) => {
    setLoadingPlace(true);
    try {
      selectPlace(await getPlaceDetails(suggestion, sessionToken.current));
    } catch {
      Alert.alert('Could not load this place', 'Check your internet connection and try again.');
    } finally {
      setLoadingPlace(false);
    }
  };

  // The user pasted a caption (or TikTok gave us one): find the place it is about, and show the best
  // matches to tap. Only short place-name clues are searched. The rest of the caption never leaves the phone.
  const findFromCaption = async (text: string = caption) => {
    if (captionBusy || !text.trim()) return;
    setCaptionBusy(true);
    setCaptionError(false);
    try {
      const { suggestions } = await suggestFromCaption(text, (q) =>
        searchPlaces(q, sessionToken.current, currentBias())
      );
      setCaptionResults(suggestions);
    } catch {
      setCaptionResults(null);
      setCaptionError(true);
    } finally {
      setCaptionBusy(false);
    }
  };

  // One tappable place in a list of results.
  const renderResult = (place: PlaceSuggestion) => (
    <Pressable accessibilityRole="button"
      key={place.googlePlaceId}
      onPress={() => choose(place)}
      style={({ pressed }) => [styles.result, { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }]}>
      <Text style={styles.resultName}>{place.name}</Text>
      <Text style={[styles.resultAddress, { color: theme.mutedText }]}>{place.address}</Text>
    </Pressable>
  );

  // Done with this reel: take it off "Reels to sort" (if it came from there) and go back.
  const finish = async () => {
    if (params.inboxId) await removeFromInbox(params.inboxId).catch(() => {});
    router.back();
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

    // Don't save the same place twice. But if this is a NEW reel for a place you already have,
    // offer to keep the new reel link on it.
    const existing = (await listPlaces()).find((p) => p.googlePlaceId === selected.googlePlaceId);
    if (existing) {
      if (link && link !== existing.reelUrl) {
        Alert.alert('Already saved', `"${selected.name}" is already in your places. Use this reel link for it instead?`, [
          { text: 'No, keep as it is', style: 'cancel', onPress: finish },
          {
            text: 'Use this reel',
            onPress: async () => {
              await updatePlace(existing.id, { reelUrl: link });
              await finish();
            },
          },
        ]);
      } else {
        Alert.alert('Already saved', `"${selected.name}" is already in your places.`);
      }
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
      await finish();
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
          {/* Many reels saved up? Paste them all at once and sort them later. */}
          {!params.reelUrl ? (
            <Pressable
              onPress={() => router.replace('/import-links' as never)}
              accessibilityRole="button"
              style={styles.importLink}>
              <Text style={{ color: theme.tintText, fontWeight: '600' }}>Have lots of reels? Add them all at once</Text>
            </Pressable>
          ) : null}
          {params.reelUrl ? (
            <View style={[styles.attached, { backgroundColor: theme.card }]}>
              <Text style={{ fontWeight: '600' }}>Reel link attached</Text>
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

          {/* Have the caption from Instagram or TikTok? Paste it and Spotted suggests the place. */}
          <Pressable
            onPress={() => setCaptionOpen(!captionOpen)}
            accessibilityRole="button"
            style={[styles.captionToggle, { borderColor: theme.outline }]}>
            <Text style={{ fontWeight: '600' }}>Have the caption? Paste it to find the place</Text>
            <View style={{ transform: [{ rotate: captionOpen ? '180deg' : '0deg' }] }} lightColor="transparent" darkColor="transparent"><Icon name="chevron" size={18} color={theme.mutedText} /></View>
          </Pressable>

          {captionOpen ? (
            <View style={styles.captionBox} lightColor="transparent" darkColor="transparent">
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={
                  reelUrlIsTikTok(params.reelUrl)
                    ? 'We read the TikTok caption for you'
                    : 'Paste the caption here (press and hold, then Paste)'
                }
                placeholderTextColor={theme.mutedText}
                multiline
                style={[styles.input, styles.captionInput, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
              />
              {readingCaption ? (
                <Text style={[styles.hint, { color: theme.mutedText }]}>Reading the TikTok caption…</Text>
              ) : null}
              <Pressable accessibilityRole="button"
                onPress={() => findFromCaption()}
                disabled={captionBusy || !caption.trim()}
                style={[styles.findButton, { backgroundColor: theme.tintStrong, opacity: captionBusy || !caption.trim() ? 0.5 : 1 }]}>
                <Text style={styles.findButtonText}>{captionBusy ? 'Looking…' : 'Find the place'}</Text>
              </Pressable>
              <Text style={[styles.hint, { color: theme.mutedText }]}>
                Only the place name is searched. The rest of the caption stays on your phone.
              </Text>

              {captionError ? (
                <Text style={[styles.hint, { color: theme.danger }]}>
                  Could not search right now. Check your internet connection and try again.
                </Text>
              ) : null}
              {captionResults && captionResults.length === 0 ? (
                <Text style={[styles.hint, { color: theme.mutedText }]}>
                  We could not find a place in that caption. Try the search box instead.
                </Text>
              ) : null}
              {captionResults && captionResults.length > 0 ? (
                <View lightColor="transparent" darkColor="transparent">
                  <Text style={[styles.label, { marginTop: 8 }]}>Best matches. Tap the right one</Text>
                  {captionResults.map(renderResult)}
                </View>
              ) : null}
            </View>
          ) : null}

          {results.map(renderResult)}

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
            <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={styles.changeButton}>
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
                    {CATEGORIES[key].label}
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

          <Pressable accessibilityRole="button"
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
  captionToggle: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  captionBox: { marginTop: 8 },
  captionInput: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' },
  findButton: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  findButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  attached: { borderRadius: 14, padding: 14, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  hint: { fontSize: 13, marginTop: 8, marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  importLink: { minHeight: 44, justifyContent: 'center', marginTop: 8 },
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
