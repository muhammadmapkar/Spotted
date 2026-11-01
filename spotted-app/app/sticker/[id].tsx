import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useStore } from '../../src/store';
import { font, space, useTheme } from '../../src/theme';
import { Button, T } from '../../src/ui';

// A square "I've been Spotted" badge with the place name, exported as a PNG for stories and reels.
export default function Sticker() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { placeOf, handle } = useStore();
  const place = placeOf(id);
  const shot = useRef<React.ComponentRef<typeof ViewShot>>(null);
  const [busy, setBusy] = useState(false);

  if (!place) return <View style={{ padding: space.md }}><T>This place isn't available.</T></View>;

  async function share() {
    setBusy(true);
    try {
      const uri = await shot.current?.capture?.();
      if (!uri) throw new Error('no image');
      if (!(await Sharing.isAvailableAsync())) { Alert.alert('Sharing is not available on this device'); return; }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Spotted sticker' });
    } catch {
      Alert.alert('Could not make the sticker', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.lg, alignItems: 'center' }}>
      <ViewShot ref={shot} options={{ format: 'png', quality: 1, width: 1080, height: 1080 }}>
        <LinearGradient colors={['#A14CE8', '#7B2CBF', '#3C096C']} style={{ width: 300, height: 300, borderRadius: 32, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.sm }}>
          <T style={{ color: '#C9A2FF', fontFamily: font.semi, fontSize: 14, letterSpacing: 2 }}>SPOTTED</T>
          <T style={{ color: '#FFFFFF', fontFamily: font.bold, fontSize: 30, textAlign: 'center' }}>I've been Spotted</T>
          <T style={{ color: '#FFFFFF', fontFamily: font.semi, fontSize: 18, textAlign: 'center' }}>{place.name}</T>
          <T style={{ color: '#E0C3FC', fontSize: 12 }}>{place.area} · @{handle}</T>
        </LinearGradient>
      </ViewShot>
      <T style={{ color: c.muted, textAlign: 'center' }}>Add it to your story or reel as a sticker.</T>
      <Button label="Share sticker" icon="share-outline" onPress={share} disabled={busy} />
    </View>
  );
}
