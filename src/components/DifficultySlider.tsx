/**
 * DifficultySlider — 난이도 5단계 선택 (26.07 온보딩작업 시안 631:506 '난이도').
 * 회색 트랙 + 선택 지점까지 파랑 채움 + 단계 도트(지난 단계 파랑 채움/이후 흰+파랑 보더)
 * + 현재 단계 큰 파랑 원 + 아래 라벨(하/중하/중/중상/상). 각 단계 터치 48dp 확보.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/tokens';
import { AppText } from '@/ui';

export const DIFFICULTY_LEVELS = ['하', '중하', '중', '중상', '상'] as const;
export type DifficultyIndex = 0 | 1 | 2 | 3 | 4;

const DOT_SIZE = 15;
const MARKER_SIZE = 30;
const TRACK_HEIGHT = 4;
/** 단계 터치 최소 높이(48dp) */
const MIN_STEP_HEIGHT = 48;

export interface DifficultySliderProps {
  /** 선택 단계 인덱스(0~4), 미선택 null */
  value: number | null;
  onChange: (index: DifficultyIndex) => void;
}

export function DifficultySlider({ value, onChange }: DifficultySliderProps) {
  const [width, setWidth] = useState(0);
  const colWidth = width / DIFFICULTY_LEVELS.length;
  const trackLeft = colWidth / 2;
  const trackWidth = Math.max(0, width - colWidth);

  return (
    // 라벨을 각 단계 터치 영역 안에 포함(터치 48+라벨 높이 확보)
    <View style={styles.sliderArea} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <>
          <View style={[styles.track, { left: trackLeft, width: trackWidth }]} />
          {value != null && value > 0 && (
            <View style={[styles.fill, { left: trackLeft, width: colWidth * value }]} />
          )}
        </>
      )}
      {DIFFICULTY_LEVELS.map((level, i) => {
        const isCurrent = value === i;
        const isPassed = value != null && i < value;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(i as DifficultyIndex)}
            accessibilityRole="button"
            accessibilityLabel={`난이도 ${level}`}
            accessibilityState={{ selected: isCurrent }}
            style={styles.step}
          >
            <View style={styles.dotArea}>
              <View
                style={[
                  styles.dot,
                  isPassed && styles.dotPassed,
                  isCurrent && styles.dotCurrent,
                ]}
              />
            </View>
            <AppText variant="body" center weight={isCurrent ? 'bold' : 'medium'}>
              {level}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sliderArea: {
    flexDirection: 'row',
  },
  track: {
    position: 'absolute',
    top: MIN_STEP_HEIGHT / 2 - TRACK_HEIGHT / 2, // 도트 행 세로 중앙
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
  },
  fill: {
    position: 'absolute',
    top: MIN_STEP_HEIGHT / 2 - TRACK_HEIGHT / 2,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  dotArea: {
    height: MIN_STEP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dotPassed: {
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
});
