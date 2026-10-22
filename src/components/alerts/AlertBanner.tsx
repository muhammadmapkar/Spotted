import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { hrefForAlert } from '@/src/alerts/links';
import { BannerAlert, hideBanner, showBanner, useBanner } from '@/src/alerts/bannerStore';
import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

// One banner, sliding down from the top (prototype: .notif and its "notif" animation, 0.55 s).
function Banner({ alert, onPress }: { alert: BannerAlert; onPress: () => void }) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const slide = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    slide.value = reduceMotion ? 1 : withTiming(1, { duration: 550, easing: Easing.bezier(0.3, 1.3, 0.5, 1) });
  }, [alert.id, reduceMotion, slide]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -160 * (1 - slide.value) }], opacity: Math.min(1, slide.value * 4) }));
  const dark = scheme === 'dark';

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 12 }, style]} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${alert.title}. ${alert.body}`}
        accessibilityLiveRegion="polite"
        style={[styles.banner, { backgroundColor: dark ? 'rgba(42,26,68,0.97)' : 'rgba(255,255,255,0.96)' }]}>
        <LinearGradient colors={['#9D4EDD', '#5A189A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
          <Svg width={14} height={22} viewBox="0 0 14 22"><Path d="M0 0H14V22L7 17 0 22Z" fill="#E5383B" /></Svg>
        </LinearGradient>
        <View style={styles.text}>
          <AppText size={11} style={{ opacity: 0.75, color: dark ? '#F4EEFC' : '#1C0F2E' }}>
            <AppText weight="700" size={11} style={{ color: dark ? '#F4EEFC' : '#1C0F2E' }}>SPOTTED</AppText> · now
          </AppText>
          <AppText weight="700" size={14} style={{ color: dark ? '#F4EEFC' : '#1C0F2E' }}>{alert.title}</AppText>
          <AppText size={12} style={{ opacity: 0.85, color: dark ? '#F4EEFC' : '#1C0F2E' }} numberOfLines={2}>{alert.body}</AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Lives at the top of the app (stage "app"). When an alert arrives while Spotted is open, the phone does not show
// its own banner (see app/_layout.tsx); this one does. Tapping it opens the place.
export function AlertBannerHost() {
  const router = useRouter();
  const alert = useBanner();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const { identifier, content } = notification.request;
      showBanner({ id: identifier, title: content.title ?? 'Spotted', body: content.body ?? '', href: hrefForAlert(content.data) });
    });
    return () => subscription.remove();
  }, []);

  if (!alert) return null;
  return (
    <Banner
      alert={alert}
      onPress={() => {
        hideBanner();
        if (alert.href) router.push(alert.href as never);
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 10, right: 10, zIndex: 40 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 22, boxShadow: '0 14px 34px rgba(20,0,50,0.3)' },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'flex-start' },
  text: { flex: 1, minWidth: 0, gap: 1 },
});
