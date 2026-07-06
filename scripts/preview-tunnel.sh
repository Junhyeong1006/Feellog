#!/bin/bash
# 임시 공개 미리보기 — 빌드 → 로컬 서빙 → Cloudflare 임시 터널(계정 불필요).
# 사용:  bash scripts/preview-tunnel.sh          # 빌드부터 새로
#        bash scripts/preview-tunnel.sh --fast   # 기존 dist 재사용(빌드 생략)
# 종료:  Ctrl+C 한 번이면 서버·터널 모두 내려가고 URL도 사라진다.
# 주의:  이 스크립트가 도는 동안 이 컴퓨터가 임시 URL로 인터넷에 공개된다(데모용).
set -e
cd "$(dirname "$0")/.."

PORT=4173

if [ "$1" != "--fast" ]; then
  echo "▸ 정적 빌드 중 (npm run export:web)..."
  npm run export:web
fi

# 동적 라우트(/activity/x 등)가 새로고침에도 동작하게 rewrite 설정
cat > dist/serve.json <<'EOF'
{
  "rewrites": [
    { "source": "/community/compose", "destination": "/community/compose.html" },
    { "source": "/activity/*", "destination": "/activity/[id].html" },
    { "source": "/community/*", "destination": "/community/[id].html" }
  ]
}
EOF

cleanup() {
  echo ""
  echo "▸ 종료 중 (서버·터널 정리)..."
  kill $SERVE_PID $TUNNEL_PID 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "▸ 로컬 서버 시작 (localhost:$PORT)..."
npx -y serve dist -l $PORT >/dev/null 2>&1 &
SERVE_PID=$!

echo "▸ Cloudflare 임시 터널 여는 중 (주소는 매번 바뀜)..."
LOG=$(mktemp)
npx -y cloudflared tunnel --url "http://localhost:$PORT" >"$LOG" 2>&1 &
TUNNEL_PID=$!

URL=""
for i in $(seq 1 30); do
  sleep 1
  URL=$(grep -Eo "https://[a-z0-9-]+\.trycloudflare\.com" "$LOG" | head -1 || true)
  [ -n "$URL" ] && break
done

if [ -z "$URL" ]; then
  echo "✗ 터널 주소를 못 받았어요. 로그: $LOG"
  cleanup
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  공개 미리보기:  $URL"
echo "  (폰에서 열어도 됩니다 · Ctrl+C 로 종료)"
echo "══════════════════════════════════════════════"
echo ""

wait $TUNNEL_PID
