# Feellog (필로그)

이미지 기반 취향 분석부터 체험 추천, 기록·소통까지 커뮤니티로 이어지는 **시니어 AI 취미 플랫폼**. 팀 SYNC.

웹(PWA)을 먼저 배포하고, **동일 코드로** iOS/Android 앱을 확장한다(Expo + react-native-web). 추천 엔진은 5축 성향 벡터 매칭으로 자체 개발한다.

> 상세 설계: [docs/feellog-개발계획서.md](docs/feellog-개발계획서.md) · 비용 전략: [docs/feellog-비용최소화-검토.md](docs/feellog-비용최소화-검토.md)

## 기술 스택

| 영역 | 선택 |
|---|---|
| 크로스플랫폼 | Expo (SDK 56) + Expo Router + react-native-web — 단일 코드베이스 |
| 백엔드 | Supabase (Postgres · Auth · Storage · Realtime · Edge Functions) |
| 웹 호스팅 | Cloudflare Pages (무료·대역폭 무제한·상업용 허용) |
| 앱 배포 | EAS (Phase 3) |
| 추천 엔진 | 자체 개발 (순수 TS, `src/core`) |

## 폴더 구조

```
src/
  app/        # 화면(Expo Router 파일 기반 라우팅). +html.tsx = 웹 PWA 셸
  tokens/     # 디자인 토큰(색·타이포·간격·라운드) — 웹/앱 공통 SSOT
  api/        # Supabase 클라이언트 등 외부 연동
  core/       # 추천 엔진 코어(순수 TS, RN/DOM 비의존 · Vitest 테스트)
public/       # 정적 자산(manifest.json, PWA 아이콘) — 빌드 시 웹 루트로 복사
docs/         # 기획·개발계획·비용검토 문서 (planning/ = 원본 기획 자료)
```

## 시작하기

```bash
npm install                      # 의존성 설치
cp .env.example .env             # Supabase URL/anon key 입력
npm run web                      # 개발 서버(웹)
npm run ios | npm run android    # 네이티브(추후 Phase 3)
```

### 환경변수 (.env)

```
EXPO_PUBLIC_SUPABASE_URL=        # Supabase 대시보드 > Project Settings > API
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## 자주 쓰는 명령

```bash
npm test            # 추천 엔진 코어 단위테스트 (Vitest)
npm run typecheck   # 타입 체크 (tsc --noEmit)
npm run export:web  # 정적 웹 PWA 빌드 → dist/
```

## 배포 (웹)

**권장**: Cloudflare 대시보드에서 이 리포를 **Connect to Git** 으로 연결(시크릿 불필요).

- Build command: `npm ci && npx expo export -p web`
- Build output directory: `dist`
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

GitHub Actions로 배포하려면 [.github/workflows/web-deploy.yml](.github/workflows/web-deploy.yml) 참고(시크릿 등록 필요).
