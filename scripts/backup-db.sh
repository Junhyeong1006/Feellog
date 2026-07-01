#!/usr/bin/env bash
#
# Feellog 로컬 수동 DB 백업 (pg_dump)
#
# 무료 Supabase는 자동 백업이 없다. 위험한 스키마 변경/대량 삭제 전에 이 스크립트를 돌려
# 로컬에 스냅샷을 남긴다. (정식 베타 단계에서 Supabase Pro로 올리면 일일 백업이 기본 제공되므로
# 그때 이 스크립트는 걷어내면 된다.)
#
# 선행: PostgreSQL 클라이언트 필요 →  brew install libpq  (또는 postgresql@16)
#       그리고 PATH에 pg_dump 추가.
#
# 사용:
#   export SUPABASE_DB_URL="postgresql://postgres:[비번]@db.<ref>.supabase.co:5432/postgres"
#   ./scripts/backup-db.sh
#
#   ↑ 연결 문자열: Supabase 대시보드 > Project Settings > Database > Connection string (URI)
#     비밀번호는 프로젝트 생성 때 정한 DB 비밀번호. 절대 커밋하지 말 것.
#
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL 환경변수를 설정하세요 (대시보드 > Database > Connection string)}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "❌ pg_dump 없음.  brew install libpq  후 PATH 설정이 필요합니다." >&2
  exit 1
fi

mkdir -p backups
ts="$(date +%Y%m%d_%H%M%S)"
out="backups/feellog_${ts}.sql.gz"

echo "▶ 백업 중… → ${out}"
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip > "$out"
echo "✅ 완료: ${out}  ($(du -h "$out" | cut -f1))"

# 14일 넘은 백업 정리
find backups -name 'feellog_*.sql.gz' -mtime +14 -delete 2>/dev/null || true
