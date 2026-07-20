/**
 * SegmentedTabs — 상단 세그먼트 탭 (v6 블루 DS, 소통 '게시글 | 친구' 스타일).
 * 활성: 파랑 Title(SUIT 700/20) + 하단 파랑 인디케이터. 비활성: neutral600.
 * 탭당 터치 영역 48 이상.
 */
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';

import { AppText } from './Text';

export interface SegmentedTabsProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedTabs({ tabs, activeIndex, onChange, style }: SegmentedTabsProps) {
  return (
    <View style={[styles.row, style]} accessibilityRole="tablist">
      {tabs.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(i)}
            accessibilityRole="tab"
            accessibilityLabel={tab}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <AppText
              variant="title"
              color={active ? colors.primary : colors.textSecondary}
              center
            >
              {tab}
            </AppText>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  indicator: {
    height: 3,
    width: spacing.xxl,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
});
