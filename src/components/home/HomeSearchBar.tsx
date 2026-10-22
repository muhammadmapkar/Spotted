import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/src/components/icons/Icon';
import { AppText } from '@/src/components/ui/ui';
import { cardShadow } from '@/src/theme/shadows';
import { fontFamilyFor } from '@/src/theme/fonts';
import { useTheme } from '@/src/theme/ThemeProvider';

// The search bar (prototype: .search, .fbtn, .fcount, .caret).
//  - while empty it "types" example searches: Try 'Indian' ... with a blinking cursor
//  - it grows slightly when you tap it
//  - a purple filter button on the right with a red count badge when filters are on
export function HomeSearchBar({
  value,
  onChangeText,
  typedExample,
  filterCount,
  onFilterPress,
  placeholder,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (text: string) => void;
  typedExample?: string; // the letters typed so far; leave out to use a plain placeholder
  filterCount: number;
  onFilterPress: () => void;
  placeholder?: string;
  accessibilityLabel: string;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [caretOn, setCaretOn] = useState(true);

  // Grow a little when focused (1.02), like the prototype.
  const grow = useSharedValue(1);
  useEffect(() => {
    grow.value = reduceMotion ? 1 : withTiming(focused ? 1.02 : 1, { duration: 250 });
  }, [focused, reduceMotion, grow]);
  const growStyle = useAnimatedStyle(() => ({ transform: [{ scale: grow.value }] }));

  // The blinking cursor after the typed example.
  const showTyped = !value && typedExample !== undefined;
  useEffect(() => {
    if (!showTyped || reduceMotion) return;
    const timer = setInterval(() => setCaretOn((on) => !on), 500);
    return () => clearInterval(timer);
  }, [showTyped, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: palette.surface, borderColor: focused ? palette.brand : palette.line, boxShadow: cardShadow(palette) },
        growStyle,
      ]}>
      <Icon name="search" size={20} color={palette.muted} />

      <View style={styles.inputArea}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={showTyped ? undefined : placeholder}
          placeholderTextColor={palette.muted}
          accessibilityLabel={accessibilityLabel}
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.input, { color: palette.text, fontFamily: fontFamilyFor('400') }]}
        />
        {showTyped ? (
          <View style={styles.typedLayer} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AppText tone="muted" size={15}>Try '{typedExample}'</AppText>
            <View style={[styles.caret, { backgroundColor: palette.acc, opacity: caretOn || reduceMotion ? 1 : 0 }]} />
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel={filterCount > 0 ? `Filters, ${filterCount} on` : 'Filters'}
        style={[styles.filterButton, { backgroundColor: palette.btn }]}>
        <Icon name="sliders" size={20} color="#FFFFFF" />
        {filterCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: palette.red }]}>
            <AppText tone="onBrand" weight="700" size={10}>{filterCount}</AppText>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, borderRadius: 18, borderWidth: 1.5, paddingLeft: 16, paddingRight: 6 },
  inputArea: { flex: 1, minWidth: 0, justifyContent: 'center' },
  input: { fontSize: 15, minHeight: 44, paddingVertical: 0 },
  typedLayer: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center' },
  caret: { width: 2, height: 16, marginLeft: 1 },
  filterButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
