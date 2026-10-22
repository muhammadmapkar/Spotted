import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppText } from '@/src/components/ui/ui';

const PERIOD = 120; // the pattern repeats every 120 px, so sliding by one period loops without a jump

// The red "NEW" / "JUST JOINED" badge with a light shimmer running across it (prototype: .badge.new).
export function NewBadge({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();
  const slide = useSharedValue(0);
  useEffect(() => {
    if (!reduceMotion) slide.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1, false);
  }, [reduceMotion, slide]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -PERIOD * slide.value }] }));

  return (
    <View style={styles.badge} accessible accessibilityLabel={label}>
      <Animated.View style={[styles.shimmer, style]}>
        <LinearGradient
          colors={['#D62839', '#DD3042', '#D62839', '#DD3042', '#D62839']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <AppText tone="onBrand" weight="700" size={10}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden', alignSelf: 'flex-start', justifyContent: 'center' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: PERIOD * 2 },
});
