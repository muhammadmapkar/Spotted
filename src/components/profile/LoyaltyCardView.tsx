import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/src/components/ui/ui';
import { LoyaltyView, StampSlot } from '@/src/profile/profileData';

export const LOYALTY_CARD_WIDTH = 270;

// One stamp slot (prototype: .stp). Stamped ones are white circles with a red bookmark that PRESS IN with a
// bounce, one after another; the next one to collect has a gold ring that glows; the rest are dashed circles.
function Stamp({ slot }: { slot: StampSlot }) {
  const reduceMotion = useReducedMotion();
  const press = useSharedValue(reduceMotion || slot.state !== 'filled' ? 1 : 0);
  const glow = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    if (slot.state === 'filled') press.value = withDelay(slot.delay, withTiming(1, { duration: 450, easing: Easing.bezier(0.3, 1.4, 0.5, 1) }));
    if (slot.state === 'next') glow.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [slot.state, slot.delay, reduceMotion, press, glow]);

  // the stamp: starts big and tilted, lands slightly small, settles (prototype: "stamp")
  const stampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, press.value * 3),
    transform: [{ scale: 1.9 - 0.9 * press.value }, { rotate: `${-25 * (1 - press.value)}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * glow.value, transform: [{ scale: 1 + 0.12 * glow.value }] }));

  if (slot.state === 'filled') {
    return (
      <Animated.View style={[styles.stamp, styles.stampOn, stampStyle]} accessibilityLabel="Stamp collected">
        <Svg width={14} height={18} viewBox="0 0 14 18"><Path d="M0 0H14V18L7 14L0 18Z" fill="#D62839" /></Svg>
      </Animated.View>
    );
  }
  if (slot.state === 'next') {
    return <Animated.View style={[styles.stamp, styles.stampNext, glowStyle]} accessibilityLabel="Next stamp" />;
  }
  return <View style={[styles.stamp, styles.stampEmpty]} />;
}

// A loyalty card (prototype: .lc): the place logo, "4 of 6 stamps", six stamp slots, "Now 10% off" and the next
// level. The discount rises with the stamps up to 25%. Tapping the card opens the place.
export function LoyaltyCardView({ view, onPress }: { view: LoyaltyView; onPress: () => void }) {
  const { place, card } = view;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${view.stampsLabel}, now ${view.nowLabel}`}>
      <LinearGradient colors={card.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.shade} pointerEvents="none" />
        <View style={styles.top}>
          <View style={styles.logo}>
            <AppText tone="onBrand" weight="800" size={11}>{place.mono}</AppText>
          </View>
          <View>
            <AppText tone="onBrand" weight="700" size={15}>{place.name}</AppText>
            <AppText tone="onBrand" size={12} style={{ opacity: 0.9 }}>{view.stampsLabel}</AppText>
          </View>
        </View>
        <View style={styles.stamps}>
          {view.slots.map((slot) => (
            <View key={slot.index} style={styles.slot}>
              <Stamp slot={slot} />
            </View>
          ))}
        </View>
        <View style={styles.bottom}>
          <AppText tone="onBrand" size={12}>Now <AppText tone="onBrand" weight="700" size={16}>{view.nowLabel}</AppText></AppText>
          <AppText tone="onBrand" size={12} style={{ opacity: 0.9, flexShrink: 1, textAlign: 'right' }}>{view.nextLabel}</AppText>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: LOYALTY_CARD_WIDTH, borderRadius: 22, padding: 16, boxShadow: '0 6px 20px rgba(60,20,110,0.2)' },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.22)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stamps: { flexDirection: 'row', gap: 6, marginVertical: 12 },
  slot: { flex: 1, aspectRatio: 1 },
  stamp: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stampOn: { backgroundColor: '#FFFFFF' },
  stampNext: { borderWidth: 2, borderColor: '#FFD166' },
  stampEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.55)' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
