import { View } from 'react-native';

import { Icon } from '@/src/components/icons/Icon';
import { Animated, useRiseIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { useAreaName } from '@/src/location/useAreaName';
import { useTheme } from '@/src/theme/ThemeProvider';

// "You're in  Khalifa City, Abu Dhabi": a red pin in a rounded square, then where the user is.
export function LocationRow() {
  const { palette } = useTheme();
  const { area } = useAreaName();
  const rise = useRiseIn(0);
  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 10 }, rise]}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: palette.chip, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="pin" size={20} color={palette.red} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText tone="muted" weight="500" size={11}>You're in</AppText>
        <AppText weight="700" size={16} numberOfLines={1} accessibilityLabel={`You're in ${area}`}>{area}</AppText>
      </View>
    </Animated.View>
  );
}
