/**
 * 소셜 로그인 (카카오 / 구글 / 애플). 이메일·비밀번호 없음.
 *
 * 웹: signInWithOAuth가 브라우저를 provider로 리다이렉트 → 콜백 URL에서
 *     detectSessionInUrl + PKCE로 세션 자동 교환.
 * 네이티브: 앱 내 브라우저(WebBrowser)로 열고, 돌아온 콜백 URL의 code를
 *     exchangeCodeForSession으로 교환한다.
 *
 * ⚠️ Supabase 대시보드 Authentication > URL Configuration의 Redirect URLs에
 *    웹 도메인과 네이티브 스킴(feellog://auth-callback)을 등록해야 동작한다.
 */
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { getSupabase } from './supabase';

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
 * provider별 요청 스코프.
 * 카카오: 이메일(account_email)은 요청하지 않는다(최소수집 + 이메일 미저장 설계).
 *   → 닉네임/프로필사진만 요청. 카카오 앱 [동의항목]에도 이 둘만 켜두면 KOE205가 안 난다.
 * 구글/애플: 기본 스코프 사용(표준이라 별도 설정 불필요).
 */
const PROVIDER_SCOPES: Partial<Record<OAuthProvider, string>> = {
  kakao: 'profile_nickname profile_image',
};

/**
 * 소셜 로그인 시작. 성공 시 onAuthStateChange가 세션을 전파한다.
 * 반환값: 로그인 창까지 정상 진행되면 true(웹은 리다이렉트되므로 반환 전 페이지 이탈).
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다 (.env 확인).');

  const to = redirectTo();

  const { data, error } = await sb.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: to,
      scopes: PROVIDER_SCOPES[provider],
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
    // 사용자가 취소했거나 실패 — 조용히 종료(호출부에서 처리)
    throw new AuthCancelledError();
  }

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('인증 코드를 받지 못했습니다.');

  const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

/** 사용자가 로그인 창을 닫아 취소한 경우 */
export class AuthCancelledError extends Error {
  constructor() {
    super('로그인이 취소되었습니다.');
    this.name = 'AuthCancelledError';
  }
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  await sb?.auth.signOut();
}
