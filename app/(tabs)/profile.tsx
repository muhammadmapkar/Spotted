import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/AuthContext';
import { displayFromE164 } from '@/src/auth/phone';
import { RingAvatar } from '@/src/components/influencer/ProfileRing';
import { Icon } from '@/src/components/icons/Icon';
import { Toast } from '@/src/components/place/Toast';
import { LOYALTY_CARD_WIDTH, LoyaltyCardView } from '@/src/components/profile/LoyaltyCardView';
import { SavingsCard } from '@/src/components/profile/SavingsCard';
import { ToggleRow } from '@/src/components/profile/ToggleRow';
import { AppText } from '@/src/components/ui/ui';
import { getSettings, getWhatsappOffers, saveSettings, setWhatsappOffers } from '@/src/db';
import { NEARBY_SUBTITLE, SAVINGS_TOTAL, loyaltyViews, whatsappMessage, whatsappSubtitle } from '@/src/profile/profileData';
import { useCountUp } from '@/src/profile/useCountUp';
import { useTheme } from '@/src/theme/ThemeProvider';

// Profile (prototype: PROFILE): who you are, what you have saved with Spotted, your loyalty cards and the
// notification and dark-mode switches. Settings and Sign out are at the bottom (Settings is not a tab any more).
export default function ProfileScreen() {
  const { palette, scheme, setPreference } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user, signOut } = useAuth();
  const phone = user ? displayFromE164(user.phone) : '';
  const initial = (user?.name?.trim().charAt(0) || 'S').toUpperCase();

  // The savings number counts up (with a coin burst) each time this tab opens.
  const [openCount, setOpenCount] = useState(0);
  useFocusEffect(useCallback(() => { setOpenCount((n) => n + 1); }, []));
  const shown = useCountUp(SAVINGS_TOTAL, openCount, reduceMotion);

  // The two notification choices, loaded from the phone.
  const [whatsapp, setWhatsapp] = useState(false);
  const [nearby, setNearby] = useState(true);
  useEffect(() => {
    if (!user) return;
    getWhatsappOffers(user.phone).then(setWhatsapp).catch(() => {});
  }, [user]);
  useFocusEffect(
    useCallback(() => {
      getSettings().then((settings) => setNearby(settings.remindersEnabled)).catch(() => {});
    }, [])
  );

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2300);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // WhatsApp: ONLY controls whether new offers are sent to WhatsApp. The choice is saved with the profile.
  const changeWhatsapp = (on: boolean) => {
    setWhatsapp(on);
    showToast(whatsappMessage(on));
    if (user) setWhatsappOffers(user.phone, on).catch(() => { setWhatsapp(!on); showToast("Couldn't save that choice"); });
  };
  // Nearby saved-place alerts are normal app notifications (the same switch as "Nearby reminders" in Settings).
  const changeNearby = (on: boolean) => {
    setNearby(on);
    saveSettings({ remindersEnabled: on }).catch(() => { setNearby(!on); showToast("Couldn't save that choice"); });
  };

  const cards = loyaltyViews();
  const dark = scheme === 'dark';

  const row = (label: string, onPress: () => void, danger = false) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <AppText weight="600" size={15} tone={danger ? 'red' : 'text'} style={{ flex: 1 }}>{label}</AppText>
      {danger ? null : <View style={{ transform: [{ rotate: '180deg' }] }}><Icon name="back" size={16} color={palette.muted} /></View>}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <RingAvatar initial={initial} gradient={['#9D4EDD', '#D62839']} label="Your profile picture" />
          <AppText weight="700" size={21} style={{ marginTop: 6 }}>{user?.name ?? 'Spotted'}</AppText>
          {user ? <AppText tone="muted" size={13}>{user.email}</AppText> : null}
          {user ? (
            <View style={styles.phoneRow}>
              <AppText weight="600" size={13}>{phone}</AppText>
              <View style={styles.tick} accessible accessibilityLabel="Verified"><Icon name="check" size={12} color="#FFFFFF" strokeWidth={3} /></View>
            </View>
          ) : null}
        </View>

        <View style={styles.pad}>
          <SavingsCard shown={shown} runKey={openCount} />
        </View>

        <View style={styles.headingRow}>
          <AppText weight="700" size={17} accessibilityRole="header">My loyalty cards</AppText>
          <AppText tone="muted" size={12}>Swipe</AppText>
        </View>
        <FlatList
          horizontal
          data={cards}
          keyExtractor={(view) => view.card.placeId}
          showsHorizontalScrollIndicator={false}
          snapToInterval={LOYALTY_CARD_WIDTH + 14}
          decelerationRate="fast"
          contentContainerStyle={styles.cards}
          renderItem={({ item }) => <LoyaltyCardView view={item} onPress={() => router.push(`/venue/${item.place.id}` as never)} />}
        />

        <View style={[styles.pad, styles.notifications]}>
          <AppText weight="700" size={17} accessibilityRole="header">Notifications</AppText>
          <ToggleRow
            icon={<Icon name="chat" size={20} color="#1F8F4E" />}
            iconBackground={dark ? '#113D2A' : '#DDF5E6'}
            title="Get new offers on WhatsApp"
            subtitle={whatsappSubtitle(phone)}
            value={whatsapp}
            onChange={changeWhatsapp}
            onColor="#1F8F4E"
          />
          <ToggleRow
            icon={<Icon name="bell" size={20} color={palette.acc} />}
            iconBackground={palette.chip}
            title="Nearby saved-place alerts"
            subtitle={NEARBY_SUBTITLE}
            value={nearby}
            onChange={changeNearby}
          />
          <ToggleRow
            icon={<Icon name="moon" size={20} color={palette.acc} />}
            iconBackground={palette.chip}
            title="Dark mode"
            value={dark}
            onChange={(on) => setPreference(on ? 'dark' : 'light')}
          />
          <View style={{ gap: 10, marginTop: 10 }}>
            {row('Settings', () => router.push('/settings' as never))}
            {row('Sign out', () => signOut(), true)}
          </View>
        </View>
      </ScrollView>
      <Toast message={toast} bottom={insets.bottom + 100} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 6, paddingHorizontal: 20 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tick: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#1F8F4E', alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 20 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24 },
  cards: { gap: 14, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  notifications: { marginTop: 24, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
});
