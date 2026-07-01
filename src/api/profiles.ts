/**
 * profiles 테이블 접근 계층. 본인 프로필만 읽고/수정한다(RLS로도 강제됨).
 * 이메일·생년은 저장하지 않는다(최소수집). 표시 이름 없으면 '회원님' 폴백.
 */
import { getSupabase } from './supabase';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  auth_provider: string | null;
  region_sido: string | null;
  region_sigungu: string | null;
  font_scale: number;
  onboarded: boolean; // 성향테스트 완료 여부(홈 분기)
  consented_at: string | null; // 필수 동의 완료 시각(게이트)
  created_at: string;
  updated_at: string;
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export type ProfilePatch = Partial<
  Pick<Profile, 'display_name' | 'region_sido' | 'region_sigungu' | 'font_scale'>
>;

export async function updateMyProfile(patch: ProfilePatch): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  const { error } = await sb.from('profiles').update(patch).eq('id', uid);
  if (error) throw error;
}

/** 필수 동의 완료 시각 기록(가입 게이트 통과 표시). */
export async function markConsented(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  const { error } = await sb
    .from('profiles')
    .update({ consented_at: new Date().toISOString() })
    .eq('id', uid);
  if (error) throw error;
}

/** 표시 이름(없으면 폴백). */
export function displayNameOf(profile: Profile | null): string {
  return profile?.display_name?.trim() || '회원님';
}
