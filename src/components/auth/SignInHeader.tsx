import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AUTH_HEADER, AUTH_ROAD_LENGTH, AUTH_ROAD_PATH } from '@/src/auth/headerArt';
import { SPLASH_MS } from '@/src/splash/timeline';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// The purple top of the sign-in screen (prototype: .auth-top): a small road that draws itself,
// a rod on the top edge, and a small red banner with the white pin that pops on.
// `scale` makes it fit the phone's width.
export function SignInHeader({ scale: s, width }: { scale: number; width: number }) {
  const reduceMotion = useReducedMotion();
  const road = useSharedValue(0);
  const dash = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      road.value = 1;
      dash.value = 1;
      pop.value = 1;
      return;
    }
    // The same road animation as the splash, and the pin banner pops in (0.6 s, with a bounce).
    road.value = withDelay(SPLASH_MS.road.delay, withTiming(1, { duration: SPLASH_MS.road.duration, easing: Easing.bezier(0.5, 0, 0.3, 1) }));
    dash.value = withDelay(SPLASH_MS.roadDash.delay, withTiming(1, { duration: SPLASH_MS.roadDash.duration }));
    pop.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.3, 1.4, 0.5, 1) });
  }, [reduceMotion, road, dash, pop]);

  const roadProps = useAnimatedProps(() => ({ strokeDashoffset: AUTH_ROAD_LENGTH * (1 - road.value) }));
  const dashProps = useAnimatedProps(() => ({ opacity: dash.value }));
  const popStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 2),
    transform: [{ scale: 0.3 + 0.7 * pop.value }],
  }));

  const height = AUTH_HEADER.height * s;
  return (
    <View style={[styles.header, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} viewBox={`0 0 ${AUTH_HEADER.width} ${AUTH_HEADER.height}`} preserveAspectRatio="xMidYMin slice">
        <Defs>
          <RadialGradient
            id="authBg"
            gradientUnits="userSpaceOnUse"
            cx={117}
            cy={60}
            r={468}
            gradientTransform="translate(117 60) scale(1 0.577) translate(-117 -60)">
            <Stop offset="0" stopColor="#A14CE8" />
            <Stop offset="0.55" stopColor="#6A1FB0" />
            <Stop offset="1" stopColor="#3C096C" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={AUTH_HEADER.width} height={AUTH_HEADER.height} fill="url(#authBg)" />
        <AnimatedPath
          d={AUTH_ROAD_PATH}
          stroke="#2A0C4A"
          strokeWidth={46}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${AUTH_ROAD_LENGTH} ${AUTH_ROAD_LENGTH}`}
          animatedProps={roadProps}
        />
        <AnimatedPath d={AUTH_ROAD_PATH} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeDasharray="12 10" animatedProps={dashProps} />
        {/* the rod on the top edge */}
        <Rect x={160} y={0} width={70} height={8} rx={4} fill="#3A1161" />
      </Svg>

      {/* the small banner with the pin, popping in */}
      <Animated.View style={[styles.banner, { left: width / 2 - 23 * s, top: 4 * s, width: 46 * s, height: 150 * s }, popStyle]}>
        <Svg width={46 * s} height={150 * s} viewBox="0 0 46 150">
          <Path d="M0 0H46V150L23 132L0 150Z" fill="#E5383B" />
          <Path d="M23 92C23 92 12 80 12 72A11 11 0 0 1 34 72C34 80 23 92 23 92Z" fill="#FFFFFF" />
          <Circle cx={23} cy={72} r={4} fill="#C1121F" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  banner: { position: 'absolute' },
});
