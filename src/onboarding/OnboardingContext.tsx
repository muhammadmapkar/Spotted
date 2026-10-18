import { createContext, useContext } from 'react';

// Lets the welcome screens tell the app "onboarding is finished".
export const OnboardingContext = createContext<{ finish: () => Promise<void>; restart: () => Promise<void> }>({
  finish: async () => {},
  restart: async () => {}, // testing only: show the welcome screens again
});

export const useOnboarding = () => useContext(OnboardingContext);
