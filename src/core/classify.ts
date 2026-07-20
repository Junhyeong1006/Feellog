/**
 * 유형 판정 (엔진 v2) — 7축 벡터를 6유형 기준 벡터와 비교해 최근접 유형 산출.
 * 거리 = 유클리드(L2). 동일 거리는 TYPE_ORDER(시드 순서)로 결정적 처리.
 * 정책 §2: "활동 유형 라벨은 최종 점수를 유형별 기준 벡터와 비교해 산출" — 사용자·활동 공용.
 */
import { TYPE_ORDER, TYPE_PROFILES } from './config';
import { scoreAnswers } from './scoring';
import { AXES, type Answer, type AxisVector, type DiagnosisResult, type MainType } from './types';

/** 두 7축 벡터의 유클리드 거리 */
export function vectorDistance(a: AxisVector, b: AxisVector): number {
  let s = 0;
  for (const axis of AXES) {
    const d = a[axis] - b[axis];
    s += d * d;
  }
  return Math.sqrt(s);
}

/** 벡터 → 최근접 유형 (동점은 TYPE_ORDER 우선) */
export function classifyType(vector: AxisVector): { mainType: MainType; distances: Record<MainType, number> } {
  const distances = {} as Record<MainType, number>;
  let best: MainType = TYPE_ORDER[0];
  let bestD = Infinity;
  for (const t of TYPE_ORDER) {
    const d = vectorDistance(vector, TYPE_PROFILES[t].vector);
    distances[t] = d;
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return { mainType: best, distances };
}

/** 답변 → 최종 진단 결과 */
export function diagnose(answers: readonly Answer[]): DiagnosisResult {
  const vector = scoreAnswers(answers);
  const { mainType, distances } = classifyType(vector);
  return { vector, mainType, distances };
}
