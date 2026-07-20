#!/bin/bash
# Figma 디자인을 코드/API로 불러오기 (사진 촬영·헤드리스 불필요, 순수 REST API).
# Figma 서버가 프레임을 PNG로 렌더해주고, 노드 JSON에는 색·폰트·간격 토큰이 들어있다.
#
# 사용 전 1회: Figma PAT 발급 → 프로젝트 루트 .env 에  FIGMA_TOKEN=figd_...  한 줄 추가
#   (발급: figma.com → 프로필 → Settings → Security → Personal access tokens →
#    Generate new token → scope "File content: Read" → 생성 → figd_... 복사. .env는 gitignore됨)
#
# 사용:
#   bash scripts/figma-pull.sh                       # 기본 파일/노드(210-4516) 불러오기
#   bash scripts/figma-pull.sh 210-4516              # 특정 노드
#   bash scripts/figma-pull.sh 210-4516,33-12        # 여러 노드(콤마) — 호출 1회로 묶임
#   bash scripts/figma-pull.sh 210-4516 <다른파일키> 3  # 노드·파일키·배율(2x 기본)
#
# ⚠ 무료(Starter) 계정은 이 계열 API를 "파일당 월 6회"만 허용한다.
#   한 번 불러오면 figma-export/ 에 저장되니, 개편 작업은 저장된 파일로 진행하고
#   같은 노드를 반복해서 다시 부르지 말 것(호출 낭비).
set -e
cd "$(dirname "$0")/.."

FILE_KEY="${2:-ernIVx8Gx05noC684mUuy9}"   # 기본: 필로그 파일
NODE_ARG="${1:-210-4516}"                  # URL 표기(하이픈)
SCALE="${3:-2}"                            # PNG 배율(2x 권장)
OUT="figma-export"

# 토큰 로드: 환경변수 우선, 없으면 .env에서 읽기
if [ -z "$FIGMA_TOKEN" ] && [ -f .env ]; then
  FIGMA_TOKEN=$(grep -E '^FIGMA_TOKEN=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')
fi
if [ -z "$FIGMA_TOKEN" ]; then
  echo "✗ FIGMA_TOKEN이 없어요."
  echo "  figma.com → Settings → Security → Personal access tokens 에서 발급한 뒤,"
  echo "  프로젝트 루트 .env 에  FIGMA_TOKEN=figd_...  한 줄을 추가하세요."
  exit 1
fi

# node-id 포맷 변환: URL은 하이픈(210-4516), API는 콜론(210:4516)
IDS_COLON=$(echo "$NODE_ARG" | sed 's/-/:/g')
# 파일명 안전화(콜론·콤마 → 하이픈·언더바)
SAFE=$(echo "$NODE_ARG" | tr ':,' '-_')

mkdir -p "$OUT"
echo "▸ 파일: $FILE_KEY / 노드: $NODE_ARG (API ids=$IDS_COLON) / 배율: ${SCALE}x"

# (1) 노드 서브트리 JSON — 색·폰트·간격 등 디자인 토큰
echo "▸ [1/2] 노드 JSON 받는 중..."
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${IDS_COLON}" \
  -o "$OUT/node-${SAFE}.json"

if grep -q '"err"' "$OUT/node-${SAFE}.json" && ! grep -q '"err":null' "$OUT/node-${SAFE}.json"; then
  echo "  ⚠ 응답에 오류가 있어요(토큰/권한/노드ID 확인):"
  jq -r '.err // "알 수 없는 오류"' "$OUT/node-${SAFE}.json" 2>/dev/null || head -c 300 "$OUT/node-${SAFE}.json"
fi
echo "  → 저장: $OUT/node-${SAFE}.json"

# (2) 노드 PNG — Figma 서버가 렌더 → 임시 URL → 다운로드
echo "▸ [2/2] PNG 렌더 URL 받는 중..."
RESP=$(curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/images/${FILE_KEY}?ids=${IDS_COLON}&format=png&scale=${SCALE}")

# images 맵의 각 URL을 다운로드(여러 노드 지원)
echo "$RESP" | jq -r '.images | to_entries[] | "\(.key)\t\(.value)"' 2>/dev/null | while IFS=$'\t' read -r nid url; do
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    echo "  ⚠ 노드 $nid 렌더 실패(너무 큰 프레임이면 배율을 낮춰보세요)."
    continue
  fi
  fn="$OUT/node-$(echo "$nid" | tr ':' '-').png"
  curl -s "$url" -o "$fn"
  echo "  → 저장: $fn"
done

echo ""
echo "✅ 완료. figma-export/ 에 PNG(육안용)와 JSON(토큰용)이 저장됐어요."
echo "   이제 이 파일들로 개편 작업을 진행하면 API 호출을 더 쓰지 않습니다."
