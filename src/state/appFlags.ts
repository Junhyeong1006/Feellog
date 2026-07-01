/**
 * 로컬 UX 플래그(AsyncStorage; 웹은 localStorage 폴백).
 * - onboardingSeen: 인트로 3장 노출 완료(재로그인해도 다시 안 보이게)
 * - guest: '둘러보기'로 진입한 비로그인 세션(둘러보기 상태 유지)
 * 서버 권위 데이터(동의/테스트완료)는 profiles에 있고, 여기엔 기기 로컬 UX만 둔다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboardingSeen: 'feellog.onboardingSeen',
  guest: 'feellog.guest',
} as const;

async function getBool(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === '1';
  } catch {
    return false;
  }
}

async function setBool(key: string, value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value ? '1' : '0');
  } catch {
    // 저장 실패는 치명적이지 않음(다음 실행에 다시 시도)
  }
}

export const getOnboardingSeen = () => getBool(KEYS.onboardingSeen);
export const setOnboardingSeen = (v: boolean) => setBool(KEYS.onboardingSeen, v);

export const getGuest = () => getBool(KEYS.guest);
export const setGuest = (v: boolean) => setBool(KEYS.guest, v);
