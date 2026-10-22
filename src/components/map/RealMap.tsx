import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { PinShape } from '@/src/components/map/PinShape';
import { UserDot } from '@/src/components/map/UserDot';
import { MapPin, circleMeters, pinCoordinates, startRegion } from '@/src/map/mapData';
import { mapStyleFor } from '@/src/map/mapStyle';
import { darkPalette } from '@/constants/Theme';
import { useTheme } from '@/src/theme/ThemeProvider';

type Point = { latitude: number; longitude: number };

// One pin on the real map. Custom pin pictures are only redrawn while "tracksViewChanges" is on,
// so it stays on just long enough for the drop-in and for growing when selected, then goes off (saves battery).
function MapPinMarker({ pin, center, selected, onSelect }: { pin: MapPin; center: Point; selected: boolean; onSelect: (id: string) => void }) {
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    setTracking(true);
    const timer = setTimeout(() => setTracking(false), pin.delay + 900);
    return () => clearTimeout(timer);
  }, [pin.delay, selected]);
  return (
    <Marker
      coordinate={pinCoordinates(center, pin.place)}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracking}
      zIndex={selected ? 2 : 1}
      accessibilityLabel={pin.place.name}
      onPress={(event) => {
        event.stopPropagation(); // do not let the map count this as a tap on empty ground
        onSelect(pin.place.id);
      }}>
      <PinShape kind={pin.kind} selected={selected} delay={pin.delay} />
    </Marker>
  );
}

// The real map (react-native-maps): the 15 km circle, the blue dot, and the pins.
// Only used when it is safe: on Android that means a Google Maps key is built in (see app/(tabs)/map.tsx).
export function RealMap({ center, pins, selectedId, onSelect, onClear }: { center: Point; pins: MapPin[]; selectedId: string | null; onSelect: (id: string) => void; onClear: () => void }) {
  const { scheme } = useTheme();
  const mapRef = useRef<MapView>(null);

  // When the phone finds the user's real position, glide there.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    mapRef.current?.animateToRegion(startRegion(center), 600);
  }, [center.latitude, center.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={startRegion(center)}
      userInterfaceStyle={scheme}
      customMapStyle={mapStyleFor(scheme, darkPalette)}
      onPress={onClear} // tapping empty ground closes the card
      toolbarEnabled={false}
      showsCompass={false}>
      <Circle
        center={center}
        radius={circleMeters}
        strokeColor="rgba(160,97,240,0.8)"
        strokeWidth={2}
        lineDashPattern={[12, 8]}
        fillColor="rgba(160,97,240,0.10)"
      />
      <Marker coordinate={center} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges zIndex={0} accessibilityLabel="Your location" tappable={false}>
        <UserDot />
      </Marker>
      {pins.map((pin) => (
        <MapPinMarker key={pin.place.id} pin={pin} center={center} selected={pin.place.id === selectedId} onSelect={onSelect} />
      ))}
    </MapView>
  );
}
