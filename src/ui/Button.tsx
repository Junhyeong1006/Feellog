/**
 * Button — 버튼 프리미티브 (v6 블루 DS. 필(pill) 형태 통일).
 *
 * variant:
 *  · cta       — Figma Button/Cta: 파랑 필 + 흰 titleW(SUIT 800/20) 라벨 + shadows.cta ("입장하기", "다음으로")
 *  · secondary — Figma Button/Skip: neutral50 필 + neutral300 보더 + neutral600 라벨 ("둘러보기", "나중에 하기")
 *  · ghost     — 투명 배경 + 파랑 라벨(텍스트 버튼)
 *  · social    — 60px 원형(카카오/애플/구글/네이버 브랜드 색). 라벨은 스크린리더 전용, 아이콘만 표시
 *  · chipAction— '후기쓰기/글쓰기' 스타일: 흰 필 + 파랑 보더 + 파랑 라벨(연필 아이콘 기본)
 *
 * size lg=56 / md=48 / sm=40(시각 40, hitSlop으로 터치 48 확보). 기본 fullWidth(social·chipAction 제외).
 */
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { brand, colors, MIN_TOUCH_SIZE, radius, shadows, spacing, type TypographyToken } from '@/tokens';

import { AppText } from './Text';

/** react-native-web hovered 상태(RN 타입에 없어 확장) */
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export type ButtonVariant = 'cta' | 'secondary' | 'ghost' | 'social' | 'chipAction';
export type ButtonSize = 'lg' | 'md' | 'sm';
export type SocialBrand = 'kakao' | 'apple' | 'google' | 'naver';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** lg=56, md=48, sm=40 (기본 lg) */
  size?: ButtonSize;
  /** variant='social'일 때 브랜드 지정(기본 kakao). 배경/아이콘 색이 브랜드 토큰으로 잡힌다 */
  social?: SocialBrand;
  loading?: boolean;
  disabled?: boolean;
  /** 기본 true (social·chipAction은 항상 자기 크기) */
  fullWidth?: boolean;
  /** 라벨 왼쪽 슬롯(아이콘). social은 이 슬롯이 원 안의 아이콘을 대체 */
  leftSlot?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

interface Tone {
  bg: string;
  bgPressed: string;
  fg: string;
  border?: string;
  borderWidth?: number;
}

const TONES: Record<Exclude<ButtonVariant, 'social'>, Tone> = {
  cta: {
    bg: colors.primary,
    bgPressed: colors.primaryPressed,
    fg: colors.onPrimary,
    border: colors.primary,
    borderWidth: 1.5,
  },
  secondary: {
    bg: colors.background,
    bgPressed: colors.surfaceInset,
    fg: colors.textSecondary,
    border: colors.border,
    borderWidth: 1,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: colors.primaryTint,
    fg: colors.primary,
  },
  chipAction: {
    // Figma 518-999 정본: 파랑 채움 + 흰 라벨(연필 아이콘 포함)
    bg: colors.primary,
    bgPressed: colors.primaryPressed,
    fg: colors.onPrimary,
  },
};

const SOCIAL_TONES: Record<SocialBrand, { bg: string; fg: string }> = {
  kakao: { bg: brand.kakao, fg: brand.kakaoText },
  apple: { bg: brand.apple, fg: brand.appleText },
  google: { bg: brand.google, fg: brand.googleText },
  naver: { bg: brand.naver, fg: brand.naverText },
};

const SOCIAL_ICONS: Record<SocialBrand, keyof typeof Ionicons.glyphMap> = {
  kakao: 'chatbubble',
  apple: 'logo-apple',
  google: 'logo-google',
  naver: 'text',
};

/** 소셜 원형 버튼 지름(Figma 60x60) */
const SOCIAL_SIZE = 60;

const HEIGHTS: Record<ButtonSize, number> = { lg: 56, md: 48, sm: 40 };

const LABEL_VARIANTS: Record<ButtonSize, TypographyToken> = {
  lg: 'titleW', // SUIT 800/20 — Figma CTA 라벨
  md: 'bodyLg', // SUIT 600/18
  sm: 'body2', // SUIT 700/16
};

export function Button({
  label,
  onPress,
  variant = 'cta',
  size = 'lg',
  social = 'kakao',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftSlot,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isSocial = variant === 'social';
  const height = HEIGHTS[size];
  // 시각 높이가 48 미만이면 hitSlop으로 터치 영역 48 확보
  const slop = Math.max(0, Math.ceil((MIN_TOUCH_SIZE - (isSocial ? SOCIAL_SIZE : height)) / 2));

  if (isSocial) {
    const tone = SOCIAL_TONES[social];
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        hitSlop={slop}
        style={(state) => {
          const { pressed, hovered } = state as WebPressableState;
          return [
            styles.social,
            { backgroundColor: tone.bg },
            hovered && !pressed && !isDisabled && styles.hovered,
            pressed && !isDisabled && styles.socialPressed,
            isDisabled && styles.disabled,
            style,
          ];
        }}
      >
        {loading ? (
          <ActivityIndicator color={tone.fg} />
        ) : (
          leftSlot ?? <Ionicons name={SOCIAL_ICONS[social]} size={24} color={tone.fg} />
        )}
      </Pressable>
    );
  }

  const tone = TONES[variant];
  const chipLike = variant === 'chipAction';
  const stretch = fullWidth && !chipLike;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={slop}
      style={(state) => {
        const { pressed, hovered } = state as WebPressableState;
        return [
          styles.base,
          { minHeight: height },
          size === 'sm' ? styles.padSm : styles.padMd,
          { backgroundColor: pressed && !isDisabled ? tone.bgPressed : tone.bg },
          tone.border != null && { borderWidth: tone.borderWidth ?? 1, borderColor: tone.border },
          variant === 'cta' && styles.ctaShadow,
          stretch ? styles.fullWidth : styles.hug,
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
          {chipLike && leftSlot == null && (
            <Ionicons name="pencil" size={16} color={tone.fg} />
          )}
          <AppText variant={LABEL_VARIANTS[size]} color={tone.fg}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padMd: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  padSm: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  ctaShadow: {
    // Figma Effect/Shadow-1 (0,1,30 @10%) 대응 토큰
    ...shadows.cta,
  },
  social: {
    width: SOCIAL_SIZE,
    height: SOCIAL_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialPressed: {
    opacity: 0.85,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  hug: {
    alignSelf: 'flex-start',
  },
  hovered: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
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
