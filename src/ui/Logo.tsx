/**
 * Logo — "Feellog" 워드마크(Baloo 2) + 선택적 심볼 원.
 * 로그인/온보딩/스플래시에서 공통으로 쓴다. 심볼은 추후 실제 로고 에셋으로 교체.
 */
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { colors, fontFamily, spacing } from '@/tokens';

import { AppText } from './Text';

export interface LogoProps {
  /** 워드마크 크기 */
  size?: number;
  /** 심볼(5잎 꽃) 표시 — 세로 스택(스플래시/로그인용) */
  withMark?: boolean;
  /** 가로 락업(마크+워드마크 한 줄 — 헤더/사이드바용) */
  lockup?: boolean;
  color?: string;
}

export function Logo({ size = 40, withMark = false, lockup = false, color = colors.primary }: LogoProps) {
  const word = (
    <AppText
      style={[styles.word, { fontSize: size, lineHeight: Math.round(size * 1.15), color }]}
      accessibilityRole="header"
    >
      Feellog
    </AppText>
  );

  if (lockup) {
    return (
      <View style={styles.lockup}>
        <BrandMark size={Math.round(size * 1.15)} />
        {word}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {withMark && <BrandMark size={Math.max(64, size * 1.6)} />}
      {word}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  word: {
    fontFamily: fontFamily.logo,
    fontWeight: '700',
  },
});
