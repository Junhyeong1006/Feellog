/**
 * Checkbox — 동의 항목/설정 토글. 터치 영역 넉넉히(시니어).
 * label은 문자열 또는 노드(링크 포함 등). 체크 시 primary 박스 + 흰 체크.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';

import { AppText } from './Text';

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  accessibilityLabel,
  style,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={[styles.row, style]}
    >
      <View style={[styles.box, checked ? styles.boxChecked : styles.boxUnchecked]}>
        {checked && <Ionicons name="checkmark" size={18} color={colors.onPrimary} />}
      </View>
      {label != null &&
        (typeof label === 'string' ? (
          <AppText variant="body" style={styles.label}>
            {label}
          </AppText>
        ) : (
          <View style={styles.label}>{label}</View>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxUnchecked: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  label: {
    flex: 1,
  },
});
