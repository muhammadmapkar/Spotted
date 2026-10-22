import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Appearance, useColorScheme as useSystemColorScheme } from 'react-native';

import { Palette, SchemeName, palettes } from '../../constants/Theme';
import { ThemePreference, setThemePreference } from '../db/meta';

// Gives every screen the current palette, and lets the user choose Light, Dark or "follow my phone".

// Tell the phone which look we want. 'system' hands control back to the phone's own setting.
// Because this changes the phone-wide setting for our app, every component that asks
// "is it dark mode?" (including the older screens) follows the choice automatically.
export function applyThemePreference(preference: ThemePreference): void {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

interface ThemeValue {
  palette: Palette; // the colours to use right now
  scheme: SchemeName; // 'light' or 'dark', right now
  preference: ThemePreference; // what the user chose
  setPreference: (preference: ThemePreference) => void; // choose, and remember it
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function SpottedThemeProvider({
  initialPreference = 'system',
  children,
}: {
  initialPreference?: ThemePreference; // the saved choice, loaded before the app first shows
  children: ReactNode;
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const systemScheme = useSystemColorScheme(); // already reflects our override once it is applied

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    applyThemePreference(next);
    setThemePreference(next).catch(() => {
      // If saving fails the choice still applies until the app closes. Never crash over a colour.
    });
  }, []);

  const scheme: SchemeName = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo<ThemeValue>(
    () => ({ palette: palettes[scheme], scheme, preference, setPreference }),
    [scheme, preference, setPreference]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Read the current palette in any screen:  const { palette } = useTheme();
export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside SpottedThemeProvider');
  return value;
}
