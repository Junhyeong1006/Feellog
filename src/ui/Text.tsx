/**
 * AppText — 타이포그래피 토큰을 입은 Text 프리미티브 (v6 블루 DS).
 * variant로 프리셋(typography: display~small) 선택, color/weight/center로 미세조정.
 * 폰트 패밀리(SUIT / Ownglyph)는 typography 토큰이 결정한다. 색 하드코딩 대신 이 컴포넌트를 쓴다.
 *
 * 접근성: allowFontScaling 기본 true + 앱 내 글자 크기 배율(FontScaleProvider) 반영.
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
  /** 타이포 프리셋 (기본 body = SUIT 300/16) */
  variant?: TypographyToken;
  /** 색 직접 지정(토큰 값. 기본 textPrimary) */
  color?: string;
  /** 보조 텍스트 색(neutral600)으로 빠르게 지정 */
  muted?: boolean;
  /** 폰트 두께 override */
  weight?: keyof typeof fontWeight;
  /** 가운데 정렬 */
  center?: boolean;
  /** 고정폭 숫자(가격·카운트·날짜 — 정렬 흔들림 방지) */
  tabular?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  muted,
  weight,
  center,
  tabular,
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
    tabular && styles.tabular,
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
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
