/**
 * 오늘의 하루 픽 (홈 추천 카드) — 엔진 v2.
 * 현재 선호 벡터로 활동 70종을 랭킹 → 한 장씩 제시,
 * [좋아요](lr 0.10)/[별로에요=관심없음](lr 0.05) 피드백으로 current 벡터를 즉시 갱신(정책 §4).
 * 성향 테스트 전(선호 없음)에는 null을 반환 — 홈이 '스타일 찾기' 상태를 보여준다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { applyFeedback, emptyVector, rankActivities, type Activity, type MatchFilter } from '@/core';
import { ACTIVITY_SEED } from '@/data/activitySeed';
import { track } from '@/lib/analytics';

import { savePrefsCurrent, usePrefs } from './usePrefs';

export interface TodayPickState {
  /** 선호(테스트) 존재 여부 — false면 홈은 '나의 스타일 찾기' 카드 */
  hasPrefs: boolean;
  loading: boolean;
  /** 현재 카드(없으면 다 봤음) */
  current: { activity: Activity; score: number } | null;
  index: number;
  total: number;
  filter: MatchFilter;
  setFilter: (f: MatchFilter) => void;
  react: (liked: boolean) => Promise<void>;
  reset: () => void;
}

export function useTodayPick(): TodayPickState {
  const { prefs, loading } = usePrefs();
  const [index, setIndex] = useState(0);
  const [filter, setFilterState] = useState<MatchFilter>({});
  /** 세션 내 이미 반응한 활동(다시 안 보이게) */
  const reactedRef = useRef<Set<string>>(new Set());
  const [, bump] = useState(0);

  const ranked = useMemo(() => {
    if (!prefs) return [];
    return rankActivities(prefs.current ?? emptyVector(), ACTIVITY_SEED, filter).filter(
      (r) => !reactedRef.current.has(r.activity.id),
    );
    // index/bump로 재계산 트리거(피드백 후 재랭킹 — 정책: current 갱신이 다음 추천에 반영)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, filter, index]);

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  const current = ranked.length > 0 ? ranked[0] : null;

  const react = useCallback(
    async (liked: boolean) => {
      if (!prefs || !current) return;
      reactedRef.current.add(current.activity.id);
      const next = applyFeedback(prefs.current, current.activity.vector, liked ? 'like' : 'not_interested');
      track(liked ? 'pick_like' : 'pick_pass', { activityId: current.activity.id });
      await savePrefsCurrent(next);
      setIndex((i) => i + 1);
    },
    [prefs, current],
  );

  const reset = useCallback(() => {
    reactedRef.current = new Set();
    setIndex(0);
    bump((b) => b + 1);
  }, []);

  const setFilter = useCallback((f: MatchFilter) => setFilterState(f), []);

  return {
    hasPrefs: prefs != null,
    loading,
    current,
    index,
    total: ranked.length + reactedRef.current.size,
    filter,
    setFilter,
    react,
    reset,
  };
}
