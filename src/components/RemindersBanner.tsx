import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getSettings } from '@/src/db';
import { openPhoneSettings } from '@/src/openLink';
import { PermissionState, getPermissionState, remindersWork } from '@/src/permissions';

// A friendly note shown on My Places when reminders can't work because a
// permission was refused. The rest of the app keeps working normally.
export function RemindersBanner() {
  const theme = Colors[useColorScheme()];
  const [missing, setMissing] = useState<string | null>(null);

  // Check again every time the screen is shown (the user may have just changed it in Settings).
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [settings, state] = await Promise.all([getSettings(), getPermissionState()]);
          if (!settings.remindersEnabled || remindersWork(state)) return setMissing(null);
          setMissing(describeMissing(state));
        } catch {
          setMissing(null); // can't tell: show nothing rather than crash
        }
      })();
    }, [])
  );

  if (!missing) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.text} lightColor="transparent" darkColor="transparent">
        <Text style={styles.title}>Reminders are off</Text>
        <Text style={[styles.body, { color: theme.mutedText }]}>{missing}</Text>
      </View>
      <Pressable onPress={openPhoneSettings} style={[styles.button, { backgroundColor: theme.tint }]}>
        <Text style={styles.buttonText}>Turn on</Text>
      </Pressable>
    </View>
  );
}

// Explain in plain words what is missing.
function describeMissing(state: PermissionState): string {
  if (!state.location) return 'Allow location in your phone settings so Spotted can tell when you are near a place.';
  if (!state.background) return 'Set location to “Allow all the time” so Spotted can remind you when the app is closed.';
  return 'Allow notifications in your phone settings so Spotted can show reminders.';
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 4, padding: 14, borderRadius: 14, borderWidth: 1 },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  button: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
