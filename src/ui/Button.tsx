/**
 * Button — 버튼 프리미티브 (시니어 터치 48dp+ 강제, v5: 12px 라운드).
 * variant로 색/톤을 바꾼다. 소셜(kakao/google/apple)은 브랜드 토큰 사용.
 * leftSlot에 아이콘/로고 노드를 넣을 수 있다. 기본 fullWidth.
 * 흰 글자 on 브랜드 그린은 6.4:1 — 일반 텍스트 AA도 통과(v4 블루의 대형텍스트 제약 해소).
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { brand, colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';

import { AppText } from './Text';

/** react-native-web hovered 상태(RN 타입에 없어 확장) */
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'kakao'
  | 'google'
  | 'apple';

export type ButtonSize = 'lg' | 'md';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** 라벨 왼쪽 슬롯(로고/아이콘) */
  leftSlot?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

interface Tone {
  bg: string;
  bgPressed: string;
  fg: string;
  border?: string;
}

const TONES: Record<ButtonVariant, Tone> = {
  primary: { bg: colors.primary, bgPressed: colors.primaryPressed, fg: colors.onPrimary },
  secondary: { bg: colors.secondaryBg, bgPressed: colors.surfaceAlt, fg: colors.secondaryText },
  ghost: { bg: 'transparent', bgPressed: colors.primaryTint, fg: colors.primaryInk },
  outline: { bg: colors.surface, bgPressed: colors.surfaceInset, fg: colors.textPrimary, border: colors.border },
  danger: { bg: colors.danger, bgPressed: colors.danger, fg: colors.onPrimary },
  kakao: { bg: brand.kakao, bgPressed: brand.kakao, fg: brand.kakaoText },
  google: { bg: brand.google, bgPressed: colors.surfaceInset, fg: brand.googleText, border: brand.googleBorder },
  apple: { bg: brand.apple, bgPressed: brand.apple, fg: brand.appleText },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftSlot,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const tone = TONES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={(state) => {
        const { pressed, hovered } = state as WebPressableState;
        return [
          styles.base,
          size === 'lg' ? styles.lg : styles.md,
          { backgroundColor: pressed && !isDisabled ? tone.bgPressed : tone.bg },
          tone.border != null && { borderWidth: 1, borderColor: tone.border },
          fullWidth && styles.fullWidth,
          hovered && !pressed && !isDisabled && styles.hovered,
          isDisabled && styles.disabled,
          style,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={styles.content}>
          {leftSlot != null && <View style={styles.leftSlot}>{leftSlot}</View>}
          <AppText
            weight="bold"
            color={tone.fg}
            style={size === 'lg' ? styles.labelLg : styles.labelMd}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_SIZE,
    // 12px 라운드(실서비스 버튼 8~14px 실측 — pill은 칩·배지 전용)
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  lg: {
    minHeight: 56,
    paddingVertical: spacing.base,
  },
  md: {
    minHeight: MIN_TOUCH_SIZE,
    paddingVertical: spacing.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  hovered: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  labelLg: {
    fontSize: 19,
    lineHeight: 28,
  },
  labelMd: {
    fontSize: 18,
    lineHeight: 26,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  leftSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
