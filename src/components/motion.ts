import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

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

export { Animated };
