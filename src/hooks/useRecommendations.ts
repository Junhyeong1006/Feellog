/**
 * useRecommendations — 읽기전용 추천 상위 N개(홈 미리보기 등). 피드백/덱 상태 없음.
 * 탭 재진입 시(useFocusEffect) 조용히 다시 불러와 반응한 활동을 최신으로 제외한다.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { getRecoFilter, toCoreFilter } from '@/state/recoFilter';

import { loadRankedItems, type RecoItem } from './loadReco';

export function useRecommendations(limit: number) {
  const { session } = useAuth();
  const hasSession = Boolean(session);
  const [items, setItems] = useState<RecoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const gen = useRef(0);

  const load = useCallback(async () => {
    const g = ++gen.current;
    try {
      // 추천 탭에서 고른 필터를 미리보기에도 동일 적용(일관성)
      const filter = toCoreFilter(await getRecoFilter());
      const { items: next } = await loadRankedItems(hasSession, limit, filter);
      if (g !== gen.current) return;
      setItems(next);
    } catch {
      // 이전 목록 유지(조용히 실패)
    } finally {
      if (g === gen.current) setLoading(false);
    }
  }, [hasSession, limit]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        gen.current++;
      };
    }, [load]),
  );

  return { items, loading, reload: load };
}
