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

const TONES: Record<BadgeTone, ToneStyle> = {
  primary: { bg: colors.primaryTint, fg: colors.primaryPressed },
  mint: { bg: palette.mint, fg: palette.mintDeep },
  coral: { bg: palette.coralTint, fg: palette.coralDeep },
  neutral: { bg: colors.surfaceInset, fg: colors.textSecondary },
  success: { bg: palette.mint, fg: palette.mintDeep },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** 라벨 왼쪽 슬롯(아이콘/점) */
  leftSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'primary', size = 'md', leftSlot, style }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.sm : styles.md,
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
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
});
