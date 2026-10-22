// Small rules for the sign-in forms: the 6-digit code, the countdown, name and email.

export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 30;

// Only digits, at most 6. (SMS auto-fill may paste "123 456" or "Code: 123456".)
export function cleanOtp(text: string): string {
  return text.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

// What each of the 6 boxes shows, and which one is active (waiting for a digit).
export function otpBoxes(otp: string): { char: string; filled: boolean; active: boolean }[] {
  return Array.from({ length: OTP_LENGTH }, (_, i) => ({
    char: otp[i] ?? '',
    filled: !!otp[i],
    active: i === otp.length,
  }));
}

// 28 -> "0:28",  65 -> "1:05"
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// null = fine, otherwise a friendly message.
export function validateName(name: string): string | null {
  return name.trim().length === 0 ? 'Please tell us your name.' : null;
}

export function validateEmail(email: string): string | null {
  const e = email.trim();
  if (e.length === 0) return 'Please enter your email.';
  // something@something.something, with no spaces. (A simple check, not a full email rulebook.)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? null : 'That email does not look right. Please check it.';
}
