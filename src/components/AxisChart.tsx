/**
 * AxisChart — 5축 성향을 다이버징 바로 표시(중앙=중립, 좌우 극).
 * 시니어 가독성을 위해 레이더 대신 축별 바 + 양극 라벨을 쓴다(추후 교체 쉬움).
 */
import { StyleSheet, View } from 'react-native';

import { AXES, AXIS_META, type AxisVector } from '@/core';
import { colors, radius, spacing } from '@/tokens';
import { AppText } from '@/ui';

export interface AxisChartProps {
  vector: AxisVector;
}

const TRACK_H = 12;
const THUMB = 18;

export function AxisChart({ vector }: AxisChartProps) {
  return (
    <View style={styles.wrap}>
      {AXES.map((axis) => {
        const value = Math.max(-100, Math.min(100, vector[axis]));
        const meta = AXIS_META[axis];
        const pos = (value + 100) / 2; // 0~100 (%)
        const fillLeft = Math.min(50, pos);
        const fillWidth = Math.abs(pos - 50);
        return (
          <View key={axis} style={styles.row}>
            <AppText variant="body" weight="semibold">
              {meta.label}
            </AppText>

            <View style={styles.track}>
              <View style={styles.centerTick} />
              <View style={[styles.fill, { left: `${fillLeft}%`, width: `${fillWidth}%` }]} />
              <View style={[styles.thumb, { left: `${pos}%` }]} />
            </View>

            <View style={styles.poles}>
              <AppText variant="caption" muted>
                {meta.negLabel}
              </AppText>
              <AppText variant="caption" muted>
                {meta.posLabel}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.sm,
  },
  track: {
    height: TRACK_H,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
    justifyContent: 'center',
  },
  centerTick: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: TRACK_H,
    backgroundColor: colors.border,
  },
  fill: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
  },
  thumb: {
    position: 'absolute',
    marginLeft: -THUMB / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  poles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
