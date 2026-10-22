import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  CollectionWithCount,
  MAX_COLLECTION_NAME,
  addCollection,
  deleteCollection,
  listCollectionsWithCounts,
  renameCollection,
} from '@/src/db';

// Manage collections: make new ones, rename them, delete them.
// Deleting a collection never deletes the places in it.
export default function CollectionsScreen() {
  const theme = Colors[useColorScheme()];
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const reload = useCallback(async () => {
    try {
      setCollections(await listCollectionsWithCounts());
    } catch {
      setCollections([]);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const create = async () => {
    if (!newName.trim()) return;
    try {
      await addCollection(newName);
      setNewName('');
      await reload();
    } catch {
      Alert.alert('Could not make the collection', 'Please try a different name.');
    }
  };

  const saveRename = async (id: string) => {
    try {
      await renameCollection(id, editName);
      setEditingId(null);
      await reload();
    } catch (error) {
      Alert.alert('Could not rename', error instanceof Error ? error.message : 'Please try a different name.');
    }
  };

  const confirmDelete = (collection: CollectionWithCount) => {
    const places =
      collection.placeCount === 0
        ? 'It has no places in it.'
        : `The ${collection.placeCount} place${collection.placeCount === 1 ? '' : 's'} in it will stay in My Places.`;
    Alert.alert(`Delete "${collection.name}"?`, places, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCollection(collection.id);
          await reload();
        },
      },
    ]);
  };

  return (
    <FlatList
      data={collections}
      keyExtractor={(collection) => collection.id}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <Text style={[styles.intro, { color: theme.mutedText }]}>
            Collections are your own lists, like “Dubai brunch spots” or “Date night”. A place can be in as many as you like.
          </Text>
          <View style={styles.addRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New collection name"
              placeholderTextColor={theme.mutedText}
              maxLength={MAX_COLLECTION_NAME}
              onSubmitEditing={create}
              returnKeyType="done"
              style={[styles.input, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
            />
            <Pressable onPress={create} style={[styles.primaryButton, { backgroundColor: theme.tintStrong }]}>
              <Text style={styles.primaryText}>Add</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: theme.mutedText }]}>No collections yet. Make your first one above.</Text>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {editingId === item.id ? (
            <View lightColor="transparent" darkColor="transparent">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                maxLength={MAX_COLLECTION_NAME}
                autoFocus
                onSubmitEditing={() => saveRename(item.id)}
                returnKeyType="done"
                style={[styles.input, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.background }]}
              />
              <View style={styles.buttons} lightColor="transparent" darkColor="transparent">
                <Pressable onPress={() => setEditingId(null)} style={[styles.button, { borderColor: theme.outline }]}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => saveRename(item.id)}
                  style={[styles.button, { backgroundColor: theme.tintStrong, borderColor: theme.tintStrong }]}>
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View lightColor="transparent" darkColor="transparent">
              <Text style={styles.name}>📁 {item.name}</Text>
              <Text style={{ color: theme.mutedText, marginTop: 2 }}>
                {item.placeCount === 0 ? 'No places yet' : `${item.placeCount} place${item.placeCount === 1 ? '' : 's'}`}
              </Text>
              <View style={styles.buttons} lightColor="transparent" darkColor="transparent">
                <Pressable
                  onPress={() => {
                    setEditingId(item.id);
                    setEditName(item.name);
                  }}
                  style={[styles.button, { borderColor: theme.outline }]}>
                  <Text style={styles.buttonText}>Rename</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(item)} style={[styles.button, { borderColor: theme.outline }]}>
                  <Text style={[styles.buttonText, { color: theme.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 48 },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  primaryButton: { minHeight: 48, minWidth: 72, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 16, fontSize: 15 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  name: { fontSize: 17, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700' },
});
