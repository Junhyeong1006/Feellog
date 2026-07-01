/**
 * useReco — 오늘의 추천 덱 관리 + 좋아요/관심없어요 피드백 반영.
 * 로드: 취향 벡터 + 활동 + (로그인 시)기존 반응 → 추천 정렬 후 반응한 건 제외.
 * react(): 현재벡터를 EMA 보정 → 로컬 캐시 저장 + (로그인 시) 서버 반영, 다음 카드로.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchActivities, type AppActivity } from '@/api/activities';
import { fetchMyReactions, upsertReaction } from '@/api/reactions';
import { fetchMyTaste, persistTaste, type TasteSnapshot } from '@/api/tasteProfiles';
import { applyFeedback, recommend, zeroVector } from '@/core';
import { useAuth } from '@/providers/AuthProvider';
import { getLocalTaste, setLocalTaste } from '@/state/tasteCache';

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

export function useReco() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<RecoItem[]>([]);
  const [index, setIndex] = useState(0);
  const tasteRef = useRef<TasteSnapshot>(emptyTasteSnapshot());
  /** 로드 세대 토큰 — 늦게 도착한 이전 로드가 최신 결과를 덮어쓰지 않게(스테일 방지). */
  const loadGen = useRef(0);
  /** 처리 중인 카드 id — 같은 카드 더블탭으로 피드백이 두 번 적용되는 것 방지. */
  const inFlight = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const gen = ++loadGen.current;
    setLoading(true);

    let taste: TasteSnapshot | null = null;
    try {
      taste = session ? await fetchMyTaste() : null;
    } catch {
      taste = null;
    }
    if (!taste) taste = await getLocalTaste();

    const [activities, reactions] = await Promise.all([
      fetchActivities(),
      session ? fetchMyReactions().catch(() => []) : Promise.resolve([]),
    ]);

    if (gen !== loadGen.current) return; // 더 새로운 로드가 시작됨 → 이 결과 폐기

    tasteRef.current = taste ?? emptyTasteSnapshot();
    const reacted = new Set(reactions.map((r) => r.activityId));
    // 반응한 활동을 먼저 후보에서 제외한 뒤 상위 N개를 뽑는다(limit이 반응 제외보다 먼저 잘리는 버그 방지).
    const candidates = activities.filter((a) => !reacted.has(a.id));
    const ranked = recommend(tasteRef.current.vector, candidates, { limit: 40 });
    setDeck(ranked.map((r) => ({ activity: r.activity, score: r.score })));
    setIndex(0);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void load();
    // 언마운트/세션 변경 시 진행 중 로드를 무효화
    return () => {
      loadGen.current++;
    };
  }, [load]);

  const react = useCallback(
    async (item: RecoItem, liked: boolean) => {
      const id = item.activity.id;
      if (inFlight.current.has(id)) return; // 같은 카드 중복 처리 방지
      inFlight.current.add(id);
      setIndex((i) => i + 1);

      const taste = tasteRef.current;
      const nextVec = applyFeedback(
        taste.base,
        taste.vector,
        item.activity.vector,
        liked,
        taste.feedbackCount,
      );
      const nextSnap: TasteSnapshot = {
        ...taste,
        vector: nextVec,
        feedbackCount: taste.feedbackCount + 1,
      };
      tasteRef.current = nextSnap;
      await setLocalTaste(nextSnap);

      try {
        await upsertReaction(id, liked ? 'like' : 'dislike');
        if (session) await persistTaste(nextSnap);
      } catch {
        // 저장 실패해도 UX는 계속(로컬 캐시엔 반영됨)
      } finally {
        inFlight.current.delete(id);
      }
    },
    [session],
  );

  return {
    loading,
    deck,
    index,
    current: deck[index] ?? null,
    total: deck.length,
    remaining: Math.max(0, deck.length - index),
    react,
    reset: load,
  };
}
