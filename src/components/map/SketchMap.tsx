import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { PIN_HEIGHT, PIN_WIDTH, PinShape } from '@/src/components/map/PinShape';
import { UserDot } from '@/src/components/map/UserDot';
import { MapPin, sketchOffset } from '@/src/map/mapData';
import { useTheme } from '@/src/theme/ThemeProvider';

// A drawn map (prototype: the .map SVG) used when the real Google map cannot be shown yet, i.e. on Android
// before a Google Maps key is built in. The pins sit around the blue dot by distance and direction.
// It looks like the real map screen, but cannot be moved or zoomed.
export function SketchMap({ pins, selectedId, onSelect, onClear }: { pins: MapPin[]; selectedId: string | null; onSelect: (id: string) => void; onClear: () => void }) {
  const { palette } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => setSize(event.nativeEvent.layout);

  const cx = size.width / 2;
  const cy = size.height * 0.49;
  const radius = Math.min(size.width * 0.41, size.height * 0.34); // the 15 km circle, in pixels

  return (
    <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: palette.mapLand }]} onPress={onClear} onLayout={onLayout} accessible={false}>
      {/* the streets, water and parks */}
      <Svg width="100%" height="100%" viewBox="0 0 390 760" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Path d="M0 610 C 60 590, 120 640, 170 690 S 260 760, 300 760 L 0 760 Z" fill={palette.mapWater} />
        <Rect x={250} y={250} width={90} height={70} rx={14} fill={palette.mapPark} />
        <Rect x={40} y={300} width={70} height={90} rx={14} fill={palette.mapPark} />
        <Circle cx={300} cy={560} r={36} fill={palette.mapPark} />
        <Path d="M0 120H390M0 200H390M0 470H390M0 540H390M70 0V760M150 0V760M240 0V760M320 0V760" stroke={palette.mapMinor} strokeWidth={6} fill="none" />
        <Path d="M-10 420 C 90 400, 150 380, 200 380 S 320 330, 400 300" stroke={palette.mapRoad} strokeWidth={16} strokeLinecap="round" fill="none" />
        <Path d="M180 -10 C 190 120, 175 260, 195 380 S 220 640, 210 770" stroke={palette.mapRoad} strokeWidth={14} strokeLinecap="round" fill="none" />
        <Path d="M-10 170 C 120 190, 260 140, 400 90" stroke={palette.mapRoad} strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d="M30 770 C 90 600, 260 560, 400 620" stroke={palette.mapRoad} strokeWidth={10} strokeLinecap="round" fill="none" />
      </Svg>

      {size.width > 0 ? (
        <>
          {/* the 15 km circle: dashed purple edge, light purple fill */}
          <View
            pointerEvents="none"
            style={[styles.circle, { left: cx - radius, top: cy - radius, width: radius * 2, height: radius * 2, borderRadius: radius }]}
          />
          <View pointerEvents="none" style={{ position: 'absolute', left: cx - 36, top: cy - 36 }}>
            <UserDot />
          </View>
          {pins.map((pin) => {
            const { x, y } = sketchOffset(pin.place, radius);
            return (
              <Pressable
                key={pin.place.id}
                onPress={() => onSelect(pin.place.id)}
                accessibilityRole="button"
                accessibilityLabel={`${pin.place.name}, ${pin.place.dist} km away`}
                style={{ position: 'absolute', left: cx + x - PIN_WIDTH / 2, top: cy + y - PIN_HEIGHT }}>
                <PinShape kind={pin.kind} selected={pin.place.id === selectedId} delay={pin.delay} />
              </Pressable>
            );
          })}
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { position: 'absolute', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(160,97,240,0.8)', backgroundColor: 'rgba(160,97,240,0.10)' },
});
