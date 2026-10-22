import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

// A temporary screen for a tab that is still being built from the design prototype.
export function ComingSoon({ title, text }: { title: string; text: string }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + 24, paddingHorizontal: 20 }}>
      <AppText weight="700" size={26} style={{ letterSpacing: -0.3 }}>{title}</AppText>
      <AppText tone="muted" size={14} style={{ marginTop: 8, lineHeight: 21 }}>{text}</AppText>
    </View>
  );
}
