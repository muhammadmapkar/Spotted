import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { usePopIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { Influencer } from '@/src/data/mock';
import { safeWebUrl } from '@/src/place/placeData';
import { MONO_SHADOW } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

const RING = 96; // the whole circle (prototype: .prof-ring)
const BORDER = 4; // thickness of the coloured ring

// A profile circle (prototype: .prof-ring): a picture (or gradient + initial) inside a slowly turning rainbow
// ring. It zooms in when the page opens (0.6 s). Used for influencers and for the signed-in user.
export function RingAvatar({
  initial,
  gradient,
  pictureUrl,
  label,
}: {
  initial: string;
  gradient: [string, string];
  pictureUrl?: string | null;
  label: string; // read out by screen readers, e.g. "@capital.bites's profile picture"
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const zoom = usePopIn(0, 600);
  const picture = safeWebUrl(pictureUrl);

  const turn = useSharedValue(0);
  useEffect(() => {
    if (!reduceMotion) turn.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false);
  }, [reduceMotion, turn]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));

  const inner = RING - BORDER * 2;
  return (
    <Animated.View style={[styles.ring, zoom]} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={styles.window}>
        <Animated.View style={[styles.spinner, spin]}>
          <LinearGradient
            colors={['#FF4D6D', '#C77DFF', '#7B2CBF', '#FF9E00', '#FF4D6D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
      <View style={[styles.face, { width: inner, height: inner, borderRadius: inner / 2, borderColor: palette.bg }]}>
        {picture ? (
          <Image source={{ uri: picture }} style={styles.fill} accessibilityIgnoresInvertColors />
        ) : (
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.fill, styles.center]}>
            <AppText tone="onBrand" weight="800" size={34} style={MONO_SHADOW}>{initial}</AppText>
          </LinearGradient>
        )}
      </View>
    </Animated.View>
  );
}

// The influencer's profile circle.
export function ProfileRing({ influencer }: { influencer: Influencer }) {
  return (
    <RingAvatar
      initial={influencer.initial}
      gradient={influencer.gradient}
      pictureUrl={influencer.profilePicUrl}
      label={`@${influencer.handle}'s profile picture`}
    />
  );
}

const styles = StyleSheet.create({
  ring: { width: RING, height: RING },
  // a round window; the square gradient turns inside it, so the ring seems to turn
  window: { position: 'absolute', top: 0, left: 0, width: RING, height: RING, borderRadius: RING / 2, overflow: 'hidden' },
  spinner: { position: 'absolute', top: -20, left: -20, width: RING + 40, height: RING + 40 },
  face: { position: 'absolute', top: BORDER, left: BORDER, borderWidth: 3, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
