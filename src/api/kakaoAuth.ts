/**
 * 카카오 로그인 (OIDC → signInWithIdToken). 비즈앱·이메일 없이 로그인.
 *
 * 흐름: authorize(openid+profile_nickname, nonce) → code 수신 → Edge Function(kakao-token)에서
 *       code→id_token 교환(클라 시크릿 서버 보관) → supabase.auth.signInWithIdToken.
 * 웹·네이티브 모두 WebBrowser.openAuthSessionAsync로 code를 받는다(웹은 팝업).
 *
 * ⚠️ 동작 전제(사용자 세팅): 카카오 OpenID Connect 활성화, Redirect URI 등록,
 *    Supabase Kakao provider Client ID = 카카오 REST 키(정확 일치), "Allow users without email" ON,
 *    Edge Function 배포 + 시크릿(KAKAO_REST_API_KEY / KAKAO_CLIENT_SECRET).
 *    이 모듈만 지우면 카카오 로그인은 흔적 없이 제거된다(구글/애플 무관).
 */
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { AuthCancelledError } from './authErrors';
import { getSupabase } from './supabase';

const KAKAO_REST_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';

/** 카카오 로그인에 필요한 값이 모두 설정됐는지 */
export function isKakaoConfigured(): boolean {
  return Boolean(KAKAO_REST_KEY && SUPABASE_URL && ANON_KEY);
}

function redirectUri(): string {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return Linking.createURL('kakao-callback');
}

export async function signInWithKakao(): Promise<void> {
  const sb = getSupabase();
  if (!sb || !isKakaoConfigured()) {
    throw new Error('카카오 로그인이 아직 설정되지 않았어요.');
  }

  const nonce = Crypto.randomUUID();
  const state = Crypto.randomUUID();
  const redirect = redirectUri();

  const authUrl =
    `${AUTHORIZE_URL}?response_type=code` +
    `&client_id=${encodeURIComponent(KAKAO_REST_KEY!)}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&scope=${encodeURIComponent('openid profile_nickname')}` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&state=${encodeURIComponent(state)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirect);
  if (result.type !== 'success' || !result.url) {
    throw new AuthCancelledError();
  }

  const url = new URL(result.url);
  if (url.searchParams.get('state') !== state) {
    throw new Error('로그인 검증(state)에 실패했어요. 다시 시도해주세요.');
  }
  const code = url.searchParams.get('code');
  if (!code) {
    const err = url.searchParams.get('error_description') ?? url.searchParams.get('error');
    throw new Error(err ? `카카오 로그인 오류: ${err}` : '인증 코드를 받지 못했어요.');
  }

  // code → id_token (Edge Function: 클라이언트 시크릿을 서버에 보관)
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/kakao-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY!,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ code, redirectUri: redirect }),
    });
  } catch {
    throw new Error('네트워크 오류로 카카오 로그인에 실패했어요. 연결을 확인하고 다시 시도해주세요.');
  }
  const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  if (!res.ok || !data.id_token) {
    throw new Error(data.error ? `토큰 교환 실패: ${data.error}` : '카카오 토큰 교환에 실패했어요.');
  }

  // nonce는 raw 그대로 전달(GoTrue가 내부에서 해시해 id_token의 nonce와 대조)
  const { error } = await sb.auth.signInWithIdToken({
    provider: 'kakao',
    token: data.id_token,
    nonce,
  });
  if (error) throw error;
}
