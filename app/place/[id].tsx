import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Switch, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES } from '@/src/categories';
import { CollectionPicker } from '@/src/components/CollectionPicker';
import { Category, Rating, SavedPlace, deletePlace, getPlace, updatePlace } from '@/src/db';
import { cancelTimedReminder, scheduleTimedReminder } from '@/src/geofence/notify';
import { openReel } from '@/src/openLink';
import { requestNotifications } from '@/src/permissions';
import { formatReminderTime, hasUpcomingReminder, timeChoices } from '@/src/reminderTimes';
import { placeShareText } from '@/src/sharePlace';

// The two answers to "How was it?" after a visit.
const RATING_OPTIONS: { value: Rating; emoji: string; label: string }[] = [
  { value: 1, emoji: '👍', label: 'Loved it' },
  { value: -1, emoji: '👎', label: 'Not for me' },
];

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
  const [rating, setRating] = useState<Rating | undefined>(undefined);

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
        setRating(found.rating);
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
        rating: visited ? rating : undefined, // a rating only makes sense after a visit
      });
      router.back();
    } catch {
      setBusy(false);
      Alert.alert('Could not save', 'Your changes were not saved. Please try again.');
    }
  };

  // Opens the phone's normal share sheet (WhatsApp, Messages, ...) with the place details.
  // "Remind me at a time": set straight away (no need to press Save), so it can't be forgotten.
  const setTimedReminder = async (date: Date) => {
    if (!place) return;
    try {
      if (!(await requestNotifications())) {
        Alert.alert('Notifications are off', 'Allow notifications for Spotted in your phone settings to get this reminder.');
        return;
      }
      await cancelTimedReminder(place.remindNotificationId); // only one timed reminder per place
      const notificationId = await scheduleTimedReminder(place, date);
      const changes = { remindAt: date.toISOString(), remindNotificationId: notificationId };
      await updatePlace(place.id, changes);
      setPlace({ ...place, ...changes });
    } catch {
      Alert.alert('Could not set the reminder', 'Please try again.');
    }
  };

  const clearTimedReminder = async () => {
    if (!place) return;
    try {
      await cancelTimedReminder(place.remindNotificationId);
      await updatePlace(place.id, { remindAt: undefined, remindNotificationId: undefined });
      setPlace({ ...place, remindAt: undefined, remindNotificationId: undefined });
    } catch {
      Alert.alert('Could not cancel the reminder', 'Please try again.');
    }
  };

  const sharePlace = async () => {
    if (!place) return;
    try {
      // Share what is saved. If the user typed a new note but has not saved it yet, use that note.
      await Share.share({ message: placeShareText({ ...place, note: note.trim() || undefined }) });
    } catch {
      Alert.alert('Could not share', 'Your phone could not open the share menu. Please try again.');
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
            await cancelTimedReminder(place?.remindNotificationId);
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

      {/* Remind me at a time: ready-made choices, or the reminder that is already set */}
      <Text style={styles.label}>Remind me at a time</Text>
      {hasUpcomingReminder(place.remindAt, new Date()) ? (
        <View style={[styles.switchCard, styles.timedRow, { backgroundColor: theme.card }]}>
          <Text style={[styles.switchTitle, { flex: 1 }]}>⏰ {formatReminderTime(new Date(place.remindAt!))}</Text>
          <Pressable
            onPress={clearTimedReminder}
            accessibilityRole="button"
            accessibilityLabel="Cancel the timed reminder"
            style={styles.timedCancel}>
            <Text style={{ color: theme.danger, fontWeight: '700' }}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          {timeChoices(new Date()).map((choice) => (
            <Pressable
              key={choice.label}
              onPress={() => setTimedReminder(choice.date)}
              accessibilityRole="button"
              accessibilityLabel={`Remind me ${choice.label}`}
              style={[styles.chip, { borderColor: theme.outline }]}>
              <Text style={styles.chipText}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* After a visit: a quick thumbs up or down. Tap the chosen one again to clear it. */}
      {visited ? (
        <>
          <Text style={styles.label}>How was it?</Text>
          <View style={styles.row}>
            {RATING_OPTIONS.map((option) => {
              const selected = rating === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setRating(selected ? undefined : option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.label}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? theme.tint : 'transparent',
                      borderColor: selected ? theme.tint : theme.outline,
                    },
                  ]}>
                  <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]}>
                    {option.emoji} {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

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
          onPress={() => openReel(place, () => setPlace({ ...place, reelUrl: undefined }))}
          accessibilityRole="button"
          accessibilityLabel="Open reel" // the ▶ symbol is only decoration
          style={[styles.secondaryButton, { borderColor: theme.outline }]}>
          <Text style={styles.secondaryText}>▶ Open reel</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={sharePlace}
        accessibilityRole="button"
        accessibilityLabel="Share this place"
        style={[styles.secondaryButton, { borderColor: theme.outline }]}>
        <Text style={styles.secondaryText}>Share place</Text>
      </Pressable>

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
  timedRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  timedCancel: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
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
