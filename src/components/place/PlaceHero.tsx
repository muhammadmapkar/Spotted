import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/src/components/icons/Icon';
import { ShopFront } from '@/src/components/place/ShopFront';
import { AppText } from '@/src/components/ui/ui';
import { Place } from '@/src/data/mock';
import { heroPhotoUrl } from '@/src/place/placeData';

export const HERO_HEIGHT = 270;

// The picture at the top of the Place page (prototype: .hero): the place's photo if it has one,
// otherwise the illustrated shop front. It slowly zooms out when the page opens (6 s).
// Back button top-left, "Spotted Partner" badge top-right for partners.
export function PlaceHero({ place, onBack }: { place: Place; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const photo = heroPhotoUrl(place);

  const zoom = useSharedValue(reduceMotion ? 1 : 1.16);
  useEffect(() => {
    if (!reduceMotion) zoom.value = withTiming(1, { duration: 6000, easing: Easing.out(Easing.ease) });
  }, [reduceMotion, zoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  return (
    <View style={styles.hero}>
      <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
            accessible
            accessibilityLabel={`Front entrance and signboard of ${place.name}`}
          />
        ) : (
          <ShopFront place={place} />
        )}
      </Animated.View>

      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={[styles.back, { top: insets.top + 10 }]}>
        <Icon name="back" size={22} color="#1C0F2E" />
      </Pressable>

      {place.partner ? (
        <LinearGradient
          colors={['#6A1FB0', '#9D4EDD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.partner, { top: insets.top + 20 }]}>
          <AppText tone="onBrand" weight="700" size={11}>Spotted Partner</AppText>
        </LinearGradient>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, overflow: 'hidden' },
  back: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
  },
  partner: { position: 'absolute', right: 16, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
});
