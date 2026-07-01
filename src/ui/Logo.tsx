/**
 * Logo — "Feellog" 워드마크(Baloo 2) + 선택적 심볼 원.
 * 로그인/온보딩/스플래시에서 공통으로 쓴다. 심볼은 추후 실제 로고 에셋으로 교체.
 */
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radius } from '@/tokens';

import { AppText } from './Text';

export interface LogoProps {
  /** 워드마크 크기 */
  size?: number;
  /** 상단 심볼 원 표시 */
  withMark?: boolean;
  color?: string;
}

export function Logo({ size = 40, withMark = false, color = colors.primary }: LogoProps) {
  return (
    <View style={styles.wrap}>
      {withMark && <View style={[styles.mark, { backgroundColor: colors.primaryTint }]} />}
      <AppText
        style={[styles.word, { fontSize: size, lineHeight: size * 1.1, color }]}
        accessibilityRole="header"
      >
        Feellog
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
  },
  word: {
    fontFamily: fontFamily.logo,
    fontWeight: '700',
  },
});
