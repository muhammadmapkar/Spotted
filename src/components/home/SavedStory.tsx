import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { PlaceLogo } from '@/src/components/PlaceLogo';
import { usePopIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { Place, fmt } from '@/src/data/mock';
import { useTheme } from '@/src/theme/ThemeProvider';

// One circle in the "Saved places near you" row, like an Instagram story.
// A ring slowly rotates around the logo. Under 5 km the ring is bright (pink, purple, orange) with a
// pulsing glow and a bold label; from 5 to 15 km it is a softer, muted purple. The label is the
// distance (not the name), e.g. "1.2 km away".
export function SavedStory({ place, ring, index, onPress }: { place: Place; ring: 'hot' | 'soft'; index: number; onPress: () => void }) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const hot = ring === 'hot';
  const pop = usePopIn(250 + index * 90); // the circles pop in one after another

  const turn = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    turn.value = withRepeat(withTiming(360, { duration: hot ? 3000 : 7000, easing: Easing.linear }), -1, false);
    if (hot) pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [hot, reduceMotion, turn, pulse]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - pulse.value), transform: [{ scale: 1 + 0.22 * pulse.value }] }));

  return (
    <Animated.View style={[styles.story, pop]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${place.name}, ${fmt(place.dist)}`}
        style={styles.press}>
        {hot ? <Animated.View style={[styles.glow, glowStyle]} /> : null}

        {/* The ring: a gradient turning inside a round window. The logo covers the middle. */}
        <View style={[styles.ring, { opacity: hot ? 1 : 0.75 }]}>
          <Animated.View style={[styles.spinner, spinStyle]}>
            <LinearGradient
              colors={hot ? ['#FF4D6D', '#C77DFF', '#7B2CBF', '#FF9E00', '#FF4D6D'] : ['#9C88BF', '#6A4C93', '#C9B8E6', '#9C88BF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <View style={[styles.logoGap, { backgroundColor: palette.bg }]}>
          <PlaceLogo place={place} size={60} />
        </View>

        <AppText tone={hot ? 'acc' : 'muted'} weight={hot ? '700' : '500'} size={11} numberOfLines={1} style={styles.label}>
          {fmt(place.dist)}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  story: { width: 74 },
  press: { width: 74, height: 100, alignItems: 'center' },
  glow: { position: 'absolute', top: 0, left: 3, width: 68, height: 68, borderRadius: 34, backgroundColor: '#FF4D6D' },
  ring: { position: 'absolute', top: 0, left: 3, width: 68, height: 68, borderRadius: 34, overflow: 'hidden' },
  spinner: { position: 'absolute', top: -16, left: -16, width: 100, height: 100 },
  logoGap: { position: 'absolute', top: 2, left: 5, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', top: 76, textAlign: 'center' },
});
