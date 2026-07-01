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

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  await sb?.auth.signOut();
}
