import { useCallback, useEffect, useRef, useState } from 'react';

import { UserProfile } from '../db/types';
import { AuthService } from '../services/auth';
import { OTP_LENGTH, RESEND_SECONDS, cleanOtp, validateEmail, validateName } from './forms';
import { Country, DEFAULT_COUNTRY, cleanNational, displayPhone, toE164, validatePhone } from './phone';

// The brain of the sign-in screens: which step we are on, checking the phone number, sending and
// checking the code, the resend countdown, and the first-time details. The screens only show it.
// Kept free of any phone-only code so it can be tested on its own.

export type SignInStep = 'phone' | 'code' | 'details';

// After the 6th digit is typed we wait a moment (like the prototype) and then check the code.
export const AUTO_CHECK_DELAY_MS = 350;

export interface SignInDeps {
  auth: AuthService;
  findUser: (phone: string) => Promise<UserProfile | null>;
  saveUser: (profile: { phone: string; name: string; email: string }) => Promise<UserProfile>;
  onSignedIn: (user: UserProfile) => Promise<void> | void;
}

export function useSignInFlow(deps: SignInDeps) {
  // The newest versions of the helpers, for timers that fire later.
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const [step, setStep] = useState<SignInStep>('phone');

  // Step 1: the phone number
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [national, setNationalState] = useState(''); // digits only
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Step 2: the code
  const [code, setCodeState] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [shake, setShake] = useState(0); // goes up by one each time the code is wrong (the boxes shake)
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0); // seconds until "Resend code" works

  // Step 3: the details
  const [name, setNameState] = useState('');
  const [email, setEmailState] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const phone = toE164(country, national);
  const phoneRef = useRef(phone);
  phoneRef.current = phone;
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Count down once a second.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => () => clearTimeout(verifyTimer.current), []);

  // ---- step 1 -----------------------------------------------------------------------------
  const setNational = useCallback((text: string) => {
    setNationalState(cleanNational(text).slice(0, 12));
    setPhoneError(null);
  }, []);

  const chooseCountry = useCallback((next: Country) => {
    setCountry(next);
    setPhoneError(null);
  }, []);

  const submitPhone = useCallback(async () => {
    const problem = validatePhone(country, national);
    if (problem) {
      setPhoneError(problem);
      return;
    }
    setPhoneError(null);
    setSending(true);
    try {
      await depsRef.current.auth.sendCode(phoneRef.current);
      setCodeState('');
      setCodeError(false);
      setStep('code');
      setResendIn(RESEND_SECONDS);
    } catch {
      setPhoneError("We couldn't send the code. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }, [country, national]);

  // ---- step 2 -----------------------------------------------------------------------------
  const verify = useCallback(async (value: string) => {
    setVerifying(true);
    try {
      const ok = await depsRef.current.auth.verifyCode(phoneRef.current, value);
      if (!ok) {
        setCodeState('');
        setCodeError(true);
        setShake((n) => n + 1);
        return;
      }
      // A number that has signed in on this phone before goes straight in. A new one gives details first.
      const known = await depsRef.current.findUser(phoneRef.current);
      if (known) await depsRef.current.onSignedIn(known);
      else setStep('details');
    } catch {
      setCodeError(true);
    } finally {
      setVerifying(false);
    }
  }, []);

  // Typing the code. The 6th digit starts the automatic check.
  const setCode = useCallback(
    (text: string) => {
      const value = cleanOtp(text);
      setCodeState(value);
      setCodeError(false);
      clearTimeout(verifyTimer.current);
      if (value.length === OTP_LENGTH) {
        verifyTimer.current = setTimeout(() => verify(value), AUTO_CHECK_DELAY_MS);
      }
    },
    [verify]
  );

  const backToPhone = useCallback(() => {
    clearTimeout(verifyTimer.current);
    setCodeState('');
    setCodeError(false);
    setStep('phone');
  }, []);

  const resend = useCallback(async () => {
    if (resendIn > 0) return;
    try {
      await depsRef.current.auth.sendCode(phoneRef.current);
      setCodeState('');
      setCodeError(false);
      setResendIn(RESEND_SECONDS);
    } catch {
      setCodeError(true);
    }
  }, [resendIn]);

  // The demo's shortcut: fills in the demo code (only when the service is the fake one).
  const demoCode = deps.auth.isDemo ? deps.auth.demoCode : undefined;
  const useDemoCode = useCallback(() => {
    if (demoCode) setCode(demoCode);
  }, [demoCode, setCode]);

  // ---- step 3 -----------------------------------------------------------------------------
  const setName = useCallback((text: string) => {
    setNameState(text);
    setNameError(null);
  }, []);
  const setEmail = useCallback((text: string) => {
    setEmailState(text);
    setEmailError(null);
  }, []);

  const submitDetails = useCallback(async () => {
    const nameProblem = validateName(name);
    const emailProblem = validateEmail(email);
    setNameError(nameProblem);
    setEmailError(emailProblem);
    if (nameProblem || emailProblem) return;
    setSaving(true);
    try {
      const user = await depsRef.current.saveUser({ phone: phoneRef.current, name, email });
      await depsRef.current.onSignedIn(user);
    } finally {
      setSaving(false);
    }
  }, [name, email]);

  return {
    step,
    // step 1
    country, national, phoneError, sending, setNational, chooseCountry, submitPhone,
    phoneDisplay: displayPhone(country, national),
    // step 2
    code, codeError, shake, verifying, resendIn, canResend: resendIn === 0,
    setCode, backToPhone, resend, demoCode, useDemoCode,
    // step 3
    name, email, nameError, emailError, saving, setName, setEmail, submitDetails,
  };
}
