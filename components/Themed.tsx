/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import {
  StyleSheet,
  Text as DefaultText,
  TextInput as DefaultTextInput,
  TextInputProps as RNTextInputProps,
  TextProps as RNTextProps,
  View as DefaultView,
  ViewProps as RNViewProps,
} from 'react-native';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';
import { fontFamilyFor } from '@/src/theme/fonts';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & RNTextProps;
export type ViewProps = ThemeProps & RNViewProps;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

// Poppins has a separate font file for each weight, so we turn the style's fontWeight
// (for example '700') into the matching Poppins font. fontWeight is then reset to 'normal',
// otherwise Android would make the bold font bolder still.
function poppinsStyle(style: unknown) {
  const flat = (StyleSheet.flatten(style as never) ?? {}) as { fontFamily?: string; fontWeight?: string | number };
  return { fontFamily: flat.fontFamily ?? fontFamilyFor(flat.fontWeight), fontWeight: 'normal' as const };
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style, poppinsStyle(style)]} {...otherProps} />;
}

// A text box that types in Poppins too. (Colours and borders are set where it is used.)
export function TextInput(props: RNTextInputProps) {
  const { style, ...otherProps } = props;
  return <DefaultTextInput style={[style, poppinsStyle(style)]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
