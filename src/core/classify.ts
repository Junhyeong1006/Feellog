/**
 * 분류 — 5축 벡터 → 6 메인 유형(최근접 중심) + 보조성향 결정.
 * 그리고 답변 → 최종 진단결과(diagnose). 순수 TS.
 */
import {
  AXES,
  AXIS_WEIGHTS,
  CLASSIFY_WEIGHTS,
  SUB_TRAIT_GAP,
  SUB_TRAIT_THRESHOLD,
  TYPE_CENTROIDS,
  TYPE_TIE_ORDER,
} from './config';
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

/**
 * 5축 벡터 → 가장 가까운 메인 유형.
 * 분류는 균등 가중(§2.2.2 — 유형 정의는 모든 축을 동등하게 본다) + 결정적 tie-break.
 * 추천 매칭의 AXIS_WEIGHTS와 분리되어 있음에 주의.
 */
export function classifyType(vector: AxisVector): MainType {
  let best: MainType = TYPE_TIE_ORDER[0];
  let bestDist = Infinity;
  for (const type of TYPE_TIE_ORDER) {
    const dist = weightedDistance(vector, TYPE_CENTROIDS[type], CLASSIFY_WEIGHTS);
    if (dist < bestDist) {
      // 동점(dist === bestDist)은 갱신하지 않음 → TYPE_TIE_ORDER 앞선 유형 유지(재현성)
      bestDist = dist;
      best = type;
    }
  }
  return best;
}

/**
 * 보조성향: 더 높은 쪽이 임계(60) 이상 + 두 점수 차가 GAP(8) 이상일 때만 표시.
 * 박빙이면 null(애매성 회피 — §2.1.3), 트렌드 우선은 strict >.
 */
export function pickSubTrait(trendScore: number, recoveryScore: number): SubTrait | null {
  const top = Math.max(trendScore, recoveryScore);
  if (top < SUB_TRAIT_THRESHOLD) return null;
  if (Math.abs(trendScore - recoveryScore) < SUB_TRAIT_GAP) return null;
  return trendScore > recoveryScore ? 'trend_seeker' : 'recovery_charger';
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
