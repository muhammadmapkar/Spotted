import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/src/components/icons/Icon';
import { IconName } from '@/src/components/icons/paths';
import { Animated, usePopIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { Platform } from '@/src/data/mock';
import { useTheme } from '@/src/theme/ThemeProvider';

const ICON: Record<Platform, IconName> = { ig: 'camera', tt: 'music', yt: 'video' };
const ICON_COLOR: Partial<Record<Platform, string>> = { ig: '#C13584', yt: '#E52D27' }; // TikTok uses the text colour

// A button for one platform the influencer is on (prototype: .ptile): icon + label. Tapping opens their
// profile. The buttons pop in one by one (`delay`).
export function PlatformTile({ platform, label, delay, onPress }: { platform: Platform; label: string; delay: number; onPress: () => void }) {
  const { palette } = useTheme();
  const pop = usePopIn(delay, 400);
  return (
    <Animated.View style={pop}>
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`Open on ${label}`}
        style={[styles.tile, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Icon name={ICON[platform]} size={16} color={ICON_COLOR[platform] ?? palette.text} />
        <AppText weight="600" size={13}>{label}</AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
});
