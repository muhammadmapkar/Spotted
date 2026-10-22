import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, TextInput, View } from '@/components/Themed';
import { Icon } from '@/src/components/icons/Icon';
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
  const [category, setCategory] = useState<Category>('food');
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // Load the place when the screen opens.
  useEffect(() => {
    getPlace(id).then((found) => {
      if (!found) return setNotFound(true);
      setPlace(found);
      setCategory(found.category);
      setNote(found.note ?? '');
      setCollectionIds(found.collectionIds);
    });
  }, [id]);

  const save = async () => {
    await updatePlace(id, { category, note: note.trim() || undefined, collectionIds });
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert('Delete this place?', `"${place?.name}" will be removed from Spotted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePlace(id);
          router.back();
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
  if (!place) return <View style={styles.center} />; // still loading

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
                {CATEGORIES[key].label}
              </Text>
            </Pressable>
          );
        })}
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
        <Pressable accessibilityRole="button"
          onPress={() => openLink(place.reelUrl!)}
          style={[styles.secondaryButton, { borderColor: theme.outline }]}>
          <Icon name="play" size={16} color={theme.text} />
          <Text style={styles.secondaryText}>Open reel</Text>
        </Pressable>
      ) : null}

      <Pressable accessibilityRole="button" onPress={save} style={[styles.saveButton, { backgroundColor: theme.tint }]}>
        <Text style={styles.saveText}>Save changes</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.deleteButton}>
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
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  secondaryButton: { flexDirection: 'row', gap: 6,
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
  saveText: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
  deleteButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  deleteText: { fontSize: 16, fontWeight: '600' },
});
