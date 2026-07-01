/**
 * useLikedActivities — 내가 좋아요한 활동 목록(마이페이지). 로그인 전용(서버 반응 기반).
 * 탭 재진입 시(useFocusEffect) 조용히 다시 불러와, 추천 탭에서 누른 좋아요가 바로 반영되게 한다.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { fetchActivities, type AppActivity } from '@/api/activities';
import { fetchLikedActivityIds } from '@/api/reactions';
import { useAuth } from '@/providers/AuthProvider';

export function useLikedActivities() {
  const { session } = useAuth();
  const hasSession = Boolean(session);
  const [items, setItems] = useState<AppActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const gen = useRef(0);

  const load = useCallback(async () => {
    const g = ++gen.current;
    if (!hasSession) {
      if (g === gen.current) {
        setItems([]);
        setLoading(false);
      }
      return;
    }
    try {
      const [likedIds, activities] = await Promise.all([fetchLikedActivityIds(), fetchActivities()]);
      const set = new Set(likedIds);
      const liked = activities.filter((a) => set.has(a.id));
      if (g !== gen.current) return;
      setItems(liked);
    } catch {
      if (g === gen.current) setItems([]);
    } finally {
      if (g === gen.current) setLoading(false);
    }
  }, [hasSession]);

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
