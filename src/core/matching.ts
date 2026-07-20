/**
 * 추천 매칭 (엔진 v2) — 사용자 현재 7축 벡터 ↔ 활동 7축 점수.
 * 점수 = 100 × (1 - 정규화 L1 거리). 축당 최대 차이 50(-25↔+25)이므로
 * 완전 반대 성향이면 0, 동일하면 100. 필터(신체 부담 등)는 성향과 분리(정책 §5).
 */
import { AXES, type Activity, type AxisVector } from './types';

export interface ScoredActivity<A extends Activity = Activity> {
  activity: A;
  /** 0~100 매칭 점수 */
  score: number;
}

const MAX_TOTAL_DIFF = 50 * 7;

/** 사용자 벡터와 활동 벡터의 매칭 점수(0~100, 정수) */
export function matchScore(user: AxisVector, activity: AxisVector): number {
  let diff = 0;
  for (const axis of AXES) {
    diff += Math.abs(user[axis] - activity[axis]);
  }
  return Math.round(100 * (1 - diff / MAX_TOTAL_DIFF));
}

export interface MatchFilter {
  /** 카테고리(원본 카테고리명) 제한 — null/빈 배열이면 전체 */
  categories?: readonly string[] | null;
  /** 신체 부담 상한(1~5) — null이면 제한 없음 */
  maxPhysicalBurden?: number | null;
}

export function passesFilter(activity: Activity, filter?: MatchFilter | null): boolean {
  if (!filter) return true;
  if (filter.categories && filter.categories.length > 0 && !filter.categories.includes(activity.category)) {
    return false;
  }
  if (filter.maxPhysicalBurden != null && activity.physicalBurden > filter.maxPhysicalBurden) {
    return false;
  }
  return true;
}

/** 활동 목록을 매칭 점수 내림차순으로 정렬(동점은 id 오름차순 — 결정적) */
export function rankActivities<A extends Activity>(
  user: AxisVector,
  activities: readonly A[],
  filter?: MatchFilter | null,
): ScoredActivity<A>[] {
  return activities
    .filter((a) => passesFilter(a, filter))
    .map((a) => ({ activity: a, score: matchScore(user, a.vector) }))
    .sort((x, y) => y.score - x.score || (x.activity.id < y.activity.id ? -1 : 1));
}
