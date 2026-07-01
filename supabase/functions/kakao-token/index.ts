// Supabase Edge Function: 카카오 인가코드(code) → id_token 교환.
// 카카오 Client Secret을 클라이언트에 노출하지 않기 위해 서버(여기)에서만 사용한다.
//
// 배포:
//   supabase functions deploy kakao-token
// 시크릿 등록(둘 다 카카오 개발자 콘솔 값):
//   supabase secrets set KAKAO_REST_API_KEY=<REST 키> KAKAO_CLIENT_SECRET=<Client Secret>
//   (카카오에서 Client Secret "사용 안 함"이면 KAKAO_CLIENT_SECRET은 생략 가능)
//
// 클라이언트(src/api/kakaoAuth.ts)는 { code, redirectUri }를 POST하고 { id_token }을 받는다.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const restKey = Deno.env.get('KAKAO_REST_API_KEY');
  if (!restKey) return json({ error: 'server not configured (KAKAO_REST_API_KEY)' }, 500);

  let code: string | undefined;
  let redirectUri: string | undefined;
  try {
    const parsed = await req.json();
    code = parsed.code;
    redirectUri = parsed.redirectUri;
  } catch {
    return json({ error: 'invalid json body' }, 400);
  }
  if (!code || !redirectUri) return json({ error: 'missing code or redirectUri' }, 400);

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: restKey,
    redirect_uri: redirectUri,
    code,
  });
  const secret = Deno.env.get('KAKAO_CLIENT_SECRET');
  if (secret) form.set('client_secret', secret);

  let kakaoRes: Response;
  try {
    kakaoRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: form,
    });
  } catch {
    // 네트워크 오류도 CORS 헤더 포함해 반환(브라우저가 CORS 실패로 오인하지 않게)
    return json({ error: 'kakao token endpoint unreachable' }, 502);
  }
  const data = await kakaoRes.json().catch(() => ({}));

  if (!kakaoRes.ok || !data.id_token) {
    return json({ error: data.error_description ?? data.error ?? 'token exchange failed' }, 400);
  }
  return json({ id_token: data.id_token }, 200);
});
