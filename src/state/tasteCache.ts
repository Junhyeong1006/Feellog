/**
 * 취향 스냅샷 로컬 캐시(AsyncStorage). 게스트/오프라인에서도 추천·피드백이 동작하도록,
 * 테스트 결과와 피드백 보정본을 기기에 저장한다. 로그인 사용자는 서버(taste_profiles)가 정본.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TasteSnapshot } from '@/api/tasteProfiles';

const KEY = 'feellog.taste';

export async function getLocalTaste(): Promise<TasteSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TasteSnapshot) : null;
  } catch {
    return null;
  }
}

export async function setLocalTaste(snapshot: TasteSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // 저장 실패는 무시(다음 저장에 갱신)
  }
}

export async function clearLocalTaste(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
