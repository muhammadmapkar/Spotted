import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useOnboarding } from '@/src/onboarding/OnboardingContext';
import { requestLocation, requestNotifications } from '@/src/permissions';

type Step = 'location' | 'notifications';

// Explains WHY we need each permission before the phone asks for it.
// Every step can be skipped, and the app still works if you say no.
export default function PermissionsScreen() {
  const theme = Colors[useColorScheme()];
  const { finish } = useOnboarding();
  const [step, setStep] = useState<Step>('location');
  const [busy, setBusy] = useState(false);

  const content: Record<Step, { emoji: string; title: string; text: string; hint?: string; button: string }> = {
    location: {
      emoji: '📍',
      title: 'See places near you',
      text: 'Spotted uses your location while the app is open, to show how far your saved places are and to find places near you. If you later turn on nearby alerts, we will explain and ask once more.',
      button: 'Allow location',
    },
    notifications: {
      emoji: '🔔',
      title: 'Allow notifications',
      text: 'This is how Spotted can tell you that you are near a place you saved, if you turn on nearby alerts. You will never get messages from us, only those alerts.',
      button: 'Allow notifications',
    },
  };
  const current = content[step];

  // Go to the next step, or finish after the last one.
  const goNext = async (allowed: boolean) => {
    void allowed; // each step can be skipped; the app works either way
    if (step === 'location') setStep('notifications');
    else await finish();
  };

  const ask = async () => {
    if (busy) return;
    setBusy(true);
    const allowed =
      step === 'location' ? await requestLocation() : await requestNotifications();
    setBusy(false);
    await goNext(allowed);
  };

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={[styles.text, { color: theme.mutedText }]}>{current.text}</Text>
        {current.hint ? <Text style={[styles.hint, { color: theme.tintText }]}>{current.hint}</Text> : null}
      </View>

      <Pressable onPress={ask} disabled={busy} style={[styles.button, { backgroundColor: theme.tint, opacity: busy ? 0.6 : 1 }]}>
        <Text style={styles.buttonText}>{current.button}</Text>
      </Pressable>
      <Pressable onPress={() => goNext(false)} disabled={busy} style={styles.skip}>
        <Text style={{ color: theme.mutedText, fontSize: 16 }}>Not now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  text: { fontSize: 17, lineHeight: 25, textAlign: 'center' },
  hint: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 16 },
  button: { minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
  skip: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
