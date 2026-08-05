/**
 * SegmentedTabs — 상단 세그먼트 탭 (26.08 온보딩작업 v3, 소통 518:999 '게시글 | 친구').
 * 활성: 블루 Title(SUIT 700/20, AA 보정 primaryText) / 비활성: 진한 텍스트.
 * 탭 사이 얇은 세로 구분자, 인디케이터·하단 보더 없음. 탭당 터치 영역 48 이상.
 */
import { Fragment } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_SIZE, spacing } from '@/tokens';

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
          <Fragment key={tab}>
            {i > 0 && <View style={styles.separator} aria-hidden />}
            <Pressable
              onPress={() => onChange(i)}
              accessibilityRole="tab"
              accessibilityLabel={tab}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <AppText
                variant="title"
                color={active ? colors.primaryText : colors.textPrimary}
                center
              >
                {tab}
              </AppText>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  separator: {
    // 시안 537:1182 — 블루 2px 세로 구분자
    width: 2,
    height: 19,
    backgroundColor: colors.primary,
  },
});
