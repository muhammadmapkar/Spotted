import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useStore } from '../src/store';
import { font, radius, space, useTheme } from '../src/theme';
import { Button, T } from '../src/ui';

// Opened normally it lists your lists. Opened with ?addPlace=<id> it adds or removes that place when you tap a list.
export default function Lists() {
  const c = useTheme();
  const router = useRouter();
  const { addPlace } = useLocalSearchParams<{ addPlace?: string }>();
  const { lists, createList, toggleInList } = useStore();
  const [name, setName] = useState('');

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <TextInput accessibilityLabel="New list name" placeholder="New list, e.g. Best brunch in Bandra" placeholderTextColor={c.muted} value={name} onChangeText={setName}
          style={{ flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md, fontFamily: font.regular, color: c.text }} />
        <Button label="Create" disabled={!name.trim()} onPress={() => { const id = createList(name); setName(''); if (addPlace) toggleInList(id, addPlace); }} />
      </View>
      <FlatList data={lists} keyExtractor={(l) => l.id} contentContainerStyle={{ gap: space.sm }}
        ListEmptyComponent={<T style={{ color: c.muted, textAlign: 'center' }}>No lists yet. Make one above.</T>}
        renderItem={({ item }) => {
          const has = !!addPlace && item.placeIds.includes(addPlace);
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={addPlace ? `Toggle in ${item.name}` : `Open ${item.name}`}
              onPress={() => addPlace ? toggleInList(item.id, addPlace) : router.push(`/list/${item.id}`)}
              style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.surface, borderRadius: radius.md, paddingHorizontal: space.md }}>
              <Ionicons name={has ? 'checkmark-circle' : 'list'} size={22} color={has ? c.visit : c.primary} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.semi }}>{item.name}</T>
                <T style={{ fontSize: 12, color: c.muted }}>{item.placeIds.length} places</T>
              </View>
              {!addPlace && <Ionicons name="chevron-forward" size={18} color={c.muted} />}
            </Pressable>
          );
        }} />
      {addPlace && <Button label="Done" kind="ghost" onPress={() => router.back()} />}
    </View>
  );
}
