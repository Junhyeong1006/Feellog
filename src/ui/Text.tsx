/**
 * AppText — 타이포그래피 토큰을 입은 Text 프리미티브.
 * variant로 프리셋(typography) 선택, color/weight/center로 미세조정.
 * 폰트 패밀리(Pretendard)를 기본 적용한다. 색 하드코딩 대신 이 컴포넌트를 쓴다.
 *
 * 접근성: allowFontScaling 기본 true(시니어 OS 글자 크기 확대 존중).
 */
import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useFontScale } from '@/providers/FontScaleProvider';
import { colors, fontFamily, fontWeight, typography, type TypographyToken } from '@/tokens';

export interface AppTextProps extends RNTextProps {
  /** 타이포 프리셋 (기본 body=18px) */
  variant?: TypographyToken;
  /** 색 토큰 값 직접 지정 (기본 textPrimary) */
  color?: string;
  /** 보조 텍스트 색으로 빠르게 지정 */
  muted?: boolean;
  /** 폰트 두께 override */
  weight?: keyof typeof fontWeight;
  /** 가운데 정렬 */
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  muted,
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { scale } = useFontScale();

  // 호출부의 고정 fontSize/lineHeight까지 포함해 최종 스타일에 배율을 곱한다
  // (merge 이후 적용해야 앱 내 글씨 크기 토글에서 줄 높이가 잘리지 않음)
  const merged = StyleSheet.flatten<TextStyle>([
    styles.base,
    typography[variant],
    muted && { color: colors.textSecondary },
    color ? { color } : null,
    weight && { fontWeight: fontWeight[weight] },
    center && styles.center,
    style,
  ]);

  const scaled: TextStyle =
    scale === 1
      ? merged
      : {
          ...merged,
          ...(merged.fontSize != null && { fontSize: Math.round(merged.fontSize * scale) }),
          ...(merged.lineHeight != null && { lineHeight: Math.round(merged.lineHeight * scale) }),
        };

  return <RNText style={scaled} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamily.base,
    color: colors.textPrimary,
  },
  center: {
    textAlign: 'center',
  },
});
