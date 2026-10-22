// Poppins, the Spotted font. React Native needs a separate font name for each weight.

// The weights we load (see app/_layout.tsx).
export const POPPINS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
} as const;

// Pick the Poppins font for a style's fontWeight ('400', '600', 'bold', 700 ...).
export function fontFamilyFor(weight: string | number | undefined): string {
  switch (String(weight ?? '400')) {
    case '500':
      return POPPINS.medium;
    case '600':
      return POPPINS.semiBold;
    case '700':
    case 'bold':
      return POPPINS.bold;
    case '800':
    case '900':
      return POPPINS.extraBold;
    default:
      return POPPINS.regular; // 100-400, 'normal', or nothing
  }
}
