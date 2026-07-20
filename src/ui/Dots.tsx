/**
 * Dots — 페이지 인디케이터 (v6 블루 DS, Figma Page Indicator/Onboarding).
 * 활성: 32x8 필(색은 activeColor prop — 온보딩 장마다 파랑/코랄/민트). 비활성: 8x8 neutral200. 간격 12.
 */
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/tokens';

export interface DotsProps {
  count: number;
  activeIndex: number;
  /** 활성 도트 색(기본 primary. 온보딩 장마다 accentCoral/accentMint 등) */
  activeColor?: string;
  inactiveColor?: string;
}

export function Dots({
  count,
  activeIndex,
  activeColor = colors.primary,
  inactiveColor = colors.divider,
}: DotsProps) {
  return (
    <View style={styles.row} accessibilityLabel={`${count}장 중 ${activeIndex + 1}번째`}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              active ? styles.active : styles.inactive,
              { backgroundColor: active ? activeColor : inactiveColor },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md, // Figma 도트 간격 12
  },
  dot: {
    height: spacing.sm,
    borderRadius: radius.pill,
  },
  active: {
    width: spacing.xxl, // 32x8 필
  },
  inactive: {
    width: spacing.sm, // 8x8
  },
});
