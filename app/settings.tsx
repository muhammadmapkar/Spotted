import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SUPPORT_EMAIL } from '@/src/config';
import { resetSaved } from '@/src/state/saved';
import { DEFAULT_SETTINGS, Settings, deleteAllData, getSettings, listPlaces, saveSettings } from '@/src/db';
import { placeById } from '@/src/data/mock';
import { savedVenueIds } from '@/src/geofence/catalogue';
import { cancelAllReminders, sendNearbyNotification, sendVenueAlert } from '@/src/geofence/notify';
import { getReminderStatus } from '@/src/geofence/sync';
import { useOnboarding } from '@/src/onboarding/OnboardingContext';
import { useAuth } from '@/src/auth/AuthContext';
import { openPrivacyPolicy } from '@/src/legal';
import { addMinutes } from '@/src/settings/time';

const RADIUS_OPTIONS: { value: Settings['radiusMeters']; label: string }[] = [
  { value: 200, label: '200 m' },
  { value: 300, label: '300 m' },
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
];

// The Settings tab: reminders, radius, quiet hours, delete data, and links.
export default function SettingsScreen() {
  const theme = Colors[useColorScheme()];
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const { restart } = useOnboarding();
  const { signOut, clearLocal } = useAuth();
  const router = useRouter();

  // Load the saved settings every time this tab is shown.
  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings).catch(() => setSettings(DEFAULT_SETTINGS));
    }, [])
  );

  // Change one or more settings: show it straight away, and save it on the phone.
  const change = (changes: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...changes }));
    saveSettings(changes);
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete all my data?',
      'This removes every saved place and resets your settings. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await deleteAllData();
            resetSaved(); // the saved places on Home and the Saved tab go back to the starting list
            await cancelAllReminders();
            clearLocal(); // the saved profile is erased too, so the user is signed out
            setSettings(await getSettings());
            Alert.alert('Done', 'All your data has been deleted from this phone.');
          },
        },
      ]
    );
  };

  const contactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Spotted%20support`).catch(() =>
      Alert.alert('No email app found', `You can write to us at ${SUPPORT_EMAIL}`)
    );
  };

  // The radius and quiet-hours controls are greyed out when reminders are off.
  const remindersOff = !settings.remindersEnabled;

  // Testing helper: sends the "You're near ..." notification after 5 seconds,
  // so you have time to close the app and see the real thing arrive.
  const sendTestReminder = async () => {
    const [place] = await listPlaces();
    const [venueId] = await savedVenueIds();
    const venue = placeById(venueId ?? '');
    if (!place && !venue) {
      Alert.alert('Save a place first', 'The test reminder uses one of your saved places.');
      return;
    }
    // Your newest place saved from a reel, or else the first saved Spotted place.
    if (place) await sendNearbyNotification(place, 300, 5);
    else if (venue) await sendVenueAlert(venue, 1200, 5);
    Alert.alert('Test reminder', 'It arrives in 5 seconds. Close the app to see it like a real reminder, then tap it. (If you keep the app open, the banner slides down from the top.)');
  };

  // Testing helper: shows what the reminder system is doing right now.
  const showReminderStatus = async () => {
    Alert.alert('Reminder status', await getReminderStatus());
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      {/* Reminders */}
      <Text style={styles.sectionTitle}>Reminders</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.row} lightColor="transparent" darkColor="transparent">
          <View style={styles.rowText} lightColor="transparent" darkColor="transparent">
            <Text style={styles.rowTitle}>Nearby reminders</Text>
            <Text style={[styles.rowHint, { color: theme.mutedText }]}>
              Get a notification when you are near a saved place.
            </Text>
          </View>
          <Switch
            value={settings.remindersEnabled}
            onValueChange={(value) => change({ remindersEnabled: value })}
            trackColor={{ true: theme.tint }}
          />
        </View>
      </View>

      {/* Radius */}
      <Text style={styles.sectionTitle}>How close counts as “near”?</Text>
      <View style={[styles.card, { backgroundColor: theme.card, opacity: remindersOff ? 0.5 : 1 }]}>
        <View style={styles.chips} lightColor="transparent" darkColor="transparent">
          {RADIUS_OPTIONS.map((option) => {
            const selected = option.value === settings.radiusMeters;
            return (
              <Pressable
                key={option.value}
                disabled={remindersOff}
                onPress={() => change({ radiusMeters: option.value })}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? theme.tintStrong : 'transparent',
                    borderColor: selected ? theme.tintStrong : theme.outline,
                  },
                ]}>
                <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Quiet hours */}
      <Text style={styles.sectionTitle}>Quiet hours</Text>
      <View style={[styles.card, { backgroundColor: theme.card, opacity: remindersOff ? 0.5 : 1 }]}>
        <View style={styles.row} lightColor="transparent" darkColor="transparent">
          <View style={styles.rowText} lightColor="transparent" darkColor="transparent">
            <Text style={styles.rowTitle}>No notifications at night</Text>
            <Text style={[styles.rowHint, { color: theme.mutedText }]}>
              Spotted stays silent between these times.
            </Text>
          </View>
          <Switch
            value={settings.quietHoursEnabled}
            disabled={remindersOff}
            onValueChange={(value) => change({ quietHoursEnabled: value })}
            trackColor={{ true: theme.tint }}
          />
        </View>

        <View
          style={{ opacity: settings.quietHoursEnabled && !remindersOff ? 1 : 0.4 }}
          pointerEvents={settings.quietHoursEnabled && !remindersOff ? 'auto' : 'none'}
          lightColor="transparent"
          darkColor="transparent">
          <TimeStepper
            label="From"
            time={settings.quietStart}
            onChange={(time) => change({ quietStart: time })}
          />
          <TimeStepper
            label="Until"
            time={settings.quietEnd}
            onChange={(time) => change({ quietEnd: time })}
          />
        </View>
      </View>

      {/* Collections */}
      <Text style={styles.sectionTitle}>Collections</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <LinkRow label="Manage collections" onPress={() => router.push('/collections' as never)} />
      </View>

      {/* Privacy and help */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <LinkRow label="Privacy policy" onPress={openPrivacyPolicy} />
        <LinkRow label="Contact support" onPress={contactSupport} />
      </View>

      <Pressable onPress={confirmDeleteAll} style={styles.deleteButton}>
        <Text style={[styles.deleteText, { color: theme.danger }]}>Delete all my data</Text>
      </Pressable>
      <Text style={[styles.footer, { color: theme.mutedText }]}>
        Your places and settings are stored only on this phone.
      </Text>

      {/* Testing helper. Only appears while developing, never in the store app. */}
      {__DEV__ ? (
        <View lightColor="transparent" darkColor="transparent">
          <Pressable onPress={sendTestReminder} style={[styles.devButton, { borderColor: theme.outline }]}>
            <Text style={{ fontWeight: '600' }}>Testing: send a test reminder</Text>
          </Pressable>
          <Pressable onPress={showReminderStatus} style={[styles.devButton, { borderColor: theme.outline, marginTop: 8 }]}>
            <Text style={{ fontWeight: '600' }}>Testing: check reminder status</Text>
          </Pressable>
          <Pressable onPress={restart} style={[styles.devButton, { borderColor: theme.outline, marginTop: 8 }]}>
            <Text style={{ fontWeight: '600' }}>Testing: show welcome screens again</Text>
          </Pressable>
          <Pressable onPress={signOut} style={[styles.devButton, { borderColor: theme.outline, marginTop: 8 }]}>
            <Text style={{ fontWeight: '600' }}>Testing: sign out</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

// A time with − and + buttons that move it by 30 minutes.
function TimeStepper({
  label,
  time,
  onChange,
}: {
  label: string;
  time: string;
  onChange: (time: string) => void;
}) {
  const theme = Colors[useColorScheme()];
  return (
    <View style={styles.stepperRow} lightColor="transparent" darkColor="transparent">
      <Text style={styles.rowTitle}>{label}</Text>
      <View style={styles.stepper} lightColor="transparent" darkColor="transparent">
        <Pressable
          onPress={() => onChange(addMinutes(time, -30))}
          accessibilityLabel={`${label} earlier by 30 minutes`}
          style={[styles.stepButton, { borderColor: theme.outline }]}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.time}>{time}</Text>
        <Pressable
          onPress={() => onChange(addMinutes(time, 30))}
          accessibilityLabel={`${label} later by 30 minutes`}
          style={[styles.stepButton, { borderColor: theme.outline }]}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = Colors[useColorScheme()];
  return (
    <Pressable onPress={onPress} style={styles.linkRow} accessibilityRole="link">
      <Text style={styles.rowTitle}>{label}</Text>
      <Text style={{ color: theme.mutedText, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 8, marginLeft: 4, opacity: 0.7 },
  card: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 64, gap: 12 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowHint: { fontSize: 13, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 },
  chip: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 15, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 60 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 24, lineHeight: 28 },
  time: { fontSize: 18, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  deleteButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  deleteText: { fontSize: 16, fontWeight: '700' },
  devButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  footer: { fontSize: 13, textAlign: 'center', marginTop: 4 },
});
