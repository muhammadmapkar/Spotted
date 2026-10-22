import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Icon } from '@/src/components/icons/Icon';
import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

// The three buttons under the place name (prototype: .act):
//   [red pin  Location]  [Menu]                                   [bookmark]
// The pin bounces twice about a second after the page opens. The bookmark fills red when saved.
export function ActionRow({
  placeName,
  saved,
  onLocation,
  onMenu,
  onToggleSave,
}: {
  placeName: string;
  saved: boolean;
  onLocation: () => void;
  onMenu: () => void;
  onToggleSave: () => void;
}) {
  const { palette, scheme } = useTheme();
  const dark = scheme === 'dark';
  const reduceMotion = useReducedMotion();

  // The pin: waits 1 s, then bounces twice (prototype: bounce 1.6s, 2 times).
  const pinScale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    const bounce = withSequence(withTiming(1.28, { duration: 640 }), withTiming(0.9, { duration: 480 }), withTiming(1, { duration: 480 }));
    pinScale.value = withDelay(1000, withRepeat(bounce, 2, false));
  }, [reduceMotion, pinScale]);
  const pinStyle = useAnimatedStyle(() => ({ transform: [{ scale: pinScale.value }] }));

  // The bookmark: a short bounce each time it becomes saved.
  const markScale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion || !saved) return;
    markScale.value = withSequence(withTiming(1.28, { duration: 160 }), withTiming(0.9, { duration: 120 }), withTiming(1, { duration: 120 }));
  }, [saved, reduceMotion, markScale]);
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: markScale.value }] }));

  const pinBg = dark ? '#4A1520' : '#FDE3E6';
  const pinText = dark ? '#FFB3BD' : '#B3182A';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onLocation}
        accessibilityRole="button"
        accessibilityLabel={`Open ${placeName} in Google Maps`}
        style={[styles.action, { backgroundColor: pinBg }]}>
        <Animated.View style={pinStyle}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill={palette.red} stroke={palette.red} strokeWidth={2} strokeLinejoin="round" />
            <Circle cx={12} cy={9.5} r={2.5} fill="#FFFFFF" />
          </Svg>
        </Animated.View>
        <AppText weight="600" size={13} style={{ color: pinText }}>Location</AppText>
      </Pressable>

      <Pressable
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel={`Open the menu of ${placeName}`}
        style={[styles.action, { backgroundColor: palette.chip }]}>
        <Icon name="menu" size={20} color={palette.acc} />
        <AppText tone="acc" weight="600" size={13}>Menu</AppText>
      </Pressable>

      <Pressable
        onPress={onToggleSave}
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Remove from saved' : 'Save this place'}
        accessibilityState={{ selected: saved }}
        style={[styles.action, styles.save, { backgroundColor: saved ? (dark ? '#4A1520' : '#FDE3E6') : palette.chip }]}>
        <Animated.View style={markStyle}>
          <Icon name="bookmark" size={20} color={saved ? palette.red : palette.acc} filled={saved} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 16, borderRadius: 15 },
  save: { marginLeft: 'auto', width: 46, paddingHorizontal: 0, justifyContent: 'center' },
});
