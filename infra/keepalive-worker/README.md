# feellog-keepalive (Cloudflare Worker)

무료 Supabase의 7일 자동 일시정지를 막기 위해 8시간마다 `public.ping()`을 호출한다.

## 배포 (최초 1회)

```bash
cd infra/keepalive-worker
npx wrangler login                       # Cloudflare 계정 로그인(브라우저)
npx wrangler secret put SUPABASE_URL     # 프롬프트에 Supabase URL 입력
npx wrangler secret put SUPABASE_ANON_KEY# 프롬프트에 publishable(anon) 키 입력
npx wrangler deploy
```

## 확인

```bash
npx wrangler tail          # 실시간 로그(다음 크론 실행 때 "ping → HTTP 200" 확인)
```

수동 테스트로 스케줄을 즉시 실행하려면 Cloudflare 대시보드 > Workers > feellog-keepalive > 우측 상단 "..." > 트리거 테스트, 또는 `npx wrangler dev --test-scheduled` 후 `/__scheduled` 호출.

> Pro 요금제로 전환하면 자동 일시정지가 사라지므로 이 Worker는 삭제해도 된다.
