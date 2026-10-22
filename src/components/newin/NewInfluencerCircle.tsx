import { Pressable, StyleSheet, View } from 'react-native';

import { InfluencerAvatar } from '@/src/components/home/InfluencerCard';
import { NewBadge } from '@/src/components/NewBadge';
import { Animated, usePopIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { NewInfluencerItem } from '@/src/newin/newInData';
import { JUST_JOINED } from '@/src/newin/newInData';
import { useTheme } from '@/src/theme/ThemeProvider';

// A new influencer (prototype: .ic): profile picture (or initial), @handle and a "JUST JOINED" badge.
// Tapping opens the Influencer page. The circles pop in one after another.
export function NewInfluencerCircle({ item, onPress }: { item: NewInfluencerItem; onPress: () => void }) {
  const { palette } = useTheme();
  const pop = usePopIn(item.delay);
  const { influencer } = item;
  return (
    <Animated.View style={pop}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`@${influencer.handle}, just joined Spotted`}
        style={[styles.tile, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <InfluencerAvatar influencer={influencer} size={62} />
        <AppText weight="700" size={12} numberOfLines={1}>@{influencer.handle}</AppText>
        <View><NewBadge label={JUST_JOINED} /></View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: { width: 120, alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1 },
});
