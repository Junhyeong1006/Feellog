/**
 * 응답 → 7축 점수 계산 (엔진 v2).
 * 축 점수 = 해당 축 문항 응답값의 가중 평균 → -25~+25 범위 유지.
 * (5개 축은 2문항, novelty·depth는 1문항 — 시드 기준)
 * 미응답 문항은 중립(0)으로 취급한다.
 */
import { AXES, AXIS_MAX, AXIS_MIN, type Answer, type AxisVector } from './types';
import { QUESTIONS } from './questions';

export function clampAxis(v: number): number {
  return Math.max(AXIS_MIN, Math.min(AXIS_MAX, v));
}

export function emptyVector(): AxisVector {
  return { physical: 0, relation: 0, experience: 0, satisfaction: 0, value: 0, novelty: 0, depth: 0 };
}

/** 답변 배열 → 축별 점수(-25~+25). */
export function scoreAnswers(answers: readonly Answer[]): AxisVector {
  const byId = new Map(answers.map((a) => [a.q, a.value]));
  const sum = emptyVector();
  const weight = emptyVector();

  for (const q of QUESTIONS) {
    const v = byId.get(q.id) ?? 0; // 미응답 = 중립
    sum[q.axis] += v * q.weight;
    weight[q.axis] += q.weight;
  }

  const out = emptyVector();
  for (const axis of AXES) {
    out[axis] = weight[axis] > 0 ? clampAxis(sum[axis] / weight[axis]) : 0;
  }
  return out;
}
