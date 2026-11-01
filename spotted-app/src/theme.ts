import { useColorScheme } from 'react-native';

export const palette = {
  light: { bg: '#FFFFFF', surface: '#F7F2FC', text: '#2A0F45', muted: '#6B5A7D', line: '#E6DAF2', primary: '#6A1FB0', primaryDark: '#3C096C', accent: '#E5383B', soft: '#C9A2FF', save: '#FFC93C', visit: '#2BB673' },
  dark: { bg: '#14081F', surface: '#221233', text: '#F4ECFB', muted: '#B7A5C9', line: '#3A2552', primary: '#8E44D6', primaryDark: '#3C096C', accent: '#FF5C5F', soft: '#C9A2FF', save: '#FFC93C', visit: '#2BB673' },
};
export type Palette = typeof palette.light;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 16, lg: 24 };
export const font = { regular: 'Poppins_400Regular', medium: 'Poppins_500Medium', semi: 'Poppins_600SemiBold', bold: 'Poppins_700Bold' };

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}
