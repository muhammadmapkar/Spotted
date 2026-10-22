import { Pressable, StyleSheet, Switch, View } from 'react-native';

// An on/off switch with a bigger tap area. The phone's own Switch is only about 51 x 31, which is smaller than the
// 44 x 44 we promise for every button, so the switch sits inside a 56 x 48 button. Screen readers see ONE control:
// the button, with the name and the on/off state.
export function TapSwitch({
  value,
  onValueChange,
  label,
  trackColor,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  trackColor: { false?: string; true?: string };
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      style={styles.hit}>
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Switch value={value} onValueChange={onValueChange} trackColor={trackColor} thumbColor="#FFFFFF" disabled={disabled} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
