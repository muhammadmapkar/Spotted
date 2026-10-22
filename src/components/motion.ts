import { useEffect } from 'react';
import Animated, { Easing, LinearTransition, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

// Small entrance animations from the prototype. All of them skip straight to the end under Reduce Motion.

// "up": slides up 24 px while fading in (0.5 s). Used for cards and rows.
export function useRiseIn(delayMs = 0) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) progress.value = withDelay(delayMs, withTiming(1, { duration: 500, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
  }, [delayMs, reduceMotion, progress]);
  return useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: 24 * (1 - progress.value) }] }));
}

// "pop": grows from small with a little overshoot (0.5 s). Used for the story circles.
export function usePopIn(delayMs = 0, durationMs = 500) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) progress.value = withDelay(delayMs, withTiming(1, { duration: durationMs, easing: Easing.bezier(0.3, 1.4, 0.5, 1) }));
  }, [delayMs, reduceMotion, progress]);
  return useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 2), transform: [{ scale: 0.3 + 0.7 * progress.value }] }));
}

// "fanIn": slides in from the right while straightening up from a small tilt (0.6 s). Used for the top 7 cards.
export function useFanIn(delayMs = 0) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) progress.value = withDelay(delayMs, withTiming(1, { duration: 600, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
  }, [delayMs, reduceMotion, progress]);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: 120 * (1 - progress.value) }, { rotate: `${6 * (1 - progress.value)}deg` }],
  }));
}

// "pinPop": a map pin drops in from above with a little bounce (0.5 s). Used for the Map tab pins.
export function usePinPop(delayMs = 0) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) progress.value = withDelay(delayMs, withTiming(1, { duration: 500, easing: Easing.bezier(0.3, 1.4, 0.5, 1) }));
  }, [delayMs, reduceMotion, progress]);
  return useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 2), transform: [{ translateY: -30 * (1 - progress.value) }, { scale: 0.2 + 0.8 * progress.value }] }));
}

// "ping": a ring that grows and fades, again and again (1.8 s). Used for the blue "you are here" dot.
export function usePing() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!reduceMotion) progress.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false);
  }, [reduceMotion, progress]);
  return useAnimatedStyle(() => ({ opacity: reduceMotion ? 0 : 0.55 * (1 - progress.value), transform: [{ scale: 1 + 2.4 * progress.value }] }));
}

// How the rows of a list move when the results change (a filter is switched): they glide to their
// new places over 0.3 s. Pass it to <Animated.FlatList itemLayoutAnimation={...}>. Off with Reduce Motion.
// With a very long list (more than LAYOUT_ANIMATION_MAX rows) the glide is skipped, so scrolling and filtering stay smooth.
export const LAYOUT_ANIMATION_MAX = 40;
export function useListLayout(rowCount = 0) {
  const reduceMotion = useReducedMotion();
  return reduceMotion || rowCount > LAYOUT_ANIMATION_MAX ? undefined : LinearTransition.duration(300);
}

export { Animated };
