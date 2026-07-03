/**
 * Logo — 한글 워드마크 '필로그' + 그린 단색 심볼 (v5).
 * 라틴 라운드체(Baloo 2) 워드마크 폐기 — Pretendard 800 한글 레터링(실서비스 브랜딩 문법).
 * 사진/딤 위에서는 color="white"로 뒤집는다.
 */
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { colors, spacing } from '@/tokens';

import { AppText } from './Text';

export interface LogoProps {
  /** 워드마크 글자 크기 */
  size?: number;
  /** 심볼 + 워드마크 세로 스택(스플래시/로그인용) */
  withMark?: boolean;
  /** 가로 락업(마크+워드마크 한 줄 — 헤더/사이드바용) */
  lockup?: boolean;
  /** 워드마크·마크 색(기본 잉크 워드마크 + 그린 마크) */
  color?: string;
}

export function Logo({ size = 28, withMark = false, lockup = false, color }: LogoProps) {
  const wordColor = color ?? colors.textPrimary;
  const markColor = color ?? colors.primary;

  const word = (
    <AppText
      weight="extrabold"
      style={[styles.word, { fontSize: size, lineHeight: Math.round(size * 1.2), color: wordColor }]}
      accessibilityRole="header"
    >
      필로그
    </AppText>
  );

  if (lockup) {
    return (
      <View style={styles.lockup}>
        <BrandMark size={Math.round(size * 1.05)} color={markColor} />
        {word}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {withMark && <BrandMark size={Math.max(56, size * 1.7)} color={markColor} />}
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
    letterSpacing: -0.5,
  },
});
