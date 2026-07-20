/**
 * 7축 선호 상태 훅 (엔진 v2).
 * 로컬(AsyncStorage)이 1차 저장소 — 게스트/오프라인 완전 동작.
 * 로그인 시 서버(preference_scores)와 동기화는 api/preferences에서 (있으면 서버 우선).
 */
import { useCallback, useEffect, useState } from 'react';

import { classifyType, type AxisVector } from '@/core';
import { clearLocalPrefs, getLocalPrefs, setLocalPrefs, type PrefsSnapshot } from '@/state/prefsCache';

let memoryCache: PrefsSnapshot | null | undefined; // undefined=미로드, null=없음
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** 테스트 완료 시 호출 — initial=current로 새로 시작 */
export async function savePrefsFromTest(vector: AxisVector): Promise<PrefsSnapshot> {
  const { mainType } = classifyType(vector);
  const snapshot: PrefsSnapshot = {
    initial: { ...vector },
    current: { ...vector },
    mainType,
    feedbackCount: 0,
  };
  memoryCache = snapshot;
  await setLocalPrefs(snapshot);
  notify();
  return snapshot;
}

/** 피드백 반영 후 현재 벡터 갱신(유형은 재산출 — 정책 §5: 누적 후 재산출) */
export async function savePrefsCurrent(current: AxisVector): Promise<PrefsSnapshot | null> {
  const prev = memoryCache ?? (await getLocalPrefs());
  if (!prev) return null;
  const { mainType } = classifyType(current);
  const snapshot: PrefsSnapshot = {
    ...prev,
    current: { ...current },
    mainType,
    feedbackCount: prev.feedbackCount + 1,
  };
  memoryCache = snapshot;
  await setLocalPrefs(snapshot);
  notify();
  return snapshot;
}

export async function resetPrefs(): Promise<void> {
  memoryCache = null;
  await clearLocalPrefs();
  notify();
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<PrefsSnapshot | null>(memoryCache ?? null);
  const [loading, setLoading] = useState(memoryCache === undefined);

  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (alive) setPrefs(memoryCache ?? null);
    };
    listeners.add(sync);
    if (memoryCache === undefined) {
      getLocalPrefs().then((p) => {
        memoryCache = p;
        if (alive) {
          setPrefs(p);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
    return () => {
      alive = false;
      listeners.delete(sync);
    };
  }, []);

  const refresh = useCallback(async () => {
    memoryCache = await getLocalPrefs();
    notify();
  }, []);

  return { prefs, loading, refresh };
}
