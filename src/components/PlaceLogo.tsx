import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { Place, thumbColors } from '@/src/data/mock';
import { POPPINS } from '@/src/theme/fonts';

// A place's logo: its two-letter monogram in white on a gradient of the place's colours
// (from the light colour c2 to the dark colour c1, like the prototype).
//   <PlaceLogo place={place} size={60} />                       a circle
//   <PlaceLogo place={place} size={76} shape="square" />        a rounded square
export function PlaceLogo({
  place,
  size = 60,
  shape = 'circle',
}: {
  place: Pick<Place, 'mono' | 'c1' | 'c2' | 'name'>;
  size?: number;
  shape?: 'circle' | 'square';
}) {
  return (
    <LinearGradient
      colors={thumbColors(place)}
      start={{ x: 0.2, y: 0.1 }} // the prototype's 145 degree diagonal
      end={{ x: 0.8, y: 0.9 }}
      accessible
      accessibilityLabel={`${place.name} logo`}
      style={[
        styles.logo,
        { width: size, height: size, borderRadius: shape === 'circle' ? size / 2 : size * 0.22 },
      ]}>
      <Text
        style={{ color: '#FFFFFF', fontFamily: POPPINS.extraBold, fontSize: size * 0.3, letterSpacing: -0.5 }}
        lightColor="#FFFFFF"
        darkColor="#FFFFFF">
        {place.mono}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
