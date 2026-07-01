/**
 * 채점 — 문항 답변 → 5축 점수(-100~100) + 보조성향 점수(0~100). 순수 TS.
 * 수식: 축별 관련 문항의 (dir × 답변)을 합산 후 -100~100으로 정규화.
 * (개발계획서 2.1 참조)
 */
import { AXES } from './config';
import { QUESTIONS } from './questions';
import type { Answer, Axis, AxisVector } from './types';

/** 값을 [min, max]로 자른다 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** 한 축 점수를 -100~100으로 자른다 */
export function clampAxis(value: number): number {
  return clamp(value, -100, 100);
}

/** 중립(0) 벡터 */
export function zeroVector(): AxisVector {
  return { rhythm: 0, relation: 0, experience: 0, participation: 0, reward: 0 };
}

/**
 * 문항 원점수 합(rawSum, 범위 -2·count ~ +2·count)을 -100~100으로 정규화.
 * (rawSum / (2·count)) × 100. 정수 반올림(DB smallint).
 */
export function normalizeAxisScore(rawSum: number, questionCount: number): number {
  if (questionCount <= 0) return 0;
  return clampAxis(Math.round((rawSum / (2 * questionCount)) * 100));
}

/** 보조성향 원점수(범위 -2·count ~ +2·count)를 0~100으로 정규화(중립=50) */
export function normalizeAuxScore(rawSum: number, questionCount: number): number {
  if (questionCount <= 0) return 0;
  const scaled = ((rawSum + 2 * questionCount) / (4 * questionCount)) * 100;
  return Math.round(clamp(scaled, 0, 100));
}

function answerMap(answers: Answer[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const a of answers) m.set(a.q, a.value);
  return m;
}

/** 답변 → 5축 점수 벡터(-100~100) */
export function scoreAxes(answers: Answer[]): AxisVector {
  const am = answerMap(answers);
  const acc: Record<Axis, { sum: number; count: number }> = {
    rhythm: { sum: 0, count: 0 },
    relation: { sum: 0, count: 0 },
    experience: { sum: 0, count: 0 },
    participation: { sum: 0, count: 0 },
    reward: { sum: 0, count: 0 },
  };
  for (const q of QUESTIONS) {
    if (!q.axis) continue;
    const v = am.get(q.id) ?? 0;
    acc[q.axis].sum += (q.dir ?? 1) * v;
    acc[q.axis].count += 1;
  }
  const out = zeroVector();
  for (const axis of AXES) out[axis] = normalizeAxisScore(acc[axis].sum, acc[axis].count);
  return out;
}

/** 답변 → 보조성향 점수(0~100) */
export function scoreAux(answers: Answer[]): { trendScore: number; recoveryScore: number } {
  const am = answerMap(answers);
  let trendSum = 0,
    trendCount = 0,
    recSum = 0,
    recCount = 0;
  for (const q of QUESTIONS) {
    const v = am.get(q.id) ?? 0;
    if (q.trendDir) {
      trendSum += q.trendDir * v;
      trendCount += 1;
    }
    if (q.recoveryDir) {
      recSum += q.recoveryDir * v;
      recCount += 1;
    }
  }
  return {
    trendScore: normalizeAuxScore(trendSum, trendCount),
    recoveryScore: normalizeAuxScore(recSum, recCount),
  };
}
