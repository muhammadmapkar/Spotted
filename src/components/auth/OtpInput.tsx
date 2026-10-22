import { useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { OTP_LENGTH, otpBoxes } from '@/src/auth/forms';
import { AppText } from '@/src/components/ui/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

// Six boxes that fill one by one, with ONE hidden text box on top that does the real typing.
// That single hidden box is what lets the phone auto-fill the SMS code (iOS "one-time code",
// Android "sms-otp"). When `shakeKey` goes up (a wrong code) the boxes shake.
export function OtpInput({
  value,
  onChangeText,
  shakeKey,
  invalid,
  editable = true,
}: {
  value: string;
  onChangeText: (text: string) => void;
  shakeKey: number;
  invalid: boolean;
  editable?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const shift = useSharedValue(0);

  useEffect(() => {
    if (shakeKey === 0 || reduceMotion) return;
    shift.value = withSequence(
      withTiming(-9, { duration: 90 }),
      withTiming(8, { duration: 90 }),
      withTiming(-5, { duration: 90 }),
      withTiming(3, { duration: 90 }),
      withTiming(0, { duration: 90 })
    );
  }, [shakeKey, reduceMotion, shift]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));

  return (
    <Animated.View style={shakeStyle}>
      <View style={styles.row}>
        {otpBoxes(value).map((box, index) => (
          <OtpBox key={index} char={box.char} filled={box.filled} active={box.active && editable} invalid={invalid} />
        ))}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          importantForAutofill="yes"
          maxLength={OTP_LENGTH * 2} // a pasted "123 456" is tidied to 6 digits
          caretHidden
          accessibilityLabel="6-digit code"
          style={styles.hidden}
        />
      </View>
    </Animated.View>
  );
}

function OtpBox({ char, filled, active, invalid }: { char: string; filled: boolean; active: boolean; invalid: boolean }) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  // A box "pops" as its digit appears.
  useEffect(() => {
    if (!filled || reduceMotion) return;
    scale.value = 0.3;
    scale.value = withSequence(withTiming(1.07, { duration: 175 }), withTiming(1, { duration: 75 }));
  }, [filled, char, reduceMotion, scale]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        styles.box,
        {
          backgroundColor: palette.surface,
          borderColor: invalid ? palette.red : filled || active ? palette.brand : palette.line,
          shadowColor: palette.brand,
          shadowOpacity: active ? 0.35 : 0,
          shadowRadius: 4,
          elevation: active ? 3 : 0,
        },
        popStyle,
      ]}>
      <AppText weight="700" size={22}>{char}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, height: 56, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  // The real input covers the boxes and is practically invisible, so any tap on the boxes starts
  // typing. (Not exactly 0: some phones will not offer SMS auto-fill to a fully invisible box.)
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: 'transparent' },
});
