/**
 * Chip — 선택형 알약 칩 프리미티브(필터/카테고리/설정 토글 공용, v5).
 * 활성: 잉크 채움 + 흰 라벨(브랜드색 남용 방지 — 커뮤니티/필터 실서비스 문법),
 * 비활성: 중립 인셋 + 보조 텍스트.
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
    // 잉크 채움 + 흰 라벨(15.9:1) — 선택 상태에 브랜드색을 아낀다
    backgroundColor: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
  },
  inactive: {
    // 흰 배경 + 보더(실서비스 필터 칩 문법 — 흰/미스트 어느 바탕에서도 성립)
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
});
