/**
 * useTaste — 현재 취향 스냅샷을 로드(로그인=서버, 아니면 로컬 캐시).
 * 상세 화면의 매칭%, 마이페이지 등에서 사용.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { fetchMyTaste, type TasteSnapshot } from '@/api/tasteProfiles';
import { useAuth } from '@/providers/AuthProvider';
import { getLocalTaste } from '@/state/tasteCache';

export function useTaste() {
  const { session } = useAuth();
  const [taste, setTaste] = useState<TasteSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  /** 로드 세대 토큰 — 늦게 온 이전 요청이 최신 값을 덮어쓰지 않게(스테일 스냅샷 방지). */
  const gen = useRef(0);

  const reload = useCallback(async () => {
    const g = ++gen.current;
    setLoading(true);
    let t: TasteSnapshot | null = null;
    try {
      t = session ? await fetchMyTaste() : null;
    } catch {
      t = null;
    }
    if (!t) t = await getLocalTaste();
    if (g !== gen.current) return; // 더 새로운 로드가 시작됨 → 폐기
    setTaste(t);
    setLoading(false);
  }, [session]);

  // 탭 화면은 스택 아래에 마운트된 채 남으므로, 포커스 복귀마다 갱신해야
  // 테스트 완료/재검사 후 홈·마이·사이드바가 이전 유형을 보여주지 않는다.
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        gen.current++;
      };
    }, [reload]),
  );

  return { taste, loading, reload };
}
