import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/AuthContext';
import { displayFromE164 } from '@/src/auth/phone';
import { Icon } from '@/src/components/icons/Icon';
import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

// Profile (a simple version for now; the full one with savings and loyalty cards comes in a later step).
// It is also where Settings opens from, since Settings is no longer a tab.
export default function ProfileScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const initial = (user?.name?.trim().charAt(0) || 'S').toUpperCase();

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
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + 24, paddingHorizontal: 20 }}>
      <View style={styles.header}>
        <LinearGradient colors={['#9D4EDD', '#D62839']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <AppText tone="onBrand" weight="800" size={34}>{initial}</AppText>
        </LinearGradient>
        <AppText weight="700" size={21} style={{ marginTop: 10 }}>{user?.name ?? 'Spotted'}</AppText>
        {user ? <AppText tone="muted" size={13}>{user.email}</AppText> : null}
        {user ? <AppText weight="600" size={13} style={{ marginTop: 4 }}>{displayFromE164(user.phone)}</AppText> : null}
      </View>

      <View style={{ gap: 10, marginTop: 28 }}>
        {row('Settings', () => router.push('/settings' as never))}
        {row('Sign out', () => signOut(), true)}
      </View>

      <AppText tone="muted" size={12} style={{ marginTop: 20, textAlign: 'center' }}>
        Your savings and loyalty cards are coming in a later step.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 2 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
});
