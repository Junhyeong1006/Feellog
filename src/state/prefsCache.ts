/**
 * 7축 선호 상태 로컬 캐시 (엔진 v2, 정책 §4.5).
 * initial(최초 테스트)·current(피드백 반영)·유형을 기기에 저장 —
 * 게스트/오프라인에서도 추천·피드백이 동작한다. 로그인 사용자는 서버(preference_scores)가 정본.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AxisVector, MainType } from '@/core';

const KEY = 'feellog.prefs.v2';

export interface PrefsSnapshot {
  initial: AxisVector;
  current: AxisVector;
  mainType: MainType;
  feedbackCount: number;
}

export async function getLocalPrefs(): Promise<PrefsSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PrefsSnapshot) : null;
  } catch {
    return null;
  }
}

export async function setLocalPrefs(snapshot: PrefsSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // 저장 실패는 치명적이지 않음
  }
}

export async function clearLocalPrefs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
