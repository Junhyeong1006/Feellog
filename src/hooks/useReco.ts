/**
 * useReco — 오늘의 추천 덱 관리 + 좋아요/관심없어요 피드백 반영.
 * 로드: 취향 벡터 + 활동 + (로그인 시)기존 반응 → 추천 정렬 후 반응한 건 제외(loadReco).
 * react(): 현재벡터를 EMA 보정 → 남은 덱을 새 벡터로 즉시 재정렬(S7 온라인 보정)
 *          → 로컬 캐시 저장 + (로그인 시) 서버 반영, 다음 카드로.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { upsertReaction } from '@/api/reactions';
import { persistTaste, type TasteSnapshot } from '@/api/tasteProfiles';
import { applyFeedback, matchScore } from '@/core';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import {
  EMPTY_FILTER,
  getRecoFilter,
  setRecoFilter,
  toCoreFilter,
  type StoredRecoFilter,
} from '@/state/recoFilter';
import { setLocalTaste } from '@/state/tasteCache';

import { emptyTasteSnapshot, loadRankedItems, type RecoItem } from './loadReco';

export type { RecoItem } from './loadReco';
export { emptyTasteSnapshot } from './loadReco';

export function useReco() {
  const { session } = useAuth();
  const hasSession = Boolean(session);
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<RecoItem[]>([]);
  const [index, setIndex] = useState(0);
  /** 하드필터(지역/가격). 로드 시 저장분 복원, 변경 시 저장+재로드 */
  const [filter, setFilterState] = useState<StoredRecoFilter>(EMPTY_FILTER);
  /** load()가 항상 최신 필터를 읽도록 ref로도 유지(스테일 클로저 방지 — '다시 보기' 등 무인자 호출) */
  const filterRef = useRef<StoredRecoFilter>(EMPTY_FILTER);
  const filterLoaded = useRef(false);
  /** 지역 필터 옵션(카탈로그에 존재하는 시/도) */
  const [regions, setRegions] = useState<string[]>([]);
  const tasteRef = useRef<TasteSnapshot>(emptyTasteSnapshot());
  /** 로드 세대 토큰 — 늦게 도착한 이전 로드가 최신 결과를 덮어쓰지 않게(스테일 방지). */
  const loadGen = useRef(0);
  /** 처리 중인 카드 id — 같은 카드 더블탭으로 피드백이 두 번 적용되는 것 방지. */
  const inFlight = useRef<Set<string>>(new Set());
  /** 서버 저장 직렬화 큐 — 연속 반응 시 늦게 끝난 이전 스냅샷이 최신을 덮어쓰지 않게. */
  const persistQueue = useRef<Promise<void>>(Promise.resolve());

  const load = useCallback(
    async (overrideFilter?: StoredRecoFilter) => {
      const gen = ++loadGen.current;
      setLoading(true);
      try {
        // 첫 로드에서는 저장된 필터 복원
        let f = overrideFilter;
        if (!f) {
          if (!filterLoaded.current) {
            f = await getRecoFilter();
            filterLoaded.current = true;
            filterRef.current = f;
            setFilterState(f);
          } else {
            f = filterRef.current;
          }
        }
        const { items, taste, regions: regs } = await loadRankedItems(hasSession, 40, toCoreFilter(f));
        if (gen !== loadGen.current) return; // 더 새로운 로드가 시작됨 → 이 결과 폐기
        tasteRef.current = taste;
        setDeck(items);
        setRegions(regs);
        setIndex(0);
      } catch {
        if (gen === loadGen.current) setDeck([]);
      } finally {
        if (gen === loadGen.current) setLoading(false); // 실패해도 스피너에서 벗어남
      }
    },
    // 필터는 filterRef로 읽어 항상 최신(클로저 고착 방지) — deps는 세션만
    [hasSession],
  );

  useEffect(() => {
    void load();
    // 언마운트/세션 변경 시 진행 중 로드를 무효화
    return () => {
      loadGen.current++;
    };
  }, [load]);

  /** 필터 변경: 저장 + 즉시 재로드 */
  const setFilter = useCallback(
    (next: StoredRecoFilter) => {
      filterRef.current = next;
      setFilterState(next);
      void setRecoFilter(next);
      void load(next);
    },
    [load],
  );

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

      // S7 온라인 보정: 아직 안 본 카드들을 보정된 벡터로 재점수·재정렬
      // (지나간 카드 순서는 유지해 인덱스가 흔들리지 않게 한다)
      setDeck((prev) => {
        const pos = prev.findIndex((d) => d.activity.id === id);
        if (pos < 0 || pos + 1 >= prev.length) return prev;
        const rest = prev
          .slice(pos + 1)
          .map((d) => ({ activity: d.activity, score: matchScore(nextVec, d.activity.vector) }))
          .sort((a, b) => b.score - a.score);
        return [...prev.slice(0, pos + 1), ...rest];
      });

      track('reco_react', { liked, activityId: id });

      // 저장은 큐로 직렬화하고, 항상 실행 시점의 최신 스냅샷(tasteRef)을 쓴다
      // → 연속 반응이 겹쳐도 서버/로컬에 마지막 상태가 남는다.
      persistQueue.current = persistQueue.current.then(async () => {
        try {
          await setLocalTaste(tasteRef.current);
          await upsertReaction(id, liked ? 'like' : 'dislike');
          if (hasSession) await persistTaste(tasteRef.current);
        } catch {
          // 저장 실패해도 UX는 계속(로컬 캐시엔 반영됨)
        } finally {
          inFlight.current.delete(id);
        }
      });
      await persistQueue.current;
    },
    [hasSession],
  );

  return {
    loading,
    deck,
    index,
    current: deck[index] ?? null,
    total: deck.length,
    remaining: Math.max(0, deck.length - index),
    filter,
    setFilter,
    regions,
    react,
    reset: () => load(),
  };
}
