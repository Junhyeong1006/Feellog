/**
 * Dots — 페이지네이션 점(온보딩 캐러셀 등). 활성 점은 넓은 캡슐.
 */
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/tokens';

export interface DotsProps {
  count: number;
  activeIndex: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function Dots({
  count,
  activeIndex,
  activeColor = colors.primary,
  inactiveColor = colors.border,
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
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: radius.pill,
  },
  active: {
    width: 24,
  },
  inactive: {
    width: 8,
  },
});
