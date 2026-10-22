import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { AppText } from '@/src/components/ui/ui';
import { COINS, savingsBreakdown } from '@/src/profile/profileData';

// One gold coin that flies out and fades (prototype: .coin and its "coin" animation, 1.4 s).
function Coin({ coin }: { coin: (typeof COINS)[number] }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!reduceMotion) progress.value = withDelay(coin.delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }));
  }, [coin.delay, reduceMotion, progress]);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: reduceMotion ? 0 : p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8,
      transform: [{ translateX: coin.dx * p }, { translateY: coin.dy * p }, { scale: 0.4 + 0.6 * p }],
    };
  });
  return <Animated.View style={[styles.coin, { left: `${coin.left * 100}%`, top: `${coin.top * 100}%` }, style]} />;
}

// "You've saved with Spotted": a purple card with the big AED number (counting up) and the split between
// Spotted, Esaad and Fazaa. A few gold coins burst out each time the tab opens (`runKey` changes).
export function SavingsCard({ shown, runKey }: { shown: number; runKey: number }) {
  return (
    <LinearGradient colors={['#9D4EDD', '#5A189A', '#3C096C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      {COINS.map((coin) => (
        <Coin key={`${runKey}-${coin.delay}`} coin={coin} />
      ))}
      <AppText tone="onBrand" size={13} style={{ opacity: 0.9 }}>You've saved with Spotted</AppText>
      <AppText tone="onBrand" weight="800" size={40} style={styles.total} accessibilityLiveRegion="polite">AED {shown}</AppText>
      <View style={styles.parts}>
        {savingsBreakdown(shown).map((part) => (
          <View key={part.label} style={styles.part}>
            <AppText tone="onBrand" size={11} style={{ opacity: 0.9 }}>{part.label}</AppText>
            <AppText tone="onBrand" weight="700" size={15}>AED {part.value}</AppText>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, overflow: 'hidden', boxShadow: '0 14px 30px rgba(90,24,154,0.35)' },
  total: { letterSpacing: -1, marginTop: 2, marginBottom: 12 },
  parts: { flexDirection: 'row', gap: 8 },
  part: { flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)' },
  coin: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFD166', opacity: 0 },
});
