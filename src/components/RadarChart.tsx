/**
 * RadarChart — 5축 성향 레이더(S4, react-native-svg — 웹·앱 공용).
 * 각 축은 -100(negLabel 극) ~ +100(posLabel 극)을 중심(0%)→바깥(100%)으로 정규화해 그린다.
 * 꼭짓점 라벨은 "축 이름 + 현재 기운 극"을 함께 적어 시니어도 방향을 읽을 수 있게 한다.
 *
 * 접근성: 라벨은 화면 기준 15px 고정(시니어 최소 캡션 크기) — 좁은 화면에서는
 * 글씨 대신 도형(펜타곤)만 축소된다. 자세한 좌/우 극 비교는 AxisChart 막대가 담당.
 */
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { AXES, AXIS_META, type AxisVector } from '@/core';
import { colors, fontFamily, palette } from '@/tokens';

export interface RadarChartProps {
  vector: AxisVector;
  /** 사용 가능한 렌더 폭(px) — 카드 내부 폭을 넘기면 안 됨. 기본 448. */
  maxWidth?: number;
}

const GRID_LEVELS = [0.25, 0.5, 0.75, 1];
const H_PAD = 90; // 좌우 라벨('실용·성취' 15px 5자) 공간
const V_PAD = 46; // 상하 라벨 공간
const LABEL_R = 20; // 꼭짓점에서 라벨 중심까지 거리
const FONT = 15; // 라벨 글씨(화면 px 고정 — 축소 금지)

/** -100..100 → 0..1 (중심=negLabel 극, 바깥=posLabel 극) */
function norm(value: number): number {
  const clamped = Math.max(-100, Math.min(100, value));
  return (clamped + 100) / 200;
}

export function RadarChart({ vector, maxWidth = 448 }: RadarChartProps) {
  const W = Math.max(260, Math.min(448, maxWidth));
  const r = (W - H_PAD * 2) / 2;
  const H = r * 2 + V_PAD * 2;
  const cx = W / 2;
  const cy = V_PAD + r;

  // 위 꼭짓점부터 시계방향 5각형
  const angleOf = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const pointAt = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angleOf(i)),
    y: cy + r * ratio * Math.sin(angleOf(i)),
  });
  const toStr = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  const gridPolys = GRID_LEVELS.map((lv) => toStr(AXES.map((_, i) => pointAt(i, lv))));
  const dataPts = AXES.map((axis, i) => pointAt(i, norm(vector[axis])));

  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={a11yLabel(vector)}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* 그리드 */}
        {gridPolys.map((pts, idx) => (
          <Polygon
            key={idx}
            points={pts}
            fill={idx === GRID_LEVELS.length - 1 ? colors.surfaceInset : 'none'}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {/* 축선 */}
        {AXES.map((_, i) => {
          const p = pointAt(i, 1);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />;
        })}
        {/* 데이터 영역 */}
        <Polygon
          points={toStr(dataPts)}
          fill={palette.blue500}
          fillOpacity={0.22}
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {dataPts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={colors.primary} stroke={colors.surface} strokeWidth={2} />
        ))}
        {/* 꼭짓점 라벨: 축 이름(진하게) + 기운 극(보조) — 화면 15px 고정 */}
        {AXES.map((axis, i) => {
          const meta = AXIS_META[axis];
          const v = vector[axis];
          const lean = v >= 15 ? meta.posLabel : v <= -15 ? meta.negLabel : '중간';
          const lx = cx + (r + LABEL_R) * Math.cos(angleOf(i));
          const ly = cy + (r + LABEL_R) * Math.sin(angleOf(i));
          const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
          // 위쪽 라벨은 꼭짓점 위로, 아래쪽 라벨은 꼭짓점 아래로 두 줄을 쌓는다
          const above = ly <= cy;
          const nameY = above ? ly - 6 : ly + 12;
          const leanY = above ? ly + 12 : ly + 30;
          return (
            <Fragment key={axis}>
              <SvgText
                x={lx}
                y={nameY}
                textAnchor={anchor}
                fontSize={FONT}
                fontWeight="700"
                fill={colors.textPrimary}
                fontFamily={fontFamily.base}
              >
                {meta.label}
              </SvgText>
              <SvgText
                x={lx}
                y={leanY}
                textAnchor={anchor}
                fontSize={FONT}
                fill={colors.textSecondary}
                fontFamily={fontFamily.base}
              >
                {lean}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function a11yLabel(vector: AxisVector): string {
  return AXES.map((axis) => {
    const meta = AXIS_META[axis];
    const v = vector[axis];
    const lean = v >= 15 ? meta.posLabel : v <= -15 ? meta.negLabel : '중간';
    return `${meta.label} ${lean}`;
  }).join(', ');
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
});
