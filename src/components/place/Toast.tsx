import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/src/components/ui/ui';

// A short message near the bottom of the screen (prototype: .toast), e.g. "Saved to Food".
// Rendered only while there is a message; the screen clears it after about 2 seconds.
export function Toast({ message, bottom = 40 }: { message: string | null; bottom?: number }) {
  const reduceMotion = useReducedMotion(); // with Reduce Motion the message simply appears
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom }]}>
      <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(300)} style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <AppText tone="onBrand" weight="500" size={13}>{message}</AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, backgroundColor: '#1C0F2E', boxShadow: '0 10px 26px rgba(0,0,0,0.3)' },
});
