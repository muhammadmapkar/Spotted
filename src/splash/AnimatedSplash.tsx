import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  WithTimingConfig,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/Themed';
import { POPPINS } from '@/src/theme/fonts';
import {
  REDUCED_MOTION_TOTAL_MS,
  ROAD_LENGTH,
  ROAD_PATH,
  SHAPES,
  SPLASH_MS,
  SWAY_KEYFRAMES,
  splashLayout,
} from './timeline';

// The animated intro, built to match the prototype's SPLASH section.
//
//   0.25 s  the dark purple road draws itself left to right, then the white dashed line fades in
//   0.9 s   the red banner unrolls DOWNWARD from a rod on the top edge, with a rolled-cloth
//           cylinder at the reveal edge and fold shading that fades away
//   2.05 s  the banner sways from its top edge and settles
//   2.15 s  the white pin pops onto the banner with a bounce
//   2.6 s   "Spotted" rises up, 2.85 s the tagline rises up
//   4.4 s   we call onFinish (or sooner if the user taps). Reduce Motion shows the final picture at once.
//
// It looks the same in light and dark mode, and everything is sized from the screen's size.

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// The prototype's easing curves (CSS cubic-bezier).
const EASE = {
  road: Easing.bezier(0.5, 0, 0.3, 1),
  unroll: Easing.bezier(0.45, 0.05, 0.3, 1),
  pop: Easing.bezier(0.3, 1.4, 0.5, 1), // overshoots a little: the bounce
  rise: Easing.bezier(0.2, 0.8, 0.2, 1),
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  easeOut: Easing.bezier(0, 0, 0.58, 1),
};

type EasingChoice = NonNullable<WithTimingConfig['easing']>;

