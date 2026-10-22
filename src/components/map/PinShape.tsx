import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Animated, usePinPop } from '@/src/components/motion';
import { PinKind } from '@/src/map/mapData';

export const PIN_WIDTH = 44; // the touchable box around a pin (prototype: .mpin)
export const PIN_HEIGHT = 48;
const SELECTED_SCALE = 1.3;

// A map pin (prototype: .bm and the purple pin SVG):
//   saved   = small red bookmark with a white dot
//   partner = purple teardrop pin with a white dot
// It drops in at its own moment (`delay`) and grows when selected. The bottom tip stays on the spot.
export function PinShape({ kind, selected, delay }: { kind: PinKind; selected: boolean; delay: number }) {
  const pop = usePinPop(delay);
  // scaling happens around the middle, so push the pin down by half of what it grew to keep its tip in place
  const scale = selected ? SELECTED_SCALE : 1;
  const grow = { transform: [{ translateY: (PIN_HEIGHT * (scale - 1)) / 2 }, { scale }] };
  return (
    <View style={styles.box}>
      <Animated.View style={pop}>
        <View style={grow}>
          {kind === 'saved' ? (
            <Svg width={22} height={30} viewBox="0 0 22 30">
              <Defs>
                <LinearGradient id="bm" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FF6B6B" />
                  <Stop offset="0.55" stopColor="#D62839" />
                  <Stop offset="1" stopColor="#9E1222" />
                </LinearGradient>
              </Defs>
              <Path d="M0 0H22V30L11 23.4 0 30Z" fill="url(#bm)" />
              <Circle cx={11} cy={9} r={3.5} fill="#FFFFFF" />
            </Svg>
          ) : (
            <Svg width={28} height={36} viewBox="0 0 28 36">
              <Path d="M14 35S1 21 1 13A13 13 0 0 1 27 13C27 21 14 35 14 35Z" fill="#7B2CD6" />
              <Circle cx={14} cy={13} r={5} fill="#FFFFFF" />
            </Svg>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: PIN_WIDTH, height: PIN_HEIGHT, alignItems: 'center', justifyContent: 'flex-end' },
});
