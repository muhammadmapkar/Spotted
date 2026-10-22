import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { TapSwitch } from '@/src/components/ui/TapSwitch';
import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

// One row of the Notifications card (prototype): a coloured icon box, a title with an optional line under it,
// and a switch on the right. `onColor` is the colour of the switch when it is on (WhatsApp is green).
export function ToggleRow({
  icon,
  iconBackground,
  title,
  subtitle,
  value,
  onChange,
  onColor = '#7B2CD6',
}: {
  icon: ReactNode;
  iconBackground: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  onColor?: string;
}) {
  const { palette } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>{icon}</View>
      <View style={styles.text}>
        <AppText weight="600" size={14}>{title}</AppText>
        {subtitle ? <AppText tone="muted" size={12}>{subtitle}</AppText> : null}
      </View>
      <TapSwitch value={value} onValueChange={onChange} label={title} trackColor={{ false: palette.line, true: onColor }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, padding: 14, borderRadius: 18, borderWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
});
