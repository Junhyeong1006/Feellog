/**
 * 소셜 로그인. 이메일·비밀번호 없음.
 *
 * - 구글/애플: Supabase signInWithOAuth (웹=리다이렉트, 네이티브=WebBrowser + code 교환).
 * - 카카오: Supabase 기본 provider가 이메일을 강제 요청(KOE205)하므로 사용하지 않고,
 *   카카오 OIDC로 직접 id_token을 받아 signInWithIdToken으로 로그인한다(kakaoAuth.ts).
 *   → 비즈앱·이메일 없이 로그인. 노출 여부는 config(ENABLED_PROVIDERS)로 토글.
 *
 * ⚠️ Supabase 대시보드 Authentication > URL Configuration의 Redirect URLs에
 *    웹 도메인과 네이티브 스킴(feellog://auth-callback)을 등록해야 구글/애플이 동작한다.
 */
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { AuthCancelledError } from './authErrors';
import { signInWithKakao } from './kakaoAuth';
import { getSupabase } from './supabase';

export { AuthCancelledError } from './authErrors';

export type OAuthProvider = 'kakao' | 'google' | 'apple';

export const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  kakao: '카카오',
  google: '구글',
  apple: 'Apple',
};

function redirectTo(): string | undefined {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : undefined;
  }
  // 네이티브: 앱 스킴 딥링크(app.json scheme과 일치해야 함)
  return Linking.createURL('auth-callback');
}

/**
 * 소셜 로그인 시작. 성공 시 onAuthStateChange가 세션을 전파한다.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  // 카카오는 OIDC 전용 경로(별도 모듈, 완전 격리 → 제거 쉬움)
  if (provider === 'kakao') {
    await signInWithKakao();
    return;
  }

  const sb = getSupabase();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다 (.env 확인).');

  const to = redirectTo();

  const { data, error } = await sb.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: to,
      // 네이티브는 우리가 직접 브라우저를 연다(자동 리다이렉트 금지)
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });
  if (error) throw error;

  // 웹은 이 시점에 이미 provider로 리다이렉트 중 → 이후 코드 실행 안 됨.
  if (Platform.OS === 'web') return;

  if (!data?.url) throw new Error('로그인 URL을 받지 못했습니다.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, to);
  if (result.type !== 'success' || !result.url) {
    throw new AuthCancelledError();
  }

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('인증 코드를 받지 못했습니다.');

  const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

/**
 * 이메일(아이디)+비밀번호 로그인 — v6 디자인의 '입장하기'.
 * 디자인의 '아이디'는 이메일이다(가입 시 이메일 사용 고지).
 */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다 (.env 확인).');
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/**
 * 이메일 회원가입 — 닉네임은 metadata로 전달(트리거가 profiles에 반영).
 * 이메일 확인 설정에 따라 세션이 즉시 생기지 않을 수 있다(그 경우 안내 필요).
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  nickname?: string,
): Promise<{ needsEmailConfirm: boolean }> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다 (.env 확인).');
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectTo(),
      data: nickname ? { nickname } : undefined,
    },
  });
  if (error) throw error;
  return { needsEmailConfirm: data.session == null };
}

/** 비밀번호 재설정 메일 발송('비밀번호 찾기') */
export async function requestPasswordReset(email: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다 (.env 확인).');
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo() });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  // 서버 로그아웃이 실패해도(오프라인 등) 로컬 세션은 반드시 제거한다 —
  // 그렇지 않으면 다음 부팅에서 조용히 다시 로그인돼 공용 기기에서 위험.
  const { error } = await sb.auth.signOut();
  if (error) {
    await sb.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}
