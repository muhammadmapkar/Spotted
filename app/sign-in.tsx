import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AUTH_HEADER } from '@/src/auth/headerArt';
import { formatCountdown } from '@/src/auth/forms';
import { exampleNumber, formatNational } from '@/src/auth/phone';
import { useAuth } from '@/src/auth/AuthContext';
import { useSignInFlow } from '@/src/auth/useSignInFlow';
import { CountryPicker } from '@/src/components/auth/CountryPicker';
import { FlagBadge } from '@/src/components/auth/FlagBadge';
import { OtpInput } from '@/src/components/auth/OtpInput';
import { SignInHeader } from '@/src/components/auth/SignInHeader';
import { Icon } from '@/src/components/icons/Icon';
import { AppText, PrimaryButton, TextField } from '@/src/components/ui/ui';
import { findUser, saveUser } from '@/src/db';
import { openPrivacyPolicy, openTerms } from '@/src/legal';
import { authService } from '@/src/services/auth';
import { useTheme } from '@/src/theme/ThemeProvider';

// Sign in with a phone number, in three steps: phone, code, details (first time only).
// This is a LOCAL DEMO: the "text message" is fake and the code is always 123456 (see
// src/services/auth.ts). The signed-in person is saved on the phone only.
export default function SignInScreen() {
  const { palette } = useTheme();
  const { signIn } = useAuth();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [pickingCountry, setPickingCountry] = useState(false);

  const flow = useSignInFlow({ auth: authService, findUser, saveUser, onSignedIn: signIn });

  // Everything in the header is drawn for a 390 px wide phone and scaled to fit.
  const s = Math.min(width / AUTH_HEADER.width, 1.3);
  const sheetTop = AUTH_HEADER.sheetTop * s;

  // The white sheet slides up from the bottom (0.55 s).
  const rise = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) rise.value = withTiming(1, { duration: 550, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
  }, [reduceMotion, rise]);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - rise.value) * (height - sheetTop) }] }));

  return (
    <View style={[styles.screen, { backgroundColor: palette.brand }]}>
      <StatusBar style="light" />
      <SignInHeader scale={s} width={width} />

      <Animated.View style={[styles.sheet, { top: sheetTop, backgroundColor: palette.bg }, sheetStyle]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {flow.step === 'phone' ? (
              <View style={styles.stack}>
                <View>
                  <AppText weight="700" size={26} style={{ letterSpacing: -0.3 }}>Welcome to Spotted</AppText>
                  <AppText tone="muted" size={14} style={{ marginTop: 6 }}>
                    Sign in with your phone number to start saving places.
                  </AppText>
                </View>

                <View>
                  <AppText weight="600" size={13} style={{ marginBottom: 8 }}>Phone number</AppText>
                  <TextField
                    invalid={!!flow.phoneError}
                    value={formatNational(flow.country, flow.national)}
                    onChangeText={flow.setNational}
                    placeholder={exampleNumber(flow.country)}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    accessibilityLabel="Phone number"
                    returnKeyType="done"
                    onSubmitEditing={flow.submitPhone}
                    leading={
                      <Pressable
                        onPress={() => setPickingCountry(true)}
                        accessibilityRole="button"
                        accessibilityLabel={`Country code ${flow.country.dial}, change`}
                        style={[styles.countryButton, { borderRightColor: palette.line }]}>
                        <FlagBadge country={flow.country} />
                        <AppText weight="600" size={15}>{flow.country.dial}</AppText>
                        <Icon name="chevron" size={13} color={palette.text} />
                      </Pressable>
                    }
                  />
                  {flow.phoneError ? (
                    <AppText tone="red" weight="600" size={12} style={{ marginTop: 8 }}>{flow.phoneError}</AppText>
                  ) : (
                    <AppText tone="muted" size={12} style={{ marginTop: 8 }}>
                      We'll text you a 6-digit code to confirm it's you.
                    </AppText>
                  )}
                </View>

                <PrimaryButton label="Send code" onPress={flow.submitPhone} loading={flow.sending} />

                <AppText tone="muted" size={11} style={{ textAlign: 'center' }}>
                  By continuing you agree to Spotted's{' '}
                  <AppText tone="acc" weight="600" size={11} onPress={openTerms} accessibilityRole="link">Terms</AppText>
                  {' '}and{' '}
                  <AppText tone="acc" weight="600" size={11} onPress={openPrivacyPolicy} accessibilityRole="link">Privacy Policy</AppText>.
                </AppText>
              </View>
            ) : null}

            {flow.step === 'code' ? (
              <View style={styles.stack}>
                <Pressable onPress={flow.backToPhone} accessibilityRole="button" style={styles.backRow}>
                  <Icon name="back" size={16} color={palette.acc} />
                  <AppText tone="acc" weight="600" size={13}>Change number</AppText>
                </Pressable>

                <View>
                  <AppText weight="700" size={26} style={{ letterSpacing: -0.3 }}>Enter the code</AppText>
                  <AppText tone="muted" size={14} style={{ marginTop: 6 }}>Sent by SMS to {flow.phoneDisplay}</AppText>
                  {authService.isDemo ? (
                    <AppText tone="muted" size={12} style={{ marginTop: 4 }}>
                      Demo: no text message is sent. The code is {flow.demoCode}.
                    </AppText>
                  ) : null}
                </View>

                <OtpInput value={flow.code} onChangeText={flow.setCode} shakeKey={flow.shake} invalid={flow.codeError} editable={!flow.verifying} />

                {flow.codeError ? (
                  <AppText tone="red" weight="600" size={13} style={{ marginTop: -6 }}>
                    That code didn't match. Please try again.
                  </AppText>
                ) : null}

                <View style={styles.resendRow}>
                  {flow.canResend ? (
                    <Pressable onPress={flow.resend} accessibilityRole="button" style={styles.linkButton}>
                      <AppText tone="acc" weight="600" size={13}>Resend code</AppText>
                    </Pressable>
                  ) : (
                    <AppText tone="muted" size={13}>Resend code in {formatCountdown(flow.resendIn)}</AppText>
                  )}
                  {flow.demoCode ? (
                    <Pressable onPress={flow.useDemoCode} accessibilityRole="button" style={styles.linkButton}>
                      <AppText tone="acc" weight="600" size={13}>Use demo code {flow.demoCode}</AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {flow.step === 'details' ? (
              <View style={styles.stack}>
                <View>
                  <AppText weight="700" size={26} style={{ letterSpacing: -0.3 }}>Almost there</AppText>
                  <AppText tone="muted" size={14} style={{ marginTop: 6 }}>Tell us your name and email.</AppText>
                </View>

                <View>
                  <AppText weight="600" size={13} style={{ marginBottom: 8 }}>Name</AppText>
                  <TextField
                    invalid={!!flow.nameError}
                    value={flow.name}
                    onChangeText={flow.setName}
                    placeholder="Your name"
                    autoComplete="name"
                    textContentType="name"
                    autoCapitalize="words"
                    returnKeyType="next"
                    accessibilityLabel="Name"
                  />
                  {flow.nameError ? <AppText tone="red" weight="600" size={12} style={{ marginTop: 6 }}>{flow.nameError}</AppText> : null}
                </View>

                <View>
                  <AppText weight="600" size={13} style={{ marginBottom: 8 }}>Email</AppText>
                  <TextField
                    invalid={!!flow.emailError}
                    value={flow.email}
                    onChangeText={flow.setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="done"
                    onSubmitEditing={flow.submitDetails}
                    accessibilityLabel="Email"
                  />
                  {flow.emailError ? <AppText tone="red" weight="600" size={12} style={{ marginTop: 6 }}>{flow.emailError}</AppText> : null}
                </View>

                <PrimaryButton label="Start exploring" onPress={flow.submitDetails} loading={flow.saving} />
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      <CountryPicker
        visible={pickingCountry}
        selected={flow.country}
        onSelect={(country) => {
          flow.chooseCountry(country);
          setPickingCountry(false);
        }}
        onClose={() => setPickingCountry(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  content: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 32 },
  stack: { gap: 18 },
  countryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingRight: 10, borderRightWidth: 1.5 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  linkButton: { minHeight: 44, justifyContent: 'center' },
});
