// The Spotted design palettes, copied exactly from the prototype's CSS
// (.ph for light and .ph.dark for dark in spotted-prototype-reference.html).
//
// This sits NEXT TO constants/Colors.ts (the older screens' colours, now the same purple). The redesigned
// screens read this palette through the useTheme() hook.

export interface Palette {
  bg: string; // page background
  surface: string; // cards and sheets
  surface2: string; // a slightly different surface
  text: string; // main text
  muted: string; // softer text
  line: string; // borders and dividers
  brand: string; // brand purple (text and icons)
  btn: string; // buttons
  acc: string; // accent text, links, active icons
  red: string; // saved bookmarks, errors, "NEW"
  chip: string; // chips and small buttons
  navBg: string; // translucent tab bar
  mapLand: string; // map colours
  mapRoad: string;
  mapMinor: string;
  mapWater: string;
  mapPark: string;
  shadowColor: string; // card shadows
  shadowOpacity: number;
}

export const lightPalette: Palette = {
  bg: '#F6F2FB',
  surface: '#FFFFFF',
  surface2: '#EFE7F8',
  text: '#1C0F2E',
  muted: '#5E4F72',
  line: '#E2D7F0',
  brand: '#6A1FB0',
  btn: '#6A1FB0',
  acc: '#6A1FB0',
  red: '#D62839',
  chip: '#EDE3F8',
  navBg: 'rgba(255,255,255,.94)',
  mapLand: '#EFE8F6',
  mapRoad: '#FFFFFF',
  mapMinor: '#E3D8EF',
  mapWater: '#C9DDF5',
  mapPark: '#D6EBD3',
  shadowColor: '#3C146E', // rgb(60,20,110)
  shadowOpacity: 0.1,
};

export const darkPalette: Palette = {
  bg: '#120A1F',
  surface: '#1E1231',
  surface2: '#2A1A44',
  text: '#F4EEFC',
  muted: '#BBABD4',
  line: '#36254F',
  brand: '#A061F0',
  btn: '#7B2CD6',
  acc: '#CDA8FF',
  red: '#F0475A',
  chip: '#2C1B47',
  navBg: 'rgba(24,14,40,.95)',
  mapLand: '#1B1130',
  mapRoad: '#33234F',
  mapMinor: '#24173B',
  mapWater: '#14284A',
  mapPark: '#16301F',
  shadowColor: '#000000',
  shadowOpacity: 0.35,
};

export type SchemeName = 'light' | 'dark';

export const palettes: Record<SchemeName, Palette> = { light: lightPalette, dark: darkPalette };
