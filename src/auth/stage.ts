// Which part of the app a person sees, from whether they are signed in and have finished the
// welcome screens:
//   not signed in                       -> the sign-in screens
//   signed in, welcome not done yet     -> the welcome slides and permission screens
//   signed in and welcome done          -> the app
export type AppStage = 'sign-in' | 'onboarding' | 'app';

export function appStage(signedIn: boolean, onboardingDone: boolean): AppStage {
  if (!signedIn) return 'sign-in';
  return onboardingDone ? 'app' : 'onboarding';
}
