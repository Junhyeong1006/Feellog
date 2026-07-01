/**
 * 추천 로딩 공용 로직 — useReco(인터랙티브 덱)와 useRecommendations(읽기전용 미리보기)가 공유.
 * 취향 벡터 로드(로그인=서버/아니면 로컬) → 활동 로드 → 반응한 활동 제외 → 추천 정렬.
 * ※ 반응 제외를 limit 슬라이스보다 먼저 적용한다(덱이 비는 버그 방지).
 */
import { fetchActivities, type AppActivity } from '@/api/activities';
import { fetchMyReactions } from '@/api/reactions';
import { fetchMyTaste, type TasteSnapshot } from '@/api/tasteProfiles';
import { recommend, zeroVector } from '@/core';
import { SAMPLE_ACTIVITIES } from '@/data/sampleActivities';
import { getLocalTaste } from '@/state/tasteCache';

export interface RecoItem {
  activity: AppActivity;
  score: number;
}

export function emptyTasteSnapshot(): TasteSnapshot {
  const z = zeroVector();
  return {
    vector: z,
    base: { ...z },
    mainType: null,
    subTrait: null,
    trendScore: 50,
    recoveryScore: 50,
    feedbackCount: 0,
  };
}

export async function loadRankedItems(
  hasSession: boolean,
  limit?: number,
): Promise<{ items: RecoItem[]; taste: TasteSnapshot }> {
  let taste: TasteSnapshot | null = null;
  try {
    taste = hasSession ? await fetchMyTaste() : null;
  } catch {
    taste = null;
  }
  if (!taste) taste = await getLocalTaste();
  const snapshot = taste ?? emptyTasteSnapshot();

  // 활동 로드 실패(네트워크/서버 오류) 시 로컬 샘플로 폴백 → 피드가 무한 로딩에 걸리지 않게.
  const [activities, reactions] = await Promise.all([
    fetchActivities().catch(() => SAMPLE_ACTIVITIES),
    hasSession ? fetchMyReactions().catch(() => []) : Promise.resolve([]),
  ]);

  const reacted = new Set(reactions.map((r) => r.activityId));
  const candidates = activities.filter((a) => !reacted.has(a.id));
  const ranked = recommend(snapshot.vector, candidates, limit != null ? { limit } : undefined);

  return { items: ranked.map((r) => ({ activity: r.activity, score: r.score })), taste: snapshot };
}
