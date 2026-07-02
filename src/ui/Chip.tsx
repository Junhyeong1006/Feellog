/**
 * Chip — 선택형 알약 칩 프리미티브(필터/카테고리/설정 토글 공용).
 * 화면마다 제각각이던 칩 스타일을 하나로 통일한다.
 * 활성: primaryPressed 채움 + 흰 라벨(AA), 비활성: 크림 인셋 + 보조 텍스트.
 */
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';

import { AppText } from './Text';

export type ChipSize = 'md' | 'sm';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** md=본문 라벨(필터), sm=캡션 라벨(카테고리처럼 많은 칩) */
  size?: ChipSize;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, size = 'md', accessibilityLabel, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.chip,
        size === 'md' ? styles.md : styles.sm,
        selected ? styles.active : styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      <AppText
        variant={size === 'md' ? 'body' : 'caption'}
        weight="semibold"
        color={selected ? colors.onPrimary : colors.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingHorizontal: spacing.lg,
  },
  sm: {
    paddingHorizontal: spacing.base,
  },
  active: {
    // primaryPressed: 흰 라벨과 WCAG AA(4.7:1) — primary 원색은 3.2:1로 미달
    backgroundColor: colors.primaryPressed,
  },
  inactive: {
    backgroundColor: colors.surfaceInset,
  },
  pressed: {
    opacity: 0.75,
  },
});
