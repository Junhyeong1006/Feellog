/**
 * Badge — 작은 캡슐 라벨. 보조성향 배지, 매칭 %, 태그 칩 등에 사용.
 * tone으로 색을 바꾼다. size로 칩(작게)/배지(기본).
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, palette, radius, spacing } from '@/tokens';

import { AppText } from './Text';

export type BadgeTone = 'primary' | 'mint' | 'coral' | 'neutral' | 'success';
export type BadgeSize = 'sm' | 'md';

interface ToneStyle {
  bg: string;
  fg: string;
}

// 틴트 배경 + 잉크 텍스트(원색 텍스트는 AA 미달 — 디자인 리서치)
const TONES: Record<BadgeTone, ToneStyle> = {
  primary: { bg: colors.primaryTint, fg: colors.primaryInk },
  mint: { bg: palette.mint, fg: colors.mintInk },
  coral: { bg: palette.coralTint, fg: colors.coralInk },
  neutral: { bg: colors.surfaceInset, fg: colors.textSecondary },
  success: { bg: palette.mint, fg: colors.mintInk },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** square=8px 라운드 사각(키워드 태그) · pill=캡슐(상태/매칭 배지, 기본) */
  shape?: 'pill' | 'square';
  /** 라벨 왼쪽 슬롯(아이콘/점) */
  leftSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'primary', size = 'md', shape = 'pill', leftSlot, style }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.sm : styles.md,
        shape === 'square' && styles.square,
        { backgroundColor: t.bg },
        style,
      ]}
    >
      {leftSlot}
      <AppText variant="caption" weight="semibold" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
  },
  square: {
    borderRadius: radius.sm,
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2, // 6 — pill 높이 리듬 유지
  },
});
