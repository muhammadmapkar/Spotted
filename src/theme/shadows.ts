import { Palette } from '../../constants/Theme';

// Soft shadows as the "boxShadow" text React Native understands, e.g. "0 6px 20px rgba(60,20,110,0.1)".
function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// The shadow under cards (prototype: --shadow).
export const cardShadow = (palette: Palette): string => `0 6px 20px ${rgba(palette.shadowColor, palette.shadowOpacity)}`;

// A Spotted Partner card also glows purple (prototype: .card.partner).
export const partnerGlow = (palette: Palette): string => `0 0 0 3px rgba(160,97,240,0.15), ${cardShadow(palette)}`;

export const PARTNER_BORDER = 'rgba(160,97,240,0.65)';
