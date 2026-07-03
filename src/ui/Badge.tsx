/**
 * Badge — 작은 라벨 (v5). 매칭 %, 보조성향, 키워드 태그 등.
 * 톤: primary(그린 틴트)·accent(테라코타 틴트)·neutral(중립 면)·onPhoto(사진 위 흰 필).
 * 원색 텍스트가 아닌 딥 잉크 텍스트(전 조합 AA — 컬러 리서치 계산 검증).
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, palette, radius, spacing } from '@/tokens';

import { AppText } from './Text';

export type BadgeTone = 'primary' | 'accent' | 'neutral' | 'success' | 'onPhoto';
export type BadgeSize = 'sm' | 'md';

interface ToneStyle {
  bg: string;
  fg: string;
}

const TONES: Record<BadgeTone, ToneStyle> = {
  primary: { bg: colors.primaryTint, fg: colors.primary },
  accent: { bg: colors.accentTint, fg: colors.accent },
  neutral: { bg: colors.surfaceInset, fg: colors.textSecondary },
  success: { bg: colors.primaryTint, fg: colors.primary },
  /** 사진 위 오버레이 배지(흰 필 + 그린 텍스트) */
  onPhoto: { bg: 'rgba(255,255,255,0.94)', fg: palette.green600 },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** square=6px 라운드 사각(키워드 태그) · pill=캡슐(상태/매칭 배지, 기본) */
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
      <AppText variant="caption" weight="bold" color={t.fg}>
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
    paddingVertical: 3,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
});
