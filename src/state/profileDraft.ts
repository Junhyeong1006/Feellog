/**
 * 프로필 설정 로컬 초안(게스트/오프라인 정본).
 * profile-setup에서 입력한 사진·이름·생년월일·성별·소개를 기기에 저장 —
 * 게스트도 프로필을 완성할 수 있고, 로그인 사용자는 서버 반영 실패 시 이 초안이 남는다.
 * (사진은 URI만 보관 — 업로드는 서버 연동 단계에서 처리)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'feellog.profileDraft.v1';

export type ProfileGender = 'female' | 'male' | 'none';

export interface ProfileDraft {
  /** 이름(별명) */
  nickname?: string;
  /** 생년월일 YYYY-MM-DD */
  birthDate?: string;
  gender?: ProfileGender;
  /** 한줄 소개 */
  bio?: string;
  /** 프로필 사진 로컬 URI(웹은 blob:/data: URI) */
  photoUri?: string;
  /** 마지막 저장 시각(ISO) */
  updatedAt: string;
}

export async function getProfileDraft(): Promise<ProfileDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProfileDraft) : null;
  } catch {
    return null;
  }
}

export async function saveProfileDraft(draft: Omit<ProfileDraft, 'updatedAt'>): Promise<void> {
  try {
    const value: ProfileDraft = { ...draft, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // 저장 실패는 치명적이지 않음(다음 저장에 재시도)
  }
}

export async function clearProfileDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