function play(value: SharedValue<number>, spec: { delay: number; duration: number }, easing: EasingChoice) {
  value.value = withDelay(spec.delay, withTiming(1, { duration: spec.duration, easing }));
}

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  const { scale: s, offsetX } = splashLayout(width, height);
  const reduceMotion = useReducedMotion();

  // How far along each animation is (0 = not started, 1 = done).
  const fadeIn = useSharedValue(0);
  const fadeOut = useSharedValue(0);
  const road = useSharedValue(0);
  const roadDash = useSharedValue(0);
  const unroll = useSharedValue(0);
  const folds = useSharedValue(0);
  const sway = useSharedValue(0);
  const pin = useSharedValue(0);
  const word = useSharedValue(0);
  const tagline = useSharedValue(0);
  const skipHint = useSharedValue(0);

  const finished = useRef(false);
  const finish = useCallback(() => {
    if (finished.current) return; // tapping and the timer must not both fire
    finished.current = true;
    fadeOut.value = withTiming(1, { duration: SPLASH_MS.fadeOut });
    setTimeout(onFinish, SPLASH_MS.fadeOut);
  }, [fadeOut, onFinish]);

  useEffect(() => {
    if (reduceMotion) {
      // Reduce Motion: show the finished picture straight away.
      for (const value of [fadeIn, road, roadDash, pin, word, tagline, skipHint]) value.value = 1;
      unroll.value = 1;
      folds.value = 1;
      sway.value = 1;
    } else {
      play(fadeIn, SPLASH_MS.fadeIn, EASE.ease);
      play(road, SPLASH_MS.road, EASE.road);
      play(roadDash, SPLASH_MS.roadDash, EASE.ease);
      play(unroll, SPLASH_MS.unroll, EASE.unroll);
      play(folds, SPLASH_MS.folds, EASE.easeOut);
      play(sway, SPLASH_MS.sway, EASE.easeInOut);
      play(pin, SPLASH_MS.pin, EASE.pop);
      play(word, SPLASH_MS.word, EASE.rise);
      play(tagline, SPLASH_MS.tagline, EASE.rise);
      play(skipHint, SPLASH_MS.skipHint, EASE.ease);
    }
    const timer = setTimeout(finish, reduceMotion ? REDUCED_MOTION_TOTAL_MS : SPLASH_MS.total);
    return () => clearTimeout(timer);
    // We only start once, when the splash first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- animated styles ---------------------------------------------------------------------
  const rootStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value * (1 - fadeOut.value) }));

  // The road draws itself by sliding a dash along it.
  const roadProps = useAnimatedProps(() => ({ strokeDashoffset: ROAD_LENGTH * (1 - road.value) }));
  const dashLineProps = useAnimatedProps(() => ({ opacity: 0.9 * roadDash.value }));

  // The banner is revealed from the top down by growing a clip window (it is NOT squashed).
  const unrollStyle = useAnimatedStyle(() => ({ height: 460 * s * unroll.value }));
  // The red rolled-cloth cylinder travels down at the reveal edge and fades out at the bottom.
  const rollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (-8 + 428 * unroll.value) * s }],
    opacity: interpolate(unroll.value, [0, 0.88, 1], [1, 1, 0]),
  }));
  const foldsProps = useAnimatedProps(() => ({ opacity: interpolate(folds.value, [0, 1], [0.7, 0]) }));

  // The sway: a small rotate + skew from the top edge, settling back to straight.
  const swayStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(sway.value, [...SWAY_KEYFRAMES.at], [...SWAY_KEYFRAMES.rotateDeg])}deg` },
      { skewX: `${interpolate(sway.value, [...SWAY_KEYFRAMES.at], [...SWAY_KEYFRAMES.skewDeg])}deg` },
    ],
  }));

  // The pin pops on with a bounce (the easing overshoots, so it grows a little past full size).
  const pinStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pin.value * 3),
    transform: [{ translateY: -30 * s * (1 - pin.value) }, { scale: 0.2 + 0.8 * pin.value }],
  }));

  const riseStyle = (progress: SharedValue<number>) => ({
    opacity: progress.value,
    transform: [{ translateY: 30 * s * (1 - progress.value) }],
  });
  const wordStyle = useAnimatedStyle(() => riseStyle(word));
  const taglineStyle = useAnimatedStyle(() => riseStyle(tagline));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipHint.value }));

  // ---- layout helpers (design units -> screen pixels) -------------------------------------
  const px = (n: number) => n * s;
  const rod = SHAPES.rod;
  const banner = SHAPES.banner;
  const pinBox = SHAPES.pin;

  // The radial purple background: an ellipse 120% wide and 70% tall, centred 30% across, 28% down.
  const cx = 0.3 * width;
  const cy = 0.28 * height;
  const rx = 1.2 * width;
  const ry = 0.7 * height;

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <StatusBar style="light" />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Spotted intro. Tap to skip.">
        {/* Background */}
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="bg"
              gradientUnits="userSpaceOnUse"
              cx={cx}
              cy={cy}
              r={rx}
              gradientTransform={`translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})`}>
              <Stop offset="0" stopColor="#A14CE8" />
              <Stop offset="0.38" stopColor="#7B2CBF" />
              <Stop offset="0.7" stopColor="#5A189A" />
              <Stop offset="1" stopColor="#3C096C" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#bg)" />
        </Svg>

        {/* The winding road. Drawn in design units, then mapped onto the screen. */}
        <Svg
          width={width}
          height={height}
          viewBox={`${-offsetX / s} 0 ${width / s} ${height / s}`}
          style={StyleSheet.absoluteFill}>
          <AnimatedPath
            d={ROAD_PATH}
            stroke="#C59BF2"
            strokeWidth={92}
            fill="none"
            strokeLinecap="round"
            opacity={0.55}
            strokeDasharray={`${ROAD_LENGTH} ${ROAD_LENGTH}`}
            animatedProps={roadProps}
          />
          <AnimatedPath
            d={ROAD_PATH}
            stroke="#2A0C4A"
            strokeWidth={80}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${ROAD_LENGTH} ${ROAD_LENGTH}`}
            animatedProps={roadProps}
          />
          <AnimatedPath
            d={ROAD_PATH}
            stroke="#3B1466"
            strokeWidth={56}
            fill="none"
            strokeLinecap="round"
            opacity={0.6}
            strokeDasharray={`${ROAD_LENGTH} ${ROAD_LENGTH}`}
            animatedProps={roadProps}
          />
          <AnimatedPath
            d={ROAD_PATH}
            stroke="#FFFFFF"
            strokeWidth={4}
            fill="none"
            strokeDasharray="16 14"
            animatedProps={dashLineProps}
          />
        </Svg>

        {/* The rod on the very top edge of the screen */}
        <LinearGradient
          colors={['#2A0B46', '#4B1677']}
          style={[
            styles.rod,
            {
              left: offsetX + px(rod.left),
              width: px(rod.width),
              height: px(rod.height),
              borderBottomLeftRadius: px(6),
              borderBottomRightRadius: px(6),
            },
          ]}
        />

        {/* The banner: sways as one piece from its top edge */}
        <Animated.View
          style={[
            styles.banner,
            { left: offsetX + px(banner.left), top: px(banner.top), width: px(banner.width), height: px(banner.height) },
            { transformOrigin: `${px(banner.width / 2)}px 0px` },
            swayStyle,
          ]}>
          {/* The clip window that grows downward, revealing the banner */}
          <Animated.View style={[styles.clip, { left: -px(10), width: px(banner.width + 20) }, unrollStyle]}>
            <Svg width={px(banner.width + 20)} height={px(banner.height + 20)} viewBox="-10 0 140 460">
              <Defs>
                <SvgGradient id="bnG" x1="0" x2="1" y1="0" y2="0">
                  <Stop offset="0" stopColor="#FF6B6B" />
                  <Stop offset="0.45" stopColor="#E5383B" />
                  <Stop offset="1" stopColor="#9E1222" />
                </SvgGradient>
                <ClipPath id="bnShape">
                  <Path d="M0 0H120V440L60 392L0 440Z" />
                </ClipPath>
              </Defs>
              {/* soft shadow under the banner */}
              <Path d="M0 0H120V440L60 392L0 440Z" fill="#1E003C" opacity={0.28} transform="translate(5 9)" />
              {/* the banner, with its V notch at the bottom */}
              <Path d="M0 0H120V440L60 392L0 440Z" fill="url(#bnG)" />
              <Rect x={10} y={0} width={5} height={400} fill="#FFFFFF" opacity={0.28} />
              <Rect x={104} y={0} width={16} height={420} fill="#000000" opacity={0.12} />
              {/* horizontal fold shading that fades away */}
              <AnimatedG clipPath="url(#bnShape)" animatedProps={foldsProps}>
                {Array.from({ length: 15 }, (_, i) => i * 30).map((y) => (
                  <G key={y}>
                    <Rect x={0} y={y} width={120} height={6} fill="#000000" opacity={0.18} />
                    <Rect x={0} y={y + 6} width={120} height={8} fill="#FFFFFF" opacity={0.08} />
                  </G>
                ))}
              </AnimatedG>
            </Svg>
          </Animated.View>

          {/* The red rolled-cloth cylinder travelling down at the reveal edge */}
          <Animated.View
            style={[
              styles.roll,
              { left: px(SHAPES.roll.left), width: px(SHAPES.roll.width), height: px(SHAPES.roll.height), borderRadius: px(11) },
              rollStyle,
            ]}>
            <LinearGradient colors={['#FF7B7B', '#E5383B', '#8E1015']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
          </Animated.View>

          {/* The white pin popping onto the banner */}
          <Animated.View
            style={[styles.pin, { left: px(pinBox.left), top: px(pinBox.top), width: px(pinBox.width), height: px(pinBox.height) }, pinStyle]}>
            <Svg width={px(pinBox.width)} height={px(pinBox.height)} viewBox="0 0 54 66">
              <Path d="M27 64C27 64 4 40 4 25A23 23 0 0 1 50 25C50 40 27 64 27 64Z" fill="#FFFFFF" />
              <Path d="M27 64C27 64 4 40 4 25A23 23 0 0 1 27 2Z" fill="#000000" opacity={0.06} />
              <Circle cx={27} cy={25} r={9} fill="#C1121F" />
            </Svg>
          </Animated.View>
        </Animated.View>

        {/* The name and the tagline */}
        <Animated.View style={[styles.textRow, { top: px(SHAPES.wordTop) }, wordStyle]} pointerEvents="none">
          <Text
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
            style={{
              fontFamily: POPPINS.extraBold,
              fontSize: px(SHAPES.wordFontSize),
              letterSpacing: -px(1),
              color: '#FFFFFF',
              textShadowColor: 'rgba(30,0,60,0.45)',
              textShadowOffset: { width: 0, height: px(6) },
              textShadowRadius: px(18),
            }}>
            Spotted
          </Text>
        </Animated.View>
        <Animated.View style={[styles.textRow, { top: px(SHAPES.taglineTop) }, taglineStyle]} pointerEvents="none">
          <Text lightColor="#EBDDFB" darkColor="#EBDDFB" style={{ fontSize: px(SHAPES.taglineFontSize), color: '#EBDDFB' }}>
            Saved it on a reel. Find it on the road.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.textRow, { bottom: px(SHAPES.skipBottom) }, skipStyle]} pointerEvents="none">
          <Text lightColor="#E4D4F8" darkColor="#E4D4F8" style={{ fontSize: px(SHAPES.skipFontSize), color: '#E4D4F8' }}>
            Tap to skip
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#5A189A' },
  rod: { position: 'absolute', top: 0, elevation: 4, shadowColor: '#140028', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  banner: { position: 'absolute' },
  clip: { position: 'absolute', top: 0, overflow: 'hidden' },
  roll: { position: 'absolute', top: 0, overflow: 'hidden', elevation: 3 },
  pin: { position: 'absolute' },
  textRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
