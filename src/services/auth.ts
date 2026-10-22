// The sign-in "service": sends a code and checks it.
//
// RIGHT NOW THIS IS A DEMO: no text message is sent, and the correct code is always 123456.
// When we add a real SMS provider (in Version 2, with a backend), only this file changes:
// replace `authService` with one that calls the provider. The screens do not change.

export interface AuthService {
  // true = this is the fake demo (the screen then offers a "Use demo code" shortcut).
  isDemo: boolean;
  // The demo's correct code, so the screen can offer a "Use demo code" shortcut. Real services leave this out.
  demoCode?: string;
  // Send a code to the phone number ("+971501234567"). Throws if it cannot be sent.
  sendCode(phone: string): Promise<void>;
  // Is this the right code for this phone number?
  verifyCode(phone: string, code: string): Promise<boolean>;
}

export const DEMO_CODE = '123456';

export const authService: AuthService = {
  isDemo: true,
  demoCode: DEMO_CODE,
  async sendCode() {
    // Pretend the text message was sent.
  },
  async verifyCode(_phone, code) {
    return code === DEMO_CODE;
  },
};
