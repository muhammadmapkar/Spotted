import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { Icon } from '@/src/components/icons/Icon';
import { IconName } from '@/src/components/icons/paths';

// A big purple circle with a white line icon in it. Used on the welcome slides and the permission screens,
// where an emoji used to be.
export function HeroIcon({ name, size = 120 }: { name: IconName; size?: number }) {
  return (
    <LinearGradient colors={['#9D4EDD', '#5A189A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={name} size={size * 0.45} color="#FFFFFF" strokeWidth={2} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
});
