import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { ComponentProps, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/AuthContext';
import { Icon } from '@/src/components/icons/Icon';
import { TABS, TabItem } from '@/src/components/tabBarConfig';
import { BAR_CONTENT_HEIGHT, DOT_SIZE, HOME_CIRCLE, barHeight, bottomPadding, dotLeft } from '@/src/components/tabBarMath';
import { AppText } from '@/src/components/ui/ui';
import { markNewInSeen, useShowNewInDot } from '@/src/state/newIn';
import { useTheme } from '@/src/theme/ThemeProvider';

// The Spotted bottom bar (prototype: .nav, .nb, .nb-home, .nav-ind, .nb-dot):
//   Saved . Map . Home (raised purple circle, centre) . New In . Profile
// - the active icon bounces when its tab becomes active, and a small dot slides under it
// - New In shows a red dot until the tab is opened
// - Profile shows the user's first initial in a small circle (never a person icon)
// - a blurred, translucent background that respects the phone's bottom edge
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export function SpottedTabBar({ state, navigation }: TabBarProps) {
  const { palette, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const showNewDot = useShowNewInDot();
  const [barWidth, setBarWidth] = useState(0);

  const tabs = TABS.filter((tab) => state.routes.some((route) => route.name === tab.name));
  const focusedName = state.routes[state.index]?.name;
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.name === focusedName));

  // Opening New In clears its red dot.
  useEffect(() => {
    if (focusedName === 'new') markNewInSeen();
  }, [focusedName]);

  // The small dot slides to the active tab (with a little overshoot, like the prototype).
  const target = barWidth > 0 ? dotLeft(barWidth, tabs.length, activeIndex) : 0;
  const dotX = useSharedValue(target);
  useEffect(() => {
    dotX.value = reduceMotion ? target : withTiming(target, { duration: 350, easing: Easing.bezier(0.3, 1.4, 0.5, 1) });
  }, [target, reduceMotion, dotX]);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value }] }));

  const press = (tab: TabItem) => {
    const route = state.routes.find((r) => r.name === tab.name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (focusedName !== tab.name && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  return (
    <View
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      style={[styles.bar, { height: barHeight(insets.bottom), borderTopColor: palette.line }]}>
      {/* The blur, then the translucent colour on top of it */}
      <BlurView
        intensity={40}
        tint={scheme}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.navBg }]} />

      <View style={[styles.row, { height: BAR_CONTENT_HEIGHT }]}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.name}
            tab={tab}
            focused={tab.name === focusedName}
            showDot={tab.name === 'new' && showNewDot}
            onPress={() => press(tab)}
          />
        ))}
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.slidingDot, { backgroundColor: palette.acc, bottom: Math.max(bottomPadding(insets.bottom) - 2, 10) }, dotStyle]}
      />
    </View>
  );
}

function TabButton({ tab, focused, showDot, onPress }: { tab: TabItem; focused: boolean; showDot: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  // The icon bounces when the tab becomes active. (Home's circle grows a little instead.)
  const bounce = useSharedValue(1);
  const grow = useSharedValue(focused ? 1.07 : 1);
  useEffect(() => {
    if (reduceMotion) {
      grow.value = focused ? 1.07 : 1;
      return;
    }
    grow.value = withTiming(focused ? 1.07 : 1, { duration: 250 });
    if (focused) bounce.value = withSequence(withTiming(1.28, { duration: 180 }), withTiming(0.9, { duration: 135 }), withTiming(1, { duration: 135 }));
  }, [focused, reduceMotion, bounce, grow]);
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));
  const growStyle = useAnimatedStyle(() => ({ transform: [{ scale: grow.value }] }));

  const color = focused ? palette.acc : palette.muted;
  const initial = (user?.name?.trim().charAt(0) || 'S').toUpperCase();

  if (tab.center) {
    // Home: a raised purple gradient circle that sits above the bar.
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: focused }}
        style={styles.column}>
        <Animated.View style={[styles.homeShadow, { borderColor: palette.bg }, growStyle]}>
          <LinearGradient colors={['#9D4EDD', '#5A189A']} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={styles.homeCircle}>
            <Icon name={tab.icon!} size={24} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: focused }}
      style={styles.column}>
      <Animated.View style={[styles.iconSlot, bounceStyle]}>
        {tab.icon ? (
          <Icon name={tab.icon} size={20} color={color} />
        ) : (
          <LinearGradient colors={['#9D4EDD', '#D62839']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.initialCircle}>
            <AppText tone="onBrand" weight="700" size={11}>{initial}</AppText>
          </LinearGradient>
        )}
      </Animated.View>
      <AppText weight="600" size={10} style={{ color }}>{tab.label}</AppText>
      {showDot ? <View style={[styles.newDot, { backgroundColor: palette.red, borderColor: palette.bg }]} accessibilityLabel="New" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, overflow: 'visible' },
  row: { flexDirection: 'row' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44 },
  iconSlot: { height: 24, alignItems: 'center', justifyContent: 'center' },
  initialCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  slidingDot: { position: 'absolute', left: 0, width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  newDot: { position: 'absolute', top: 8, left: '50%', marginLeft: 8, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  // The raised Home button: 58 px, sitting a little above the bar, with a ring in the page colour.
  homeShadow: {
    position: 'absolute',
    top: -7,
    width: HOME_CIRCLE,
    height: HOME_CIRCLE,
    borderRadius: HOME_CIRCLE / 2,
    borderWidth: 4,
    shadowColor: '#5A189A',
    shadowOpacity: 0.45,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  homeCircle: { flex: 1, borderRadius: HOME_CIRCLE / 2, alignItems: 'center', justifyContent: 'center' },
});
