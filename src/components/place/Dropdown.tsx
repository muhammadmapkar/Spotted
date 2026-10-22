import { ReactNode, useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/src/components/icons/Icon';
import { IconName } from '@/src/components/icons/paths';
import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

// A section that opens and closes (prototype: .dd-h and .dd): a header button with an icon, a title,
// a count badge and a chevron that turns over, then a body that slides open (0.4 s).
// With Reduce Motion on it opens at once.
export function Dropdown({
  title,
  count,
  icon,
  iconColor,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  icon: IconName;
  iconColor: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();

  const progress = useSharedValue(open ? 1 : 0); // 0 = closed, 1 = open
  const contentHeight = useSharedValue(0); // measured from the body
  useEffect(() => {
    const target = open ? 1 : 0;
    progress.value = reduceMotion ? target : withTiming(target, { duration: 400, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
  }, [open, reduceMotion, progress]);

  const bodyStyle = useAnimatedStyle(() => ({ height: contentHeight.value * progress.value, opacity: progress.value }));
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${180 * progress.value}deg` }] }));
  const measure = (event: LayoutChangeEvent) => {
    contentHeight.value = event.nativeEvent.layout.height;
  };

  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${count}`}
        accessibilityState={{ expanded: open }}
        style={[
          styles.header,
          { backgroundColor: palette.surface, borderColor: palette.line },
          open && styles.headerOpen,
        ]}>
        <Icon name={icon} size={20} color={iconColor} />
        <AppText weight="700" size={15}>{title}</AppText>
        <View style={[styles.count, { backgroundColor: palette.chip }]}>
          <AppText tone="acc" weight="700" size={11}>{count}</AppText>
        </View>
        <Animated.View style={[styles.chevron, chevronStyle]}>
          <Icon name="chevron" size={20} color={palette.muted} />
        </Animated.View>
      </Pressable>

      {/* The body is measured at its full height; the visible window grows from 0 to that height. */}
      <Animated.View style={[styles.window, bodyStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <View
          onLayout={measure}
          style={[styles.body, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, padding: 16, borderRadius: 18, borderWidth: 1 },
  headerOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  count: { minWidth: 24, height: 22, paddingHorizontal: 7, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chevron: { marginLeft: 'auto' },
  window: { overflow: 'hidden' },
  // position: absolute keeps the measured height independent of the window's animated height
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingTop: 4,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
});
