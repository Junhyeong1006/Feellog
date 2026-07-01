/**
 * 매칭 — 사용자 5축 벡터 ↔ 활동 5축 태그. 하드필터 → 유사도 점수(0~100) → 정렬.
 * (개발계획서 2.3 참조) 순수 TS.
 */
import { AXES, AXIS_WEIGHTS } from './config';
import { weightedDistance } from './classify';
import type { Activity, AxisVector, MatchResult, RecoFilter } from './types';

/** 가중 유클리드 거리의 이론적 최대값 (각 축 최대 200 차이) */
const MAX_DISTANCE = 200 * Math.sqrt(AXES.reduce((s, a) => s + AXIS_WEIGHTS[a], 0));

/** 사용자↔활동 매칭 점수 0~100 (가까울수록 높음) */
export function matchScore(user: AxisVector, activityVector: AxisVector): number {
  const d = weightedDistance(user, activityVector);
  return Math.round(clamp01(1 - d / MAX_DISTANCE) * 100);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** 하드필터 통과 여부 (지역/예산/시간/강도) */
export function passesFilter(activity: Activity, filter?: RecoFilter): boolean {
  if (!filter) return true;
  if (filter.regionSido && activity.regionSido && activity.regionSido !== filter.regionSido) {
    return false;
  }
  if (filter.maxPrice != null && activity.price != null && activity.price > filter.maxPrice) {
    return false;
  }
  if (
    filter.maxDurationMin != null &&
    activity.durationMin != null &&
    activity.durationMin > filter.maxDurationMin
  ) {
    return false;
  }
  if (
    filter.maxIntensity != null &&
    activity.intensity != null &&
    activity.intensity > filter.maxIntensity
  ) {
    return false;
  }
  return true;
}

/** 추천: 필터 → 점수 → 내림차순 정렬. limit로 상위 N개. */
export function recommend(
  user: AxisVector,
  activities: Activity[],
  opts?: { filter?: RecoFilter; limit?: number },
): MatchResult[] {
  const results = activities
    .filter((a) => passesFilter(a, opts?.filter))
    .map((activity) => ({ activity, score: matchScore(user, activity.vector) }))
    .sort((a, b) => b.score - a.score);
  return opts?.limit != null ? results.slice(0, opts.limit) : results;
}
