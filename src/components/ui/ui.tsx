import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, TextInputProps, TextProps, Text as RNText, View } from 'react-native';

import { fontFamilyFor } from '@/src/theme/fonts';
import { useTheme } from '@/src/theme/ThemeProvider';

// Small building blocks in the new purple design. They read colours from useTheme().

type Tone = 'text' | 'muted' | 'acc' | 'red' | 'onBrand';

// Text in Poppins. `weight` picks the font file; `tone` picks the colour from the theme.
export function AppText({
  tone = 'text',
  weight = '400',
  size = 14,
  style,
  ...rest
}: TextProps & { tone?: Tone; weight?: '400' | '500' | '600' | '700' | '800'; size?: number }) {
  const { palette } = useTheme();
  const color = tone === 'onBrand' ? '#FFFFFF' : palette[tone];
  return <RNText {...rest} style={[{ color, fontSize: size, fontFamily: fontFamilyFor(weight) }, style]} />;
}

// The big purple button.
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.btn,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          shadowColor: '#6A1FB0',
        },
      ]}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <AppText tone="onBrand" weight="600" size={16}>{label}</AppText>}
    </Pressable>
  );
}

// A text box with a label-free rounded frame that turns purple when focused (red on error).
export function TextField({
  leading,
  invalid = false,
  style,
  ...rest
}: TextInputProps & { leading?: ReactNode; invalid?: boolean }) {
  const { palette } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: palette.surface, borderColor: invalid ? palette.red : focused ? palette.brand : palette.line },
      ]}>
      {leading}
      <TextInput
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.text, fontFamily: fontFamilyFor('400') }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14 },
  input: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: 12 },
});
