/**
 * 추천 엔진 코어 — 순수 TypeScript (React Native/DOM 의존 없음)
 *
 * 이 폴더(src/core)는 RN/웹 어디에도 의존하지 않는 순수 도메인 로직만 둔다.
 * 덕분에 Vitest로 노드에서 빠르게 단위 테스트할 수 있고, 클라이언트와
 * Supabase Edge Function 양쪽에서 그대로 재사용한다.
 *
 * Phase 0에서는 5축 좌표계의 기초 함수(클램프/정규화)만 구현한다.
 * Phase 1에서 12문항 채점 → 5축 점수 → 6유형 분류 → 활동 매칭을 여기에 쌓는다.
 * (상세 수식은 docs/feellog-개발계획서.md 2장 참조)
 */

/** 5개 핵심 축. 모든 사용자/활동 벡터는 이 순서를 따른다. */
export const AXES = ['rhythm', 'relation', 'experience', 'participation', 'reward'] as const;
export type Axis = (typeof AXES)[number];

/** 축 점수 벡터: 각 축 -100 ~ +100 */
export type AxisVector = Record<Axis, number>;

/** 값을 [min, max] 범위로 자른다. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** 한 축 점수를 표준 범위(-100 ~ +100)로 자른다. */
export function clampAxis(value: number): number {
  return clamp(value, -100, 100);
}

/**
 * 문항 원점수 합을 -100 ~ +100 스케일로 정규화한다.
 * 한 축에 k개 문항이 있고 각 문항이 -2~+2이면 원점수 범위는 [-2k, +2k]이므로
 * (rawSum / (2 * questionCount)) * 100 으로 환산한다.
 */
export function normalizeAxisScore(rawSum: number, questionCount: number): number {
  if (questionCount <= 0) return 0;
  const scaled = (rawSum / (2 * questionCount)) * 100;
  return clampAxis(scaled);
}

/** 빈(중립) 축 벡터 */
export function zeroVector(): AxisVector {
  return { rhythm: 0, relation: 0, experience: 0, participation: 0, reward: 0 };
}
