/**
 * 분류 — 5축 벡터 → 6 메인 유형(최근접 중심) + 보조성향 결정.
 * 그리고 답변 → 최종 진단결과(diagnose). 순수 TS.
 */
import { AXES, AXIS_WEIGHTS, SUB_TRAIT_THRESHOLD, TYPE_CENTROIDS } from './config';
import { scoreAux, scoreAxes } from './scoring';
import type { Answer, AxisVector, DiagnosisResult, MainType, SubTrait } from './types';

/** 가중 유클리드 거리 (축 가중치 반영) */
export function weightedDistance(a: AxisVector, b: AxisVector, w: AxisVector = AXIS_WEIGHTS): number {
  let s = 0;
  for (const axis of AXES) {
    const d = a[axis] - b[axis];
    s += w[axis] * d * d;
  }
  return Math.sqrt(s);
}

/** 5축 벡터 → 가장 가까운 메인 유형 */
export function classifyType(vector: AxisVector): MainType {
  let best: MainType = 'active_explorer';
  let bestDist = Infinity;
  for (const type of Object.keys(TYPE_CENTROIDS) as MainType[]) {
    const dist = weightedDistance(vector, TYPE_CENTROIDS[type]);
    if (dist < bestDist) {
      bestDist = dist;
      best = type;
    }
  }
  return best;
}

/** 보조성향: 더 높은 쪽이 임계 이상이면 그것, 아니면 null (동점이면 트렌드 우선) */
export function pickSubTrait(trendScore: number, recoveryScore: number): SubTrait | null {
  const top = Math.max(trendScore, recoveryScore);
  if (top < SUB_TRAIT_THRESHOLD) return null;
  return trendScore >= recoveryScore ? 'trend_seeker' : 'recovery_charger';
}

/** 답변 → 최종 진단결과(벡터 + 유형 + 보조성향) */
export function diagnose(answers: Answer[]): DiagnosisResult {
  const vector = scoreAxes(answers);
  const { trendScore, recoveryScore } = scoreAux(answers);
  return {
    vector,
    trendScore,
    recoveryScore,
    mainType: classifyType(vector),
    subTrait: pickSubTrait(trendScore, recoveryScore),
  };
}
