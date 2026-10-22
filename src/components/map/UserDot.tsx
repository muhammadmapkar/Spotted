import { StyleSheet, View } from 'react-native';

import { Animated, usePing } from '@/src/components/motion';

export const USER_DOT = 18;

// The blue "you are here" dot with a ring that keeps pulsing outwards (prototype: .me-dot and .me-ping).
export function UserDot() {
  const ping = usePing();
  return (
    <View style={styles.box} accessible accessibilityLabel="Your location">
      <Animated.View style={[styles.ping, ping]} />
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: USER_DOT * 4, height: USER_DOT * 4, alignItems: 'center', justifyContent: 'center' },
  ping: { position: 'absolute', width: USER_DOT, height: USER_DOT, borderRadius: USER_DOT / 2, backgroundColor: '#2F80ED' },
  dot: { width: USER_DOT, height: USER_DOT, borderRadius: USER_DOT / 2, backgroundColor: '#2F80ED', borderWidth: 3, borderColor: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' },
});
