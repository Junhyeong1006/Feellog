/**
 * 소셜 로그인 노출 설정 (SSOT).
 *
 * 카카오는 Supabase(GoTrue)가 account_email 스코프를 강제 요청하는데, 카카오는 이 항목을
 * 비즈앱 전환 후에만 켤 수 있어(KOE205) 지금은 비활성한다. 우회(OIDC) 확정 또는 비즈앱 전환
 * 후 아래 배열에 'kakao'를 다시 넣으면 로그인 화면에 버튼이 돌아온다.
 */
import type { OAuthProvider } from '@/api/auth';

/** 로그인 화면에 노출할 provider(순서 = 표시 순서) */
export const ENABLED_PROVIDERS: OAuthProvider[] = ['google', 'apple'];
