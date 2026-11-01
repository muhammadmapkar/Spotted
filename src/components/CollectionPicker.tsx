import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { Text, TextInput, View } from '@/components/Themed';
import { Icon } from '@/src/components/icons/Icon';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Collection, MAX_COLLECTION_NAME, addCollection, listCollections } from '@/src/db';

// Lets the user pick which of their collections a place belongs to (none, one, or several),
// and make a brand new collection on the spot.
export function CollectionPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const theme = Colors[useColorScheme()];
  const [collections, setCollections] = useState<Collection[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    try {
      setCollections(await listCollections());
    } catch {
      setCollections([]); // if loading fails, just show no collections
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  // Make the new collection, and tick it straight away.
  const create = async () => {
    if (!newName.trim()) return;
    try {
      const made = await addCollection(newName);
      await load();
      if (!selectedIds.includes(made.id)) onChange([...selectedIds, made.id]);
      setNewName('');
      setAdding(false);
    } catch {
      Alert.alert('Could not make the collection', 'Please try a different name.');
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {collections.map((collection) => {
          const selected = selectedIds.includes(collection.id);
          return (
            <Pressable
              key={collection.id}
              onPress={() => toggle(collection.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.tintStrong : 'transparent',
                  borderColor: selected ? theme.tintStrong : theme.outline,
                },
              ]}>
              {selected ? <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} /> : null}
              <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]} numberOfLines={1}>
                {collection.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setAdding(!adding)}
          accessibilityRole="button"
          accessibilityLabel="New collection"
          style={[styles.chip, { borderColor: theme.outline, borderStyle: 'dashed' }]}>
          <Text style={[styles.chipText, { color: theme.text }]}>+ New collection</Text>
        </Pressable>
      </View>

      {adding ? (
        <View style={styles.addRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Dubai brunch spots"
            placeholderTextColor={theme.mutedText}
            maxLength={MAX_COLLECTION_NAME}
            autoFocus
            onSubmitEditing={create}
            returnKeyType="done"
            style={[styles.input, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
          />
          <Pressable accessibilityRole="button" onPress={create} style={[styles.addButton, { backgroundColor: theme.tintStrong }]}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      ) : null}

      {collections.length === 0 && !adding ? (
        <Text style={[styles.hint, { color: theme.mutedText }]}>
          Collections are your own lists, like “Date night”. Tap “New collection” to make one.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', gap: 6,
    minHeight: 44,
    maxWidth: '100%',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 15, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  addButton: { minHeight: 48, minWidth: 72, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13, marginTop: 8 },
});
