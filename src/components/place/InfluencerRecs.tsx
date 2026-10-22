import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/src/components/icons/Icon';
import { IconName } from '@/src/components/icons/paths';
import { AppText } from '@/src/components/ui/ui';
import { Platform } from '@/src/data/mock';
import { NO_RECOMMENDATIONS, Recommendation } from '@/src/place/placeData';
import { MONO_SHADOW } from '@/src/theme/shadows';
import { useTheme } from '@/src/theme/ThemeProvider';

// The platform icon and the colours of the little reel button under the profile circle (prototype: .reel).
const PLATFORM_ICON: Record<Platform, IconName> = { ig: 'camera', tt: 'music', yt: 'play' };
const REEL_FLAT_COLOR: Partial<Record<Platform, string>> = { tt: '#111111', yt: '#E52D27' };
const INSTAGRAM_GRADIENT: [string, string, string] = ['#F58529', '#DD2A7B', '#8134AF'];

// The body of the "Influencer recommendations" dropdown: one row per influencer.
//   (circle)   @handle
//   [reel]     Instagram . 48.2K followers
//              Butter chicken ......... AED 48
// The circle (and the handle) open the Influencer page. The small platform-coloured button under the
// circle opens that exact reel.
export function InfluencerRecs({
  recs,
  onOpenInfluencer,
  onOpenReel,
}: {
  recs: Recommendation[];
  onOpenInfluencer: (influencerId: string) => void;
  onOpenReel: (rec: Recommendation) => void;
}) {
  const { palette } = useTheme();
  if (recs.length === 0) {
    return <AppText tone="muted" size={13} style={styles.empty}>{NO_RECOMMENDATIONS}</AppText>;
  }
  return (
    <View>
      {recs.map((rec, index) => (
        <View key={rec.influencer.id} style={[styles.rec, index > 0 && { borderTopWidth: 1, borderTopColor: palette.line }]}>
          <View style={styles.left}>
            <Pressable
              onPress={() => onOpenInfluencer(rec.influencer.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open @${rec.handle}'s page`}>
              {rec.profilePicUrl ? (
                <Image source={{ uri: rec.profilePicUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
              ) : (
                <LinearGradient colors={rec.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                  <AppText tone="onBrand" weight="700" size={18} style={MONO_SHADOW}>{rec.initial}</AppText>
                </LinearGradient>
              )}
            </Pressable>
            <Pressable
              onPress={() => onOpenReel(rec)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Watch @${rec.handle}'s reel on ${rec.platformLabel}`}>
              {rec.platform === 'ig' ? (
                <LinearGradient colors={INSTAGRAM_GRADIENT} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.reel}>
                  <Icon name={PLATFORM_ICON[rec.platform]} size={16} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <View style={[styles.reel, { backgroundColor: REEL_FLAT_COLOR[rec.platform] }]}>
                  <Icon name={PLATFORM_ICON[rec.platform]} size={16} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.right}>
            <Pressable
              onPress={() => onOpenInfluencer(rec.influencer.id)}
              hitSlop={{ top: 10, bottom: 6, left: 0, right: 40 }}
              accessibilityRole="button"
              accessibilityLabel={`Open @${rec.handle}'s page`}>
              <AppText weight="700" size={14}>@{rec.handle}</AppText>
            </Pressable>
            <AppText tone="muted" size={12} style={{ marginBottom: 4 }}>{rec.platformLabel} · {rec.followers} followers</AppText>
            {rec.items.map((item) => (
              <View key={item.name} style={styles.dish}>
                <AppText size={13} style={{ flexShrink: 1 }}>{item.name}</AppText>
                <AppText tone="acc" weight="700" size={13}>AED {item.price}</AppText>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { marginVertical: 10 },
  rec: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  left: { alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  reel: { width: 30, height: 30, marginTop: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  right: { flex: 1, minWidth: 0 },
  dish: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 3 },
});
