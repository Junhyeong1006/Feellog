/**
 * ProgressBar — 성향테스트 진행 표시 (v6 블루 DS).
 * value: 0~1. 트랙(neutral200) + 채움(primary 파랑). 둥근 캡슐.
 */
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/tokens';

export interface ProgressBarProps {
  /** 0~1 */
  value: number;
  /** 바 높이(기본 10) */
  height?: number;
  trackColor?: string;
  fillColor?: string;
  accessibilityLabel?: string;
}

export function ProgressBar({
  value,
  height = 10,
  trackColor = colors.divider,
  fillColor = colors.primary,
  accessibilityLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, borderRadius: radius.pill, backgroundColor: trackColor }]}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, borderRadius: radius.pill, backgroundColor: fillColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    minWidth: 4,
  },
});
