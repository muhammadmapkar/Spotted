import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '@/src/config';
import { DEFAULT_SETTINGS, Settings, deleteAllData, getSettings, listPlaces, saveSettings } from '@/src/db';
import { cancelAllReminders, sendNearbyNotification } from '@/src/geofence/notify';
import { getReminderStatus } from '@/src/geofence/sync';
import { useOnboarding } from '@/src/onboarding/OnboardingContext';
import { openLink } from '@/src/openLink';
import { addMinutes } from '@/src/settings/time';

const RADIUS_OPTIONS: { value: Settings['radiusMeters']; label: string }[] = [
  { value: 200, label: '200 m' },
  { value: 300, label: '300 m' },
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
];

const DAILY_LIMIT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 0, label: 'No limit' },
];

// The Settings tab: reminders, radius, quiet hours, delete data, and links.
export default function SettingsScreen() {
  const theme = Colors[useColorScheme()];
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const { restart } = useOnboarding();
  const router = useRouter();

  // Load the saved settings every time this tab is shown.
  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings).catch(() => setSettings(DEFAULT_SETTINGS));
    }, [])
  );

  // Change one or more settings: show it straight away, and save it on the phone.
  // If saving fails, we put the screen back to what is really saved and tell the user.
  const change = async (changes: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...changes }));
    try {
      await saveSettings(changes);
    } catch {
      setSettings(await getSettings().catch(() => DEFAULT_SETTINGS));
      Alert.alert('Could not save', 'Your setting was not saved. Please try again.');
    }
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
            try {
              await deleteAllData();
              await cancelAllReminders();
              setSettings(await getSettings());
              Alert.alert('Done', 'All your data has been deleted from this phone.');
            } catch {
              Alert.alert('Could not delete everything', 'Some data may still be on this phone. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    if (PRIVACY_POLICY_URL) openLink(PRIVACY_POLICY_URL);
    else Alert.alert('Privacy policy', 'Our privacy policy page is coming soon.');
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
    try {
      const [place] = await listPlaces();
      if (!place) {
        Alert.alert('Save a place first', 'The test reminder uses your newest saved place.');
        return;
      }
      await sendNearbyNotification(place, 5);
      Alert.alert('Test reminder', 'It arrives in 5 seconds. Close the app to see it like a real reminder, then tap it.');
    } catch {
      Alert.alert('Test reminder failed', 'Could not send the test reminder. Are notifications allowed for Spotted?');
    }
  };

  // Testing helper: shows what the reminder system is doing right now.
  const showReminderStatus = async () => {
    try {
      Alert.alert('Reminder status', await getReminderStatus());
    } catch {
      Alert.alert('Reminder status', 'Could not check the reminder status.');
    }
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
            accessibilityLabel="Nearby reminders"
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

      {/* Daily limit */}
      <Text style={styles.sectionTitle}>Most reminders per day</Text>
      <View style={[styles.card, { backgroundColor: theme.card, opacity: remindersOff ? 0.5 : 1 }]}>
        <View style={styles.chips} lightColor="transparent" darkColor="transparent">
          {DAILY_LIMIT_OPTIONS.map((option) => {
            const selected = option.value === settings.maxRemindersPerDay;
            return (
              <Pressable
                key={option.value}
                disabled={remindersOff}
                onPress={() => change({ maxRemindersPerDay: option.value })}
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
        <Text style={[styles.rowHint, { color: theme.mutedText, marginBottom: 8 }]}>
          Stops Spotted from buzzing you again and again on a busy day.
        </Text>
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
            accessibilityLabel="No notifications at night (quiet hours)"
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
    <Pressable onPress={onPress} style={styles.linkRow} accessibilityRole="link" accessibilityLabel={label}>
      <Text style={styles.rowTitle}>{label}</Text>
      {/* The › arrow is only decoration, so screen readers skip it. */}
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ color: theme.mutedText, fontSize: 20 }}>
        ›
      </Text>
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
