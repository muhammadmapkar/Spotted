import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { InboxReel, addToInbox, listInbox, removeFromInbox } from '@/src/db';
import { extractAllReelLinks } from '@/src/share/links';

// "Add many reels at once": paste lots of reel links, then turn them into places one by one.
// The user still confirms each place in Add Place. We never guess a place without asking.
export default function ImportLinksScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  const [text, setText] = useState('');
  const [inbox, setInbox] = useState<InboxReel[]>([]);

  // Reload the waiting list every time this screen is shown (e.g. after saving one in Add Place).
  const reload = useCallback(() => {
    listInbox().then(setInbox).catch(() => setInbox([]));
  }, []);
  useFocusEffect(reload);

  const found = extractAllReelLinks(text);

  const addAll = async () => {
    try {
      const added = await addToInbox(found);
      setText('');
      reload();
      const skipped = found.length - added;
      Alert.alert(
        `${added} ${added === 1 ? 'reel' : 'reels'} added`,
        skipped ? `${skipped} skipped because ${skipped === 1 ? 'it was' : 'they were'} already in Spotted.` : undefined
      );
    } catch {
      Alert.alert('Could not add the links', 'Please try again.');
    }
  };

  // Open Add Place with this link. Add Place takes it off the list once the place is saved.
  const sort = (reel: InboxReel) =>
    router.push({ pathname: '/add-place', params: { reelUrl: reel.url, inboxId: reel.id } } as never);

  const remove = async (reel: InboxReel) => {
    try {
      await removeFromInbox(reel.id);
      reload();
    } catch {
      Alert.alert('Could not remove it', 'Please try again.');
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Add many reels' }} />

      <Text style={styles.label}>Paste your reel links</Text>
      <Text style={[styles.hint, { color: theme.mutedText }]}>
        Paste as many Instagram or TikTok links as you like, for example from your notes or a chat with yourself.
      </Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={'https://www.instagram.com/reel/...\nhttps://www.tiktok.com/...'}
        placeholderTextColor={theme.mutedText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Paste your reel links"
        style={[styles.input, { color: theme.text, borderColor: theme.outline, backgroundColor: theme.card }]}
      />
      <Pressable
        onPress={addAll}
        disabled={found.length === 0}
        accessibilityRole="button"
        style={[styles.addButton, { backgroundColor: theme.tint, opacity: found.length === 0 ? 0.4 : 1 }]}>
        <Text style={styles.addText}>
          {found.length === 0 ? 'No links found yet' : `Add ${found.length} ${found.length === 1 ? 'link' : 'links'}`}
        </Text>
      </Pressable>

      <Text style={styles.label}>Reels to sort ({inbox.length})</Text>
      {inbox.length === 0 ? (
        <Text style={[styles.hint, { color: theme.mutedText }]}>Nothing waiting. Paste some links above.</Text>
      ) : (
        <Text style={[styles.hint, { color: theme.mutedText }]}>
          Tap a reel to choose its place. It leaves this list once it is saved.
        </Text>
      )}
      {inbox.map((reel, index) => (
        <View key={reel.id} style={[styles.row, { backgroundColor: theme.card }]}>
          <Pressable
            onPress={() => sort(reel)}
            accessibilityRole="button"
            accessibilityLabel={`Choose the place for reel ${index + 1}`}
            style={styles.rowMain}>
            <Text style={styles.rowTitle}>Reel {index + 1}</Text>
            <Text style={[styles.rowUrl, { color: theme.mutedText }]} numberOfLines={1}>
              {reel.url}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => remove(reel)}
            accessibilityRole="button"
            accessibilityLabel={`Remove reel ${index + 1} from the list`}
            style={styles.removeButton}>
            <Text style={{ color: theme.danger, fontSize: 18, fontWeight: '700' }}>✕</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  hint: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  input: { minHeight: 120, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, textAlignVertical: 'top' },
  addButton: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  addText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, marginTop: 8, paddingLeft: 16 },
  rowMain: { flex: 1, minHeight: 64, justifyContent: 'center', paddingVertical: 8 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowUrl: { fontSize: 13, marginTop: 2 },
  removeButton: { width: 56, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
});
