# 필로그(feellog) 통합 개발 계획서

> 팀 SYNC · 제품 필로그(feellog) — 시니어 AI 취미 플랫폼
> 문서 버전 1.0 · 기준일 2026-06-30 · 편집장 검토본

---

## 핵심 요약

필로그는 **이미지 기반 취향 분석 → 맞춤 체험 추천 → 기록·소통 커뮤니티**로 이어지는 5060 액티브 시니어용 AI 여가 플랫폼이다. 은퇴 전후의 시니어가 "무엇을, 어디서, 어떻게 시작해야 할지 모른다"는 핵심 페인을, 12문항 이미지 비교 진단으로 5축(활동리듬·관계방식·경험선호·참여방식·기대보상) 성향을 산출하고, 6개 유형과 2개 보조성향(트렌드 발견/회복 충전)으로 정리한 뒤, 활동(클래스)의 5축 태그와 벡터로 매칭하여 해소한다. 추천은 카드 스와이프 반응(좋아요/관심없어요)을 온라인 보정 데이터로 흡수해 점점 정교해지며, 좋아한 활동은 카카오맵 위 업체와 예약으로 연결된다. 초기 진입은 "꽃 대신 새로운 하루를 선물하세요"라는 2040 자녀 세대의 효도 선물 시장을 게이트웨이로 삼는다.

기술 전략은 사용자가 확정한 두 방향을 그대로 구현한다. 첫째, **웹(PWA)을 먼저 출시하고 동일 코드로 앱을 확장**한다 — Expo(React Native + react-native-web) 단일 코드베이스로 디자인 토큰·컴포넌트·도메인 로직을 한 벌만 작성해 "앱 디자인을 웹에도 동일 배포"한다. 둘째, **추천 엔진은 자체 개발**한다 — 5축 벡터 매칭 + 최근접 중심 분류 + 피드백 EMA 보정은 우리 도메인 고유 자산이자 차별점(선택 피로 감소)이므로 직접 만들고, 인증·지도·결제·CDN·분석 등 비차별 인프라는 검증된 무료~종량 외부 서비스를 산다(Build vs Buy). 백엔드는 관계형+벡터 연산에 강하고 정액 요금이 예측 가능한 Supabase로 통일한다. 교내 지원금 300만원(인프라 35%/마케팅 40%/운영 25%)으로 무료 티어 중심의 웹 MVP를 만들고, 향후 고도화(AI 정밀화·자체 결제·B2B) 자금은 지원사업·투자로 단계 유치한다.

---

## 핵심 의사결정 요약

| 항목 | 결정 | 근거 | 검토된 대안 | 비용 감각 |
|---|---|---|---|---|
| **크로스플랫폼** | Expo (RN + react-native-web) 단일 코드베이스 → 웹 PWA 먼저, 이후 동일 코드 iOS/Android | 진짜 웹(DOM/SEO/PWA/접근성) + 팀 JS/TS 역량 + 한국 생태계(카카오/PG) SDK 풍부. 무거운 그래픽 없어 네이티브 성능 우위 무의미 | Flutter(웹 canvas 렌더 → SEO·시니어 저사양·접근성 약점), Next.js+별도 RN(코드 2벌, 1인팀 부적합) | 빌드/배포 무료 티어. 스토어 등록 Apple $99/년·Google $25 1회 |
| **백엔드** | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions), 미래 pgvector | 추천 데이터가 본질적으로 관계형+벡터. SQL/RPC로 매칭 직접 계산, 정액 요금 예측 가능, 오픈소스(락인↓) | Firebase(NoSQL→조인 불가, 종량제 예측난, 벡터 약점) | 무료 티어 시작 → Pro $25/월(≈3.4만원) |
| **인증** | 카카오(필수) + Apple + Google + 이메일. 카카오는 토큰 교환 커스텀 | 시니어는 카카오가 사실상 기본. Apple은 iOS 심사 의무. 이메일은 매직링크로 비번 부담↓ | (카카오 미사용 시 시니어 이탈 위험으로 배제) | 무료(Supabase Auth + 카카오 무료 쿼터) |
| **지도** | 카카오맵 SDK (WebView 래핑 공용 `<FeellogMap>`) | 국내 POI/길찾기 정확도·시니어 친숙도. 단일 코드 친화 | 네이버지도·구글맵(국내 시니어 친숙도/정확도 열위) | 무료 쿼터 내, 초과 시 종량 |
| **결제** | 포트원 v2(다중 PG 통합) 1순위 / 토스페이먼츠 / 카카오 선물하기·네이버 스마트스토어 채널 | PCI는 PG 위임(카드정보 미보관), 시니어 결제수단 다양성, 효도 선물 기프티콘 채널 | 토스 단독(단일 PG, MVP 가능), 자체 PG(규제·리스크 과다) | 수수료 ~2.5~3.3%/건(매출연동), 초기 고정비 ≈0 |
| **추천** | 자체 개발(5축 벡터 매칭 + 최근접 중심 분류 + 피드백 EMA 보정), 외부는 유틸만 차용 | 콜드스타트라 ML 학습 불가→규칙·거리 기반이 정답. 설명가능(B2B 리포트), 도메인 핵심 차별점 | 외부 추천 SaaS(데이터 굶주림·블랙박스·도메인 핏 약함) | 현금비용 ≈0(자체). 고도화 시 pgvector |
| **호스팅(웹)** | **Cloudflare Pages 정본 확정** (2026-07 결정) | 정적 PWA 무료 호스팅·글로벌 CDN·**대역폭 무제한**·**무료 티어 상업적 사용 허용**. Expo 웹 export는 정적 SPA(SSR 불필요)라 Vercel의 Next.js 강점이 무의미 → 비차별 영역은 최저비용 채택 | Vercel은 **무료(Hobby)가 비영리 전용 → 영리 서비스는 Pro $20/월 필수**, 대역폭 100GB/월 제한이라 탈락 | **무료(현금 0원)**. 도메인값(연 1~2만원)만 소요 |
| **배포(앱)** | EAS(Expo Application Services) + GitHub Actions, OTA 업데이트 | 맥/안드 빌드 인프라 자체 보유 불필요(학생팀), JS 변경은 OTA로 심사 없이 즉시 반영 | 자체 빌드 인프라(비현실적) | 무료 티어(월 30빌드) → 초과 시 종량 |

---

## 목차

1. [기술 스택 · 크로스플랫폼 아키텍처 · 빌드/구매(Build vs Buy)](#1-기술-스택--크로스플랫폼-아키텍처--빌드구매build-vs-buy)
2. [진단·추천 엔진 상세 설계 (수식 · 의사코드 · 진화 로드맵)](#2-진단추천-엔진-상세-설계-수식--의사코드--진화-로드맵)
3. [디자인 시스템 · 시니어 UX/접근성 (웹·앱 공통 토큰)](#3-디자인-시스템--시니어-ux접근성-웹앱-공통-토큰)
4. [데이터 모델 · 화면/기능 명세 · API](#4-데이터-모델--화면기능-명세--api)
5. [백엔드 · 인프라 · 결제 · 지도 · 커뮤니티/실시간 · 보안/개인정보](#5-백엔드--인프라--결제--지도--커뮤니티실시간--보안개인정보)
6. [활동/공방 데이터 구축 · 콘텐츠 운영 · 파트너 온보딩](#6-활동공방-데이터-구축--콘텐츠-운영--파트너-온보딩)
7. [개발 로드맵 · 마일스톤 · 팀 R&R · 예산 · KPI · 리스크](#7-개발-로드맵--마일스톤--팀-rr--예산--kpi--리스크)

> 부록: [정합성 검토 메모](#정합성-검토-메모) · [지금 당장 시작할 Top 10 액션 아이템](#지금-당장-시작할-top-10-액션-아이템) · [팀 SYNC가 결정해야 할 열린 질문](#팀-sync가-결정해야-할-열린-질문)

---

## 1. 기술 스택 · 크로스플랫폼 아키텍처 · 빌드/구매(Build vs Buy)

> 이 섹션은 필로그(feellog)의 전체 기술 골격을 정의한다. 사용자가 확정한 두 방향 — **"웹 먼저 → 앱 확장, 웹·앱 동일 디자인"** 과 **"추천은 직접 만들되 가져올 수 있으면 가져온다"** — 을 기술적으로 만족시키는 의사결정 근거, 아키텍처, 빌드/구매 결정을 구현 가능한 수준으로 기술한다. 예산은 교내 창업동아리 지원금 300만원(인프라 35% / 마케팅 40% / 운영·파트너십 25%)이 초기 제약이며, 모든 선택은 "유료 전환 전까지 무료 티어로 버틴다 + 한국 시장(카카오·국내 PG) 일급 지원"을 우선한다.

---

### 1.1 한눈에 보는 기술 스택 결정 요약

| 레이어 | 채택 | 버전대(2026 기준) | 한 줄 근거 |
|---|---|---|---|
| 크로스플랫폼 런타임 | **Expo (React Native + react-native-web)** | Expo SDK 53+, RN 0.79+, React 19 | 단일 코드베이스로 웹(PWA) 선출시 후 동일 코드로 iOS/Android. 팀 JS 역량 활용. |
| 언어 | **TypeScript** | 5.5+ | 5축 점수/유형 도출 등 도메인 로직의 타입 안전성. |
| 모노레포 | **pnpm workspaces + Turborepo** | pnpm 9+, turbo 2+ | `apps/*` + `packages/*` 공유 디자인 토큰/컴포넌트. |
| 라우팅 | **Expo Router** | v4+ (file-based) | 웹은 URL 라우팅(SEO/딥링크), 앱은 네이티브 스택 자동 매핑. |
| 백엔드 (BaaS) | **Supabase** | Postgres 15+, supabase-js 2.x | 관계형 추천 데이터 + Auth + Storage + Realtime + Edge Functions 일체형. |
| DB | **PostgreSQL** (+ 미래 `pgvector`) | PG 15+ | 5축 벡터 매칭/태그/피드백을 관계형으로 관리. |
| 추천 엔진 | **자체 개발** (Edge Function/SQL) | Deno 런타임 | 경량 5축 벡터 매칭 + 최근접 중심 분류 + 피드백 온라인 보정. |
| 인증 | 카카오 + Apple + Google + 이메일 | Supabase Auth + 카카오 커스텀 | 시니어 필수 카카오. |
| 지도 | **카카오맵** | Kakao Maps JS SDK / WebView | 국내 POI·길찾기 정확도. |
| 결제 | **포트원(PortOne) v2** + 카카오 선물하기/네이버 채널 | PortOne SDK 2.x | 토스페이먼츠 등 국내 PG 통합 + 기프티콘 채널. |
| 웹 호스팅 | **Cloudflare Pages (정본 확정)** | — | 무료·대역폭 무제한·상업적 사용 허용. 정적 PWA 배포. Vercel은 영리 시 Pro 유료라 미채택. |
| 앱 빌드/배포 | **EAS (Expo Application Services)** | eas-cli latest | 클라우드 빌드/OTA 업데이트. |
| CI/CD | **GitHub Actions + EAS Workflows** | — | 웹 export → Pages, 앱 → EAS Build/Submit. |
| 푸시 | **Expo Push (FCM/APNs 추상화)** | expo-notifications | 단일 API로 양 플랫폼 푸시. |
| 분석 | **PostHog (셀프/클라우드 무료티어)** | posthog-js / -react-native | 제품 분석 + 퍼널 + 피처플래그, 카드 반응 추적. |
| 에러 추적 | **Sentry** | @sentry/react-native | 무료 티어 충분. |

---

### 1.2 (a) Expo(RN + react-native-web) 채택 근거 — Flutter 대비 비교

#### 핵심 제약 → 요구사항 매핑

확정 방향인 **"웹 먼저 → 앱 확장 + 동일 디자인"**, **소규모 학생팀(자체 개발 1명 중심, JS 친화)**, **예산 300만원**을 기술 요구사항으로 환산하면 다음과 같다.

| 사용자/사업 제약 | 기술 요구사항 |
|---|---|
| 웹을 먼저 출시 | 진짜 웹(DOM/CSS, URL 라우팅, SEO 가능)이 1급 타깃이어야 함 |
| 앱과 웹 "똑같은 디자인" | 단일 코드/단일 디자인 토큰 → 양쪽에 동일 렌더 |
| 앱은 나중에 동일 코드로 | 동일 컴포넌트 트리가 네이티브로도 빌드 가능 |
| 학생팀, 1인 개발 중심 | 팀이 이미 아는 언어(JS/TS) + 풍부한 생태계 |
| 마케팅 SNS 진입(인스타/유튜브) | 웹 페이지가 OG/SEO/미리보기 가능해야 함 |
| 시니어 친화 PWA(홈화면 추가) | 웹이 PWA로 설치/오프라인 캐시 가능해야 함 |

#### Expo vs Flutter 비교표

| 평가 항목 | **Expo (RN + react-native-web)** | Flutter (+ Flutter Web) | 필로그 판정 |
|---|---|---|---|
| **개발 속도(팀 기준)** | 팀이 JS/TS 보유 → 즉시 생산성. 학습곡선 낮음 | Dart 신규 학습 필요(1인 개발자 부담) | **Expo 우위** |
| **웹 성숙도** | react-native-web은 페이스북/Expo/Major 앱(Twitter 등)이 실전 사용. 진짜 DOM 출력 | Flutter Web은 CanvasKit(canvas 렌더)·접근성/텍스트 선택/SEO 약점 | **Expo 우위** |
| **팀 JS 역량** | 매우 높음(웹 표준 HTML/CSS 지식 재활용) | 낮음(Dart/위젯 패러다임) | **Expo 우위** |
| **앱스토어 적합성** | RN은 정식 네이티브 빌드, EAS로 스토어 제출 표준화 | 네이티브 빌드 우수(이 항목은 Flutter도 강함) | 동등 |
| **PWA(홈화면 추가/오프라인)** | 표준 웹 → service worker/manifest 자연스러움 | 가능하나 번들 큼(CanvasKit ~수 MB), 시니어 저사양/저속망 불리 | **Expo 우위** |
| **런타임 성능(앱)** | JS 브리지/JSI. 일반 UI·폼·리스트엔 충분(우리 앱은 무거운 그래픽 없음) | 컴파일 네이티브로 약간 우위 | Flutter 소폭 우위(그러나 우리 앱엔 무의미) |
| **웹 초기 로딩/저사양** | DOM 기반, 코드스플리팅으로 경량 가능. 시니어 저사양 단말 유리 | CanvasKit 다운로드로 첫 로딩 무거움 | **Expo 우위** |
| **SEO/공유 미리보기** | SSG/메타태그 가능(Expo Router + 정적 export, OG 태그 주입) | canvas 렌더라 크롤러가 콘텐츠 못 읽음 → SEO 매우 불리 | **Expo 결정적 우위** |
| **생태계/SDK(카카오·결제)** | npm에 카카오 로그인/맵/PortOne RN SDK 풍부 | Dart 패키지 상대적으로 적음(한국 결제·카카오) | **Expo 우위** |
| **접근성(시니어 큰 글씨/스크린리더)** | 웹은 시맨틱 DOM + 브라우저 글꼴 확대 동작 자연스러움 | canvas 렌더라 OS 글꼴 확대/리더 연동 까다로움 | **Expo 우위** |

#### 결론: 왜 Expo인가

필로그의 **결정적 차별 요소는 "성능"이 아니라 "진짜 웹(SEO·PWA·접근성) + 한국 생태계(카카오·국내 PG) + JS 팀 생산성"** 이다. 우리 앱은 무거운 3D/게임 렌더가 없고(레이더 차트·카드 스와이프·폼 수준), Flutter의 네이티브 성능 우위는 체감되지 않는다. 반면 Flutter Web의 canvas 렌더는 **SEO 불가·시니어 저사양 단말 첫 로딩 부담·OS 접근성 연동 약점**이라는 우리 타깃에 치명적인 약점을 가진다. 따라서 **Expo + react-native-web**을 채택한다.

> **[가정]** 팀의 소프트웨어 담당(서준형)이 JS/TS 또는 React 경험 보유. 만약 Dart 경험이 더 많다면 재평가 여지가 있으나, "웹 SEO/PWA/접근성" 요건만으로도 Expo가 우위라는 결론은 유지된다.

대안 기록(문서화 목적): **Next.js(웹) + 별도 RN 앱** 조합은 웹 SEO가 가장 강하지만 "웹·앱 동일 코드/동일 디자인" 요구를 깨고 코드 2벌이 되어 1인 팀에 부적합. Expo Router의 정적 export로 SEO 요건을 충분히 충족하므로 단일 코드베이스 전략을 유지한다.

---

### 1.3 (b) 모노레포 구조 · 공유 디자인 토큰/컴포넌트 패키지

#### 전략: "단일 Expo 앱 + web export" 를 모노레포로 감싼다

핵심 코드는 `apps/feellog`(단일 Expo 앱) 하나다. 웹은 이 앱을 `npx expo export -p web` 로 정적 PWA로 export 하고, 앱은 동일 코드를 EAS로 빌드한다. **앱 디자인을 웹에 그대로 배포**하는 확정 방향과 정확히 일치한다. 디자인 토큰/공유 UI/도메인 로직(추천 계산)은 별도 `packages/*`로 분리해 재사용·테스트한다.

```
feellog/                              # 모노레포 루트 (pnpm + turborepo)
├─ package.json                       # workspaces 선언, turbo 스크립트
├─ pnpm-workspace.yaml                # packages: ["apps/*", "packages/*"]
├─ turbo.json                         # build/lint/test 파이프라인 캐시
├─ tsconfig.base.json                 # 공통 TS 설정, path alias (@feellog/*)
├─ .github/workflows/                 # CI/CD (1.5절)
│   ├─ web-deploy.yml
│   ├─ app-build.yml
│   └─ ci.yml
│
├─ apps/
│   └─ feellog/                       # ★ 단일 Expo 앱 (웹+iOS+Android 한 코드)
│      ├─ app/                        # Expo Router (file-based routing)
│      │   ├─ _layout.tsx             # 루트 레이아웃 (테마/폰트/Provider)
│      │   ├─ (auth)/                 # 로그인/온보딩 그룹
│      │   │   ├─ login.tsx
│      │   │   └─ onboarding.tsx
│      │   ├─ (tabs)/                 # 메인 탭 (홈/추천/커뮤니티/마이)
│      │   │   ├─ index.tsx           # 홈 (상태 분기: 미테스트→테스트 / 완료→카드추천)
│      │   │   ├─ explore.tsx         # 활동 카드 스와이프
│      │   │   └─ community.tsx
│      │   ├─ test/                   # 성향 테스트 12문항
│      │   │   ├─ [step].tsx          # 문항 단계 (동적 라우트)
│      │   │   └─ result.tsx          # "당신은 OO형이에요!" 결과(레이더)
│      │   └─ activity/[id].tsx       # 활동 상세 (지도/예약링크)
│      ├─ assets/                     # 라인 일러스트 아이콘, 폰트(손글씨풍)
│      ├─ app.config.ts               # Expo 설정 (앱 메타/플러그인/env 분기)
│      ├─ eas.json                    # EAS 빌드 프로파일 (dev/staging/prod)
│      ├─ metro.config.js             # 모노레포 인식(watchFolders)
│      ├─ public/                     # 웹 전용 정적 자원 (manifest.json, sw, favicon)
│      └─ package.json
│
└─ packages/
   ├─ tokens/                         # @feellog/tokens — 디자인 토큰 (단일 진실원천)
   │   ├─ src/colors.ts               # 콘플라워블루/코랄/민트/오프화이트/그레이
   │   ├─ src/typography.ts           # 시니어용 큰 글씨 스케일, 손글씨풍 폰트
   │   ├─ src/spacing.ts              # 큰 터치영역(min 48px) 기준 간격
   │   ├─ src/radii.ts                # 둥근 모서리
   │   └─ src/theme.ts                # 위를 묶은 theme 객체
   ├─ ui/                             # @feellog/ui — 공유 컴포넌트
   │   ├─ src/Button.tsx              # 주/보조/카카오 버튼 (큰 터치)
   │   ├─ src/ActivityCard.tsx        # 카드(이미지+키워드칩+좋아요/관심없어요)
   │   ├─ src/RadarChart.tsx          # 5축 레이더 (웹=SVG, 앱=react-native-svg)
   │   ├─ src/TypeBadge.tsx           # 유형/보조성향 배지
   │   └─ src/CompareQuestion.tsx     # 이미지 2장 비교 + 5단계 바
   ├─ core/                           # @feellog/core — 도메인 로직(플랫폼 무관, 순수 TS)
   │   ├─ src/axes.ts                 # 5축 정의/스케일 상수(-100~+100)
   │   ├─ src/scoring.ts              # 12문항→5축 점수 계산
   │   ├─ src/classify.ts             # 최근접 중심 6유형 분류 + 보조성향
   │   ├─ src/recommend.ts            # 5축 벡터 매칭(거리→점수) + 피드백 보정
   │   └─ src/types.ts               # Axis/Question/UserVector/Activity 타입
   ├─ api/                            # @feellog/api — Supabase 클라이언트/쿼리 래퍼
   │   ├─ src/client.ts               # supabase-js 초기화
   │   ├─ src/auth.ts                 # 카카오/Apple/Google/이메일 헬퍼
   │   └─ src/queries.ts              # 활동/추천/피드백 RPC 호출
   └─ config/                         # 공유 eslint/tsconfig/prettier 프리셋
```

#### 디자인 토큰 = 단일 진실 원천 (웹·앱 동일 디자인 보장)

`@feellog/tokens` 한 곳에서 색/타이포/간격을 정의하고, `@feellog/ui`와 앱이 이를 import한다. 이렇게 하면 "앱 디자인을 웹에도 동일하게"가 코드 레벨에서 강제된다.

```ts
// packages/tokens/src/colors.ts
export const colors = {
  cornflower: '#6B8BE8',   // 주 버튼/로고
  coral:      '#FF8A73',   // 포인트 리본
  mint:       '#9FE3C7',   // 보조 블록
  offwhite:   '#FAF8F3',   // 배경
  graySub:    '#E3E3E3',   // 보조 버튼
  textMain:   '#2D2D2D',
  error:      '#E5484D',   // 인라인 에러(빨강)
} as const;

// packages/tokens/src/typography.ts — 시니어 친화 큰 글씨 스케일
export const typography = {
  fontFamily: { brand: 'Feellog-Hand', body: 'Pretendard' }, // 손글씨풍 워드마크 + 본문
  size: { h1: 30, h2: 24, body: 18, caption: 16 },           // 본문 18px 하한(시니어)
  lineHeight: { body: 28 },
} as const;

// packages/tokens/src/spacing.ts
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const touchTarget = { min: 48 }; // 시니어 큰 터치영역 (≥48dp)
```

```ts
// packages/ui/src/Button.tsx — 웹/앱 공통 (react-native-web가 DOM으로 변환)
import { Pressable, Text } from 'react-native';
import { colors, typography, touchTarget } from '@feellog/tokens';

export function Button({ variant = 'primary', label, onPress }) {
  const bg = variant === 'primary' ? colors.cornflower
           : variant === 'kakao'   ? '#FEE500' : colors.graySub;
  return (
    <Pressable onPress={onPress}
      style={{ minHeight: touchTarget.min, borderRadius: 16,
               backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: typography.size.body, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
```

#### 도메인 로직 분리(`@feellog/core`)의 이점

5축 점수 계산·6유형 분류·추천 매칭은 **플랫폼 무관 순수 TS**로 `core`에 둔다. 이렇게 하면 ① 클라이언트(즉시 결과 표시)와 ② Supabase Edge Function(서버 권위 계산) **양쪽에서 같은 코드를 재사용**하고, 단위 테스트(Vitest)로 검증 가능하다. 추천 정확도 로직이 한 곳에만 존재하므로 일관성이 보장된다.

---

### 1.4 (c) 백엔드 Supabase 채택 근거 — Firebase 대비 비교

#### 비교표

| 평가 항목 | **Supabase** | Firebase | 필로그 판정 |
|---|---|---|---|
| **데이터 모델** | PostgreSQL(관계형) — 활동·태그·5축점수·피드백·예약을 정규화·조인 | Firestore(NoSQL 문서) — 조인 없음, 다대다 태그 비정규화 필요 | **Supabase 우위** (추천 데이터가 본질적으로 관계형) |
| **추천/벡터 매칭** | SQL로 5축 거리 계산 가능 + 미래 **pgvector**로 임베딩 확장 일관 | 클라이언트/함수에서 수동 계산, 벡터 검색은 외부 의존 | **Supabase 결정적 우위** |
| **쿼리 유연성** | 임의 SQL/뷰/RPC(저장프로시저), 분석 쿼리 자유 | 쿼리 제약 많음(복합 인덱스 강제, 집계 약함) | **Supabase 우위** |
| **인증** | 이메일/OAuth + **커스텀 OIDC로 카카오 연동** 가능 | OAuth 풍부하나 카카오는 비공식 커스텀 토큰 필요(동일하게 커스텀) | 동등(둘 다 카카오는 커스텀) |
| **한국 결제(PG)** | 백엔드 무관(PortOne/토스 웹훅을 Edge Function으로 수신) | 동일하게 함수로 수신 | 동등 |
| **실시간(커뮤니티)** | Realtime(Postgres 변경 구독) | Realtime DB/Firestore 리스너 | 동등 |
| **오픈소스/락인** | 오픈소스, 셀프호스팅 가능 → 벤더 락인 낮음 | 구글 종속, 이전 어려움 | **Supabase 우위** |
| **비용(초기 무료)** | 무료: 500MB DB·1GB Storage·Edge Functions 포함. Pro $25/월 | Spark 무료 후 Blaze 종량제(읽기/쓰기/함수 호출 과금 — 예측 어려움) | **Supabase 우위** (정액 예측 가능, 300만원 예산 적합) |
| **마이그레이션/타입** | SQL 마이그레이션 + 타입 자동생성(`supabase gen types`) | 스키마리스 → 타입 안전성 약함 | **Supabase 우위** |

#### 결론

필로그의 핵심 데이터(사용자 5축 벡터, 활동 5축 태그, 6유형 중심값, 카드 좋아요/싫어요 피드백, 예약·수수료)는 **본질적으로 관계형이며 벡터 연산을 동반**한다. 추천 매칭을 **SQL/Edge Function에서 직접 계산**하고 미래에 `pgvector`로 자연스럽게 확장하려면 **PostgreSQL 기반 Supabase가 정답**이다. 또한 무료/정액 요금이 300만원 예산에서 비용 예측을 쉽게 한다. 따라서 Supabase를 채택한다.

```sql
-- 5축 매칭 점수를 SQL로 직접 계산하는 예 (추천 매칭 로직 2단계)
-- distance(작을수록 매칭↑) → 100 - 정규화거리 형태로 점수화
SELECT a.id, a.title,
       100 - ( ABS(a.axis_rhythm   - $1)
             + ABS(a.axis_relation - $2)
             + ABS(a.axis_novelty  - $3)
             + ABS(a.axis_make     - $4)
             + ABS(a.axis_reward   - $5) ) / 10.0 AS match_score
FROM activities a
WHERE a.region = $6 AND a.price <= $7        -- 1단계 하드 필터(지역/예산)
ORDER BY match_score DESC
LIMIT 20;
```

---

### 1.5 (d) 시스템 아키텍처 다이어그램

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENTS (단일 Expo 코드베이스)                      │
│                                                                            │
│   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐       │
│   │  WEB (PWA)        │   │  iOS App         │   │  Android App     │       │
│   │  react-native-web │   │  (EAS build)     │   │  (EAS build)     │       │
│   │  Cloudflare Pages │   │  App Store       │   │  Play Store      │       │
│   └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘       │
│            │ 동일 디자인 토큰·동일 컴포넌트·동일 도메인 로직(@feellog/*)        │
│            └───────────────────────┼──────────────────────┘               │
└────────────────────────────────────┼──────────────────────────────────────┘
                                      │ HTTPS / supabase-js / Realtime WS
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE (BaaS)                                │
│                                                                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│   │  Auth    │  │ Postgres │  │ Storage  │  │ Realtime │  │ Edge Funcs   │  │
│   │ 이메일/   │  │ +RLS     │  │ 활동이미지 │  │ 커뮤니티  │  │ (Deno/TS)    │  │
│   │ OAuth +  │  │ 5축벡터/  │  │ 카드썸네일 │  │ 피드/동행 │  │              │  │
│   │ 카카오    │  │ 태그/피드백│  │  /CDN    │  │  구독     │  │              │  │
│   │ (OIDC)   │  │ (미래      │  └──────────┘  └──────────┘  └──────┬──────┘  │
│   └──────────┘  │  pgvector)│                                     │         │
│                 └─────┬─────┘            ┌──────────────────────────▼──────┐ │
│                       │  SQL/RPC 호출    │   추천 엔진 (자체 개발)           │ │
│                       └─────────────────│  @feellog/core 동일 로직 재사용:  │ │
│                                         │  1) 하드필터(지역/예산/강도)      │ │
│                                         │  2) 5축 벡터 매칭(거리→점수)      │ │
│                                         │  3) 최근접 중심 6유형 분류        │ │
│                                         │  4) 피드백 온라인 보정(태그 가중)  │ │
│                                         └──────────────────────────────────┘ │
└───────┬───────────────┬───────────────┬───────────────┬──────────────────────┘
        │ Webhook        │               │               │ (서버→외부 호출)
        ▼                ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐
│  PG / 결제    │ │  카카오맵     │ │ 푸시(Expo)   │ │  PG채널/SNS/분석         │
│ PortOne v2   │ │ Kakao Maps   │ │ FCM/APNs     │ │ 카카오선물하기/네이버    │
│ (토스 등)     │ │ SDK(POI/길찾기)│ │             │ │ 스마트스토어/인스타·유튜브│
│ 예약결제 수수료│ │              │ │             │ │ PostHog·Sentry           │
└──────────────┘ └──────────────┘ └──────────────┘ └────────────────────────┘
```

**핵심 흐름 요약**
1. 클라이언트(웹/앱)는 동일 코드 → Supabase에 `supabase-js`로 접근(Auth/DB/Storage/Realtime).
2. 추천 요청은 Edge Function 또는 Postgres RPC가 처리하며, **클라이언트와 동일한 `@feellog/core` 로직**으로 5축 매칭·6유형 분류·피드백 보정을 수행한다.
3. 결제는 클라이언트가 PortOne SDK로 시작 → 결과 검증/예약 확정은 **Edge Function이 PortOne 웹훅을 수신**해 서버 권위로 처리(수수료 10~15% 정산 데이터 기록).
4. 지도(카카오맵)·푸시(Expo)·PG채널(카카오선물하기/네이버)·분석(PostHog/Sentry)은 외부 연동.

---

### 1.6 (e) 환경 구성 · CI/CD · 웹 PWA 구성

#### 환경 구성 (dev / staging / prod)

3개 Supabase 프로젝트를 분리하고, Expo의 `app.config.ts`가 환경변수(`APP_ENV`)로 분기한다.

| 환경 | 용도 | Supabase | 웹 배포 | 앱 빌드(EAS) |
|---|---|---|---|---|
| **dev** | 로컬 개발 | 로컬 `supabase start`(Docker) 또는 dev 프로젝트 | `expo start --web` | development 프로파일(개발 클라이언트) |
| **staging** | 내부 QA/시연(동아리 발표·파트너 데모) | staging 프로젝트 | Pages 프리뷰 브랜치 | preview 프로파일(내부 배포) |
| **prod** | 실사용 | prod 프로젝트 | Pages 프로덕션 도메인 | production 프로파일(스토어 제출) |

```ts
// apps/feellog/app.config.ts — 환경별 분기
import 'dotenv/config';
const APP_ENV = process.env.APP_ENV ?? 'dev';
const supa = {
  dev:     { url: process.env.SUPABASE_URL_DEV,     anon: process.env.SUPABASE_ANON_DEV },
  staging: { url: process.env.SUPABASE_URL_STAGING, anon: process.env.SUPABASE_ANON_STAGING },
  prod:    { url: process.env.SUPABASE_URL_PROD,    anon: process.env.SUPABASE_ANON_PROD },
}[APP_ENV];

export default {
  expo: {
    name: APP_ENV === 'prod' ? 'Feellog' : `Feellog (${APP_ENV})`,
    slug: 'feellog',
    scheme: 'feellog',                       // 딥링크/OAuth 리다이렉트
    web: { output: 'static', bundler: 'metro' }, // 정적 export(SEO/PWA)
    plugins: [
      'expo-router',
      'expo-notifications',
      ['@react-native-kakao/core', { nativeAppKey: process.env.KAKAO_NATIVE_KEY }],
    ],
    extra: { APP_ENV, supabaseUrl: supa.url, supabaseAnon: supa.anon },
  },
};
```

```jsonc
// apps/feellog/eas.json — EAS 빌드 프로파일
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal",
                     "env": { "APP_ENV": "dev" } },
    "preview":     { "distribution": "internal",
                     "env": { "APP_ENV": "staging" } },
    "production":  { "autoIncrement": true,
                     "env": { "APP_ENV": "prod" } }
  },
  "submit": { "production": {} }
}
```

#### CI/CD (GitHub Actions + EAS)

```yaml
# .github/workflows/web-deploy.yml — 웹 PWA를 Cloudflare Pages로 배포
name: web-deploy
on:
  push:
    branches: [main]          # main → prod, PR → 프리뷰
jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint test            # core 추천 로직 단위테스트 포함
      - run: pnpm --filter feellog exec expo export -p web   # → dist/ (정적 PWA)
        env: { APP_ENV: prod }
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: feellog
          directory: apps/feellog/dist
```

```yaml
# .github/workflows/app-build.yml — 앱은 EAS 클라우드 빌드(태그 푸시 시)
name: app-build
on:
  push:
    tags: ['v*']
jobs:
  build-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - uses: expo/expo-github-action@v8
        with: { eas-version: latest, token: ${{ secrets.EXPO_TOKEN }} }
      - run: eas build --platform all --profile production --non-interactive
      # OTA 업데이트(JS만 변경 시 스토어 심사 없이 즉시 배포)
      # - run: eas update --branch production --message "${{ github.ref_name }}"
```

> **OTA 전략**: JS/디자인 변경은 `eas update`(OTA)로 스토어 심사 없이 즉시 반영 → 시니어 피드백 반영 속도↑. 네이티브 모듈/권한 변경 시에만 신규 빌드 제출.

#### 웹 PWA 구성 (시니어용 홈화면 추가 / 오프라인 캐시)

`apps/feellog/public/`에 PWA 자산을 둔다. Expo의 정적 export(`output: 'static'`)가 이를 그대로 포함한다.

```jsonc
// apps/feellog/public/manifest.json — 홈화면 추가용
{
  "name": "Feellog 필로그",
  "short_name": "Feellog",
  "start_url": "/",
  "display": "standalone",            // 주소창 없는 앱처럼 (시니어 혼란↓)
  "background_color": "#FAF8F3",      // 오프화이트
  "theme_color": "#6B8BE8",           // 콘플라워 블루
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```js
// apps/feellog/public/sw.js — 오프라인 캐시(앱 셸 + 정적자산)
const CACHE = 'feellog-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png'];
self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener('fetch', e => {              // 정적자산: 캐시 우선
  if (e.request.method === 'GET')
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
// API(supabase) 호출은 캐싱 제외(항상 네트워크) — 추천/피드백 신선도 유지
```

- **홈화면 추가 유도**: 첫 방문 시니어에게 "바탕화면에 추가하면 앱처럼 써요" 안내 배너(`beforeinstallprompt` 이벤트). iOS Safari는 "공유 → 홈 화면에 추가" 그림 가이드 제공([가정] iOS PWA 제약 대응).
- **오프라인 캐시 범위**: 앱 셸·아이콘·온보딩 이미지·이미 본 추천 카드 이미지까지. 결제/예약/실시간 데이터는 캐시 제외.

---

### 1.7 (f) Build vs Buy 결정표

각 기능을 **자체개발(Build)** 할지 **외부서비스(Buy)** 할지, 이유와 대략 비용(초기 MVP·300만원 예산 기준)을 정리한다.

| 기능 | 결정 | 선택 | 이유 | 대략 비용(초기) |
|---|---|---|---|---|
| **추천 엔진** | **Build** | 자체(`@feellog/core` + Edge Function/SQL) | 5축 벡터/6유형/카드 피드백 보정은 **우리 도메인 고유 로직**이자 핵심 차별점. 외부 추천 SaaS는 우리 데이터모델에 안 맞음. "직접 만들 수 있으면 직접" 방향과 일치. 유틸(벡터 거리 계산)만 라이브러리 차용. | 인건비(자체) — 추가 현금비용 ~0 |
| **인증(Auth)** | **Buy + 일부 Build** | Supabase Auth + 카카오 커스텀 | 이메일/Apple/Google은 Supabase 기본. **카카오는 비공식 → 커스텀 OIDC/토큰 교환만 자체 구현**(시니어 필수). 직접 세션/토큰 관리 재발명 불필요. | Supabase 무료 티어, 카카오 무료 |
| **지도** | **Buy** | 카카오맵 SDK | 국내 POI/길찾기 정확도·시니어 친숙도. 지도 자체개발은 비현실적. | 카카오맵 무료(쿼터 내). 초과 시 종량 |
| **결제(PG)** | **Buy** | PortOne v2(+토스페이먼츠) | PCI/정산/PG 연동 직접 구현은 규제·리스크 과다. PortOne이 다중 PG 추상화. 수수료 정산만 Edge Function으로 기록. | PG 수수료 ~2.5~3.3%/건(매출연동, 초기 고정비 거의 0) |
| **PG 채널(선물하기)** | **Buy** | 카카오 선물하기 / 네이버 스마트스토어 | 기프티콘 유통 채널. 자체 구축 불가, 입점형. | 채널 수수료(매출연동) |
| **푸시(Push)** | **Buy** | Expo Push(expo-notifications) | FCM/APNs를 단일 API로 추상화. 자체 푸시 서버 불필요. | Expo Push 무료 |
| **이미지 CDN/스토리지** | **Buy** | Supabase Storage(+CDN) | 활동 카드 썸네일·라인 일러스트. 별도 CDN 도입 불필요(통합·무료티어). 필요 시 Cloudflare 이미지 변환 보강. | 무료 티어(1GB) → 초과 시 소액 |
| **분석(Analytics)** | **Buy** | PostHog | 카드 좋아요/관심없어요·테스트 완료율·퍼널·피처플래그. 무료 티어로 충분. 직접 이벤트 파이프라인 구축 비효율. | 무료(월 100만 이벤트 한도 내) |
| **에러 추적** | **Buy** | Sentry | 크래시/에러 모니터링. 자체 구축 비효율. | 무료 티어 |
| **호스팅(웹)** | **Buy** | **Cloudflare Pages (정본 확정)** | 정적 PWA 무료 호스팅·글로벌 CDN·**대역폭 무제한**·상업적 사용 허용. | 무료 |
| **앱 빌드/배포** | **Buy** | EAS | 맥/안드 빌드 인프라 자체 보유 불필요(학생팀). OTA 포함. | 무료 티어(월 30빌드) → 초과 시 $$ / 스토어 등록비 별도(애플 $99/년, 구글 $25 1회) |
| **레이더/차트** | **Build(라이브러리 위)** | react-native-svg 위 자체 컴포넌트 | 5축 레이더는 디자인 커스텀 필요(브랜드 일관성). 범용 차트 라이브러리는 과함. | ~0 |

#### 예산 매핑(인프라 35% = 약 105만원 / 4개월)

| 항목 | 초기 비용 | 비고 |
|---|---|---|
| Supabase | 무료(Pro 전환 시 $25/월 ≈ 3.4만원) | MVP는 무료 티어로 시작 |
| Cloudflare Pages | 무료 | 웹 호스팅·CDN |
| EAS | 무료 티어 | 빌드 한도 내 |
| 도메인 | 1.5~2만원/년 | feellog.kr 등 |
| Apple Developer | 약 13만원/년($99) | 앱 단계에서만 |
| Google Play | 약 3.3만원(1회, $25) | 앱 단계에서만 |
| 카카오맵/푸시/PostHog/Sentry | 무료 티어 | — |
| **MVP 단계 현금 합계** | **사실상 수만원 수준** | 인프라 예산(105만원)은 Pro 전환·트래픽 증가·예비비로 충분히 커버 → **결제/광고 외 고정비 거의 없이 출시 가능** |

> **핵심 결론(Build vs Buy 철학)**: **차별점이자 도메인 핵심인 "추천 엔진"만 직접 만든다.** 인증/지도/결제/푸시/CDN/분석/호스팅 등 **비차별 인프라는 모두 검증된 무료~종량 외부 서비스로 사서** 1인 개발·300만원 예산을 보호한다. 이는 사용자가 확정한 "직접 만들 수 있으면 직접, 가져올 수 있으면 가져와 우리에 맞게"를 그대로 구현한 것이다.

---

## 2. 진단·추천 엔진 상세 설계 (수식 · 의사코드 · 진화 로드맵)

이 섹션은 필로그의 진단(12문항 → 5축 → 6유형 + 보조성향) 과 추천(하드 필터 → 5축 유사도 → 피드백 온라인 보정) 엔진을, 그대로 Supabase/Edge Function/Postgres 위에서 구현할 수 있는 수준까지 수식·의사코드·수치예시로 명세한다. 모든 좌표계는 **5축 벡터, 스케일 −100 ~ +100** 으로 통일한다.

---

### 2.0 표기·자료구조·좌표계 통일 (모든 하위 절의 전제)

#### 2.0.1 5축 정의와 부호 규약

축은 항상 아래 순서의 5차원 벡터로 다룬다. 인덱스 0~4를 고정한다.

| idx | 축 ID | 축 이름 | 음(−) 방향 | 양(+) 방향 | 별칭(스크린샷 표기 흔들림) |
|---|---|---|---|---|---|
| 0 | `rhythm` | 활동 리듬 | 차분함 | 활동적 | (동일) |
| 1 | `relation` | 관계 방식 | 독립 | 교류 | (동일) |
| 2 | `experience` | 경험 선호 | 익숙함 | 새로움 | 경험 방식 |
| 3 | `participation` | 참여 방식 | 감상 | 만들기 | 만족 방식 |
| 4 | `reward` | 기대 보상 | 정서·회복 | 실용·성취 | 추구 가치 |

> [가정] 브리프의 별칭("경험 방식/만족 방식/추구 가치")은 동일 축의 다른 표기로 간주하고 위 캐노니컬 ID로 통일한다. 코드/DB/카피 어디서도 별칭을 직접 쓰지 않는다.

```ts
// 모든 벡터는 길이 5, 인덱스 고정. 단위: -100 ~ +100 (정수 또는 실수)
type Axis = 'rhythm' | 'relation' | 'experience' | 'participation' | 'reward';
const AXES: Axis[] = ['rhythm', 'relation', 'experience', 'participation', 'reward'];
type Vec5 = [number, number, number, number, number]; // [rhythm, relation, experience, participation, reward]
```

#### 2.0.2 부호 규약의 단일 원천 — "오른쪽(+) 키워드 = 양의 방향"

설문 UI는 "왼쪽 이미지 ↔ 오른쪽 이미지"를 5단계 바로 고른다. **응답 raw 값 `r ∈ {-2,-1,0,+1,+2}`** 는 "왼쪽 훨씬=−2 … 오른쪽 훨씬=+2" 로 고정한다. 다만 **각 문항이 어느 축의 +방향에 정렬되어 있는지가 다르므로**, 문항마다 부호 정렬 계수 `sign ∈ {+1, −1}` 를 둔다. 축 점수에 기여하는 값은 항상 `contribution = sign * r`.

규칙: `sign = +1` 이면 "오른쪽 선택 = 해당 축의 +방향". `sign = −1` 이면 "오른쪽 선택 = 해당 축의 −방향"(즉 좌우가 축 정의와 반대로 배치된 문항).

#### 2.0.3 핵심 테이블 스키마(요약)

```sql
-- 사용자 진단 원응답
create table diagnosis_response (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id),
  q_index       int  not null check (q_index between 1 and 12),
  raw_value     int  not null check (raw_value between -2 and 2), -- 왼쪽훨씬 -2 ~ 오른쪽훨씬 +2
  created_at    timestamptz default now(),
  unique(user_id, q_index)
);

-- 사용자 성향 프로파일 (5축 + 보조 + 6유형 결과 + 피드백 보정 상태)
create table user_profile (
  user_id        uuid primary key references auth.users(id),
  v_base         real[5] not null,        -- 진단으로 산출한 원본 5축 (-100~100), 고정 기준선
  v_current      real[5] not null,        -- 피드백 EMA로 갱신되는 현재 5축 (-100~100)
  trend_score    real not null,           -- 트렌드발견 보조성향 (0~100)
  recovery_score real not null,           -- 회복충전 보조성향 (0~100)
  main_type      text not null,           -- 6유형 코드
  sub_trait      text,                    -- 'trend' | 'recovery' | null
  tag_weights    jsonb not null default '{}', -- 태그별 가중 (-1.0~+1.0)
  feedback_count int  not null default 0,
  updated_at     timestamptz default now()
);

-- 활동(클래스) 카탈로그 + 5축 태그 + 하드필터 메타
create table activity (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  v_tag        real[5] not null,          -- 활동 5축 벡터 (-100~100)
  keyword_chips text[] not null default '{}',
  region_code  text not null,             -- 하드필터: 지역
  price        int  not null,             -- 하드필터: 예산(원)
  duration_min int  not null,             -- 하드필터: 소요시간(분)
  intensity    int  not null check (intensity between 1 and 5), -- 신체강도 1~5
  partner_id   uuid,                       -- 제휴처
  is_active    boolean default true
);
```

---

### 2.1 (a) 12문항 → 5축 점수화 수식

#### 2.1.1 문항 매핑표(부호 규약 명시)

각 문항을 `(축, sign, 보조성향기여)` 로 매핑한다. `sign` 은 브리프 문항의 "오른쪽(vs 뒤쪽) 키워드"가 축 +방향과 같으면 +1, 반대면 −1.

| Q | 축 | 좌(−2쪽) 키워드 | 우(+2쪽) 키워드 | 축 +방향 | sign | 보조 기여 |
|---|---|---|---|---|---|---|
| Q1 | experience | 익숙·편안 | 새롭고 화제 체험 | 새로움(+) | **+1** | trend |
| Q2 | rhythm | 차분히 앉아 집중 | 가볍게 움직임 | 활동적(+) | **+1** | — |
| Q3 | relation | 혼자/소수 집중 | 사람들과 함께 | 교류(+) | **+1** | — |
| Q4 | participation | 보고 듣고 감상 | 직접 만들고 해보기 | 만들기(+) | **+1** | — |
| Q5 | reward | 몸·마음 편안(회복) | 배운 것 남고 도움(실용) | 실용·성취(+) | **+1** | recovery* |
| Q6 | experience | 편안·정감 공간 | 감각적·새로운 공간 | 새로움(+) | **+1** | trend |
| Q7 | rhythm | 실내 조용히 집중 | 밖으로 장소 바꾸기 | 활동적(+) | **+1** | — |
| Q8 | relation | 활동 몰입 시간 | 대화·교류 시간 | 교류(+) | **+1** | — |
| Q9 | reward | 좋은 경험·감정 남음 | 결과물 남음 | 실용·성취(+) | **+1** | recovery* |
| Q10 | reward | 취향·즐거움 채움 | 일상에 활용 가능 | 실용·성취(+) | **+1** | — |
| Q11 | (보조전용) | 편안·회복 시간 | 새롭고 감각적 체험 | — | — | trend & recovery |
| Q12 | participation | 전시·공연 문화 즐기기 | 나만의 것 만들기 | 만들기(+) | **+1** | — |

> 부호 주: 위 표는 "오른쪽 키워드"를 모두 해당 축 +방향으로 정렬해 두었으므로 모든 sign=+1 로 떨어진다. **UI 구현 시 좌/우 이미지 배치를 이 표대로 강제**해야 sign 보정이 필요 없다. 만약 디자인 사정으로 좌우를 뒤집으면 그 문항만 `sign=-1` 로 바꾸고 contribution = sign·r 로 계산한다(데이터는 raw_value 그대로 저장, sign은 코드 상수).
>
> recovery* 주의: Q5/Q9 는 **축(reward)에는 +(실용)방향으로 기여**하지만, **회복충전 보조성향에는 "회복쪽(−2쪽=왼쪽)으로 갈수록 강해진다"**. 즉 보조성향 계산에서는 부호를 반대로 쓴다(2.1.3 참조). 이 이중성을 코드에서 분리한다.

```ts
// 문항 → 축 매핑 (보조성향과 분리)
const Q_AXIS: Record<number, { axis: Axis; sign: 1 | -1 } | null> = {
  1:  { axis: 'experience',    sign: 1 },
  2:  { axis: 'rhythm',        sign: 1 },
  3:  { axis: 'relation',      sign: 1 },
  4:  { axis: 'participation', sign: 1 },
  5:  { axis: 'reward',        sign: 1 },
  6:  { axis: 'experience',    sign: 1 },
  7:  { axis: 'rhythm',        sign: 1 },
  8:  { axis: 'relation',      sign: 1 },
  9:  { axis: 'reward',        sign: 1 },
  10: { axis: 'reward',        sign: 1 },
  11: null,                       // 축에는 기여하지 않는 보조 전용 문항
  12: { axis: 'participation', sign: 1 },
};
```

#### 2.1.2 축별 합산 → −100~+100 정규화 (문항 수 불균형 처리)

축마다 관련 문항 수가 다르다.

| 축 | 관련 문항 | 문항 수 nₐ | 합산 가능 범위 |
|---|---|---|---|
| rhythm | Q2, Q7 | 2 | −4 … +4 |
| relation | Q3, Q8 | 2 | −4 … +4 |
| experience | Q1, Q6 | 2 | −4 … +4 |
| participation | Q4, Q12 | 2 | −4 … +4 |
| reward | Q5, Q9, Q10 | 3 | −6 … +6 |

(Q11 은 어느 축에도 안 들어감 → 5축 합계 11문항 사용)

**정규화 공식** — 각 축의 raw 합을 그 축의 최대 절대치 `2·nₐ` 로 나눠 [−1,1] 로 만든 뒤 100 배:

$$
S_a \;=\; 100 \times \frac{\displaystyle\sum_{q \in Q_a} \mathrm{sign}_q \cdot r_q}{2\,n_a}
\qquad a \in \{\text{rhythm, relation, experience, participation, reward}\}
$$

- 분모 `2·nₐ` 가 축마다 다르므로 **문항 수가 달라도 결과는 항상 −100~+100 로 균등 정규화**된다(reward 는 3문항이라 분모 6, 나머지는 분모 4).
- 결측 응답 처리: 사용자가 일부 문항을 건너뛰면 해당 축의 분모를 "응답한 문항만"으로 동적 계산: `분모 = 2 · (응답 문항 수)`. 한 축이 전부 결측이면 그 축은 0 으로 둔다(중립).

```ts
function scoreAxes(responses: Record<number, number>): Vec5 {
  const acc: Record<Axis, { sum: number; n: number }> =
    Object.fromEntries(AXES.map(a => [a, { sum: 0, n: 0 }])) as any;

  for (const [qStr, raw] of Object.entries(responses)) {
    const q = Number(qStr);
    const m = Q_AXIS[q];
    if (!m) continue;                 // Q11 등 축 비기여 문항 skip
    acc[m.axis].sum += m.sign * raw;  // contribution = sign * r
    acc[m.axis].n   += 1;
  }
  return AXES.map(a => {
    const { sum, n } = acc[a];
    if (n === 0) return 0;            // 전 결측 축은 중립
    return clamp(100 * sum / (2 * n), -100, 100);
  }) as Vec5;
}
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
```

#### 2.1.3 보조 성향(트렌드 발견 / 회복 충전) 점수화 + 표시 임계값

보조 성향은 **0~100 단방향 강도**다(축처럼 ± 가 아니라 "얼마나 강한가").

- **트렌드 발견** 기여: Q1, Q6(experience +방향 = 새로움), Q11(오른쪽=새롭고 감각적 체험 → trend). 새로움쪽으로 갈수록 ↑.
  - 문항 기여값 `t_q = +r_q` (오른쪽 +2 = 트렌드 최대).
- **회복 충전** 기여: Q5, Q9(둘 다 오른쪽=실용/결과물이므로 **회복은 왼쪽 −2쪽**), Q11(왼쪽=편안·회복 → recovery).
  - 문항 기여값 `c_q = −r_q` (왼쪽 −2 = 회복 최대 → −(−2)=+2).
  - 단 Q11 은 trend 와 recovery 가 **반대 극**을 공유하므로: trend 기여 `= +r₁₁`, recovery 기여 `= −r₁₁`.

각 보조성향 점수(0~100):

$$
T_{\text{trend}} = 100 \times \frac{\sum_{q\in\{1,6,11\}} (+r_q) \;+\; 2\cdot 3}{2 \cdot (2\cdot3)}
= 100 \times \frac{\big(\sum r_q\big) + 6}{12}
$$

$$
T_{\text{recovery}} = 100 \times \frac{\sum_{q\in\{5,9,11\}} (-r_q) \;+\; 6}{12}
$$

(분자에 `+6`, 분모 `12`: raw 합 범위 −6…+6 을 0…100 으로 선형 사상. 즉 `(합 + 6)/12 × 100`.)

**표시 규칙(브리프: "점수 높을 때만 0~1개 표시")**

```
let sub = null
display_threshold = 60        // 0~100 중 60 이상만 "유의미" (가정)
gap_threshold     = 8         // 두 점수가 8점 이내로 박빙이면 표시 안 함(애매성 회피)

if max(T_trend, T_recovery) >= display_threshold
   and abs(T_trend - T_recovery) >= gap_threshold:
       sub = (T_trend > T_recovery) ? 'trend' : 'recovery'
```

> [가정] `display_threshold=60`, `gap_threshold=8` 은 초기 휴리스틱. 베타 데이터 수집 후 분포 보고 조정(예: 상위 분위수 기반).

```ts
function scoreSubTraits(r: Record<number, number>) {
  const g = (q: number) => r[q] ?? 0;
  const trend    = clamp(100 * ((g(1) + g(6) + g(11)) + 6) / 12, 0, 100);
  const recovery = clamp(100 * (((-g(5)) + (-g(9)) + (-g(11))) + 6) / 12, 0, 100);

  let sub: 'trend' | 'recovery' | null = null;
  if (Math.max(trend, recovery) >= 60 && Math.abs(trend - recovery) >= 8) {
    sub = trend > recovery ? 'trend' : 'recovery';
  }
  return { trend, recovery, sub };
}
```

#### 2.1.4 수치 예시 — 샘플 응답자 "김영자(56)"

응답(raw): Q1=+2, Q2=+1, Q3=+2, Q4=−1, Q5=−2, Q6=+1, Q7=+1, Q8=+2, Q9=−1, Q10=−1, Q11=−2, Q12=−1

| 축 | 문항·raw | 합 | 분모 2nₐ | Sₐ |
|---|---|---|---|---|
| rhythm | Q2(+1)+Q7(+1) | +2 | 4 | **+50** |
| relation | Q3(+2)+Q8(+2) | +4 | 4 | **+100** |
| experience | Q1(+2)+Q6(+1) | +3 | 4 | **+75** |
| participation | Q4(−1)+Q12(−1) | −2 | 4 | **−50** |
| reward | Q5(−2)+Q9(−1)+Q10(−1) | −4 | 6 | **−66.7** |

→ `v_base = [50, 100, 75, -50, -66.7]` (활동적·교류·새로움·감상·정서회복)

보조성향:
- trend = 100·((2 + 1 + (−2)) + 6)/12 = 100·(1+6)/12 = **58.3**
- recovery = 100·((−(−2)) + (−(−1)) + (−(−2)) + 6)/12 = 100·((2+1+2)+6)/12 = 100·11/12 = **91.7**
- max=91.7 ≥ 60, gap=33.4 ≥ 8 → **sub = 'recovery' (회복 충전)**

---

### 2.2 (b) 6유형 분류 — 중심 벡터 통일·최근접 분류·동점·카피

#### 2.2.1 중심값 스케일 통일 (−25~+25 → −100~+100)

브리프의 유형 중심값은 −25~+25 가중치 초안이다. **×4 배율**로 −100~+100 스케일에 정합시킨다(축 점수와 동일 좌표계).

| 유형 코드 | 유형명 | 원본(−25~25) rhythm/rel/exp/part/rew | 통일 중심 `C_type` (−100~100) |
|---|---|---|---|
| `vitality` | 활력 탐험형 | +25/+5/+5/0/0 | **[100, 20, 20, 0, 0]** |
| `stillness` | 고요 몰입형 | −25/−15/0/−20/−5 | **[−100, −60, 0, −80, −20]** |
| `craft` | 손끝 성취형 | −5/−5/+25/+25/0 | **[−20, −20, 100, 100, 0]** |
| `warmth` | 따뜻한 교류형 | 0/+25/+5/−5/−5 | **[0, 100, 20, −20, −20]** |
| `upgrade` | 생활 업그레이드형 | 0/0/+10/+10/+25 | **[0, 0, 40, 40, 100]** |
| `culture` | 문화 향유형 | −10/0/−25/−10/−25 | **[−40, 0, −100, −40, −100]** |

> 주의(브리프 표기): 컬럼 순서가 활동리듬/관계방식/**경험방식(=experience)**/**만족방식(=participation)**/**추구가치(=reward)** 이므로 위 캐노니컬 인덱스 0~4 와 1:1 대응한다(혼동 금지).

```ts
const TYPE_CENTROIDS: Record<string, Vec5> = {
  vitality:  [100,  20,  20,   0,   0],
  stillness: [-100, -60,  0, -80, -20],
  craft:     [-20, -20, 100, 100,   0],
  warmth:    [  0, 100,  20, -20, -20],
  upgrade:   [  0,   0,  40,  40, 100],
  culture:   [-40,   0,-100, -40,-100],
};
const TYPE_NAME: Record<string,string> = {
  vitality:'활력 탐험형', stillness:'고요 몰입형', craft:'손끝 성취형',
  warmth:'따뜻한 교류형', upgrade:'생활 업그레이드형', culture:'문화 향유형',
};
```

#### 2.2.2 최근접 중심 분류 — 유클리드 거리(권장) + 코사인 보조

**1차 분류는 유클리드 거리**(축의 ± 부호와 절댓값 모두 의미가 있으므로 방향만 보는 코사인보다 적합). 5축 가중치 `w_a`(2.3.3에서 추천과 공유)를 반영한 가중 유클리드:

$$
d(\mathbf{v}, C_t) = \sqrt{\sum_{a=0}^{4} w_a \,(v_a - C_{t,a})^2}, 
\qquad \text{type} = \arg\min_t d(\mathbf{v}, C_t)
$$

분류엔 `w_a = 1`(균등)을 기본으로 한다(유형 정의가 모든 축을 동등하게 본다는 전제). 추천 단계의 가중치와 분리.

**동점/박빙 처리**:
- `d_best` 와 `d_2nd` 의 상대차가 작으면(예: `(d_2nd − d_best)/d_best < 0.05`) "혼합형"으로 간주, 두 유형을 함께 보여주되 **메인은 거리 최소**, 보조 안내 문구로 2위 유형 노출.
- 완전 동점(부동소수 거의 없음)일 때 결정적 tie-break 순서: `vitality < warmth < craft < upgrade < culture < stillness` (사전식 우선순위 상수)로 재현성 보장.

```ts
function classifyType(v: Vec5, w: Vec5 = [1,1,1,1,1]) {
  const TIE_ORDER = ['vitality','warmth','craft','upgrade','culture','stillness'];
  const dist = (c: Vec5) =>
    Math.sqrt(v.reduce((s, vi, a) => s + w[a] * (vi - c[a]) ** 2, 0));

  const ranked = Object.entries(TYPE_CENTROIDS)
    .map(([code, c]) => ({ code, d: dist(c) }))
    .sort((p, q) =>
      p.d !== q.d ? p.d - q.d : TIE_ORDER.indexOf(p.code) - TIE_ORDER.indexOf(q.code));

  const [best, second] = ranked;
  const mixed = (second.d - best.d) / (best.d || 1) < 0.05;
  return { mainType: best.code, secondType: second.code, mixed, ranked };
}
```

#### 2.2.3 분류 수치 예시 — 김영자 `v_base=[50,100,75,−50,−66.7]`

균등 가중 유클리드 거리(제곱합 √):

| 유형 | 차이² 합 (요약) | 거리 d |
|---|---|---|
| warmth [0,100,20,−20,−20] | 50²+0²+55²+30²+46.7² ≈ 2500+0+3025+900+2180 = 8605 | **92.8** ← 최소 |
| vitality [100,20,20,0,0] | 50²+80²+55²+50²+66.7² ≈ 2500+6400+3025+2500+4449=18874 | 137.4 |
| craft [−20,−20,100,100,0] | 70²+120²+25²+150²+66.7²=4900+14400+625+22500+4449=46874 | 216.5 |
| culture [−40,0,−100,−40,−100] | 90²+100²+175²+10²+33.3²=8100+10000+30625+100+1109=49934 | 223.5 |
| upgrade [0,0,40,40,100] | 50²+100²+35²+90²+166.7²=2500+10000+1225+8100+27789=49614 | 222.7 |
| stillness [−100,−60,0,−80,−20] | 150²+160²+75²+30²+46.7²=22500+25600+5625+900+2180=56805 | 238.3 |

→ **메인 = `warmth`(따뜻한 교류형)**, 2위 culture, `(223.5−92.8)/92.8=1.41 ≥ 0.05` → 혼합 아님. 보조성향 recovery 와 결합.

#### 2.2.4 결과 카피 생성(유형명 + 보조성향)

```ts
const SUB_PHRASE = {
  trend:    '새로운 감각을 즐기는',
  recovery: '편안한 회복을 원하는',
  null:     '',
};
function resultCopy(mainType: string, sub: 'trend'|'recovery'|null) {
  const name = TYPE_NAME[mainType];               // 예: 따뜻한 교류형
  const head = sub ? `${SUB_PHRASE[sub]} ${name}` : name;
  return {
    title: `당신은 ${head}이에요!`,                // "당신은 편안한 회복을 원하는 따뜻한 교류형이에요!"
    badge: sub === 'trend' ? '트렌드 발견' : sub === 'recovery' ? '회복 충전' : null,
    radar: '5축 레이더 차트(v_current)',
  };
}
```

결과 화면 = 카피 타이틀 + 보조 배지 + 5축 레이더(v_current) + 추천 클래스 썸네일(2.3 결과).

---

### 2.3 (c) 활동 ↔ 사용자 매칭

#### 2.3.1 파이프라인 개요(ASCII)

```
 사용자 v_current(5축) ─┐
                        │
 후보 활동 전체 ──► [1. 하드 필터] 지역=∋ & 예산≤ & 시간≤ & 강도∈범위
                        │  (불통과 즉시 탈락, 점수 계산 안 함)
                        ▼
                 [2. 유사도 점수] 가중 거리 → 0~100 환산 (+ 6유형 보너스 + 보조성향/태그 보정)
                        ▼
                 [3. 정렬 + 다양성(MMR) + epsilon 탐색 카드 일부 섞기]
                        ▼
                 추천 카드 리스트 (1/25 …) ──► 좋아요/관심없음 ──► 2.4 온라인 보정으로 회귀
```

#### 2.3.2 하드 필터(불리언, 점수화 이전 단계)

```ts
interface UserConstraints {
  regions: string[];      // 사용자 활동 가능 지역코드 집합
  maxPrice: number;       // 예산 상한(원)
  maxDuration: number;    // 시간 상한(분)
  intensityMin: number;   // 신체강도 허용 하한
  intensityMax: number;   // 신체강도 허용 상한
}
function passesHardFilter(a: Activity, c: UserConstraints): boolean {
  return c.regions.includes(a.region_code)
      && a.price       <= c.maxPrice
      && a.duration_min <= c.maxDuration
      && a.intensity   >= c.intensityMin
      && a.intensity   <= c.intensityMax;
}
```

Postgres 측에선 인덱스로 선거른다:

```sql
-- 후보 축소를 DB에서: 점수 계산 대상만 추림
select * from activity
where is_active
  and region_code = any($1)         -- regions
  and price        <= $2
  and duration_min <= $3
  and intensity    between $4 and $5;
```

#### 2.3.3 유사도 점수 — 가중 유클리드 → 0~100 환산

방향+크기 모두 중요하므로 **가중 유클리드 거리 기반**을 본선으로 채택(코사인은 §2.6에서 보조 지표로만). 축 가중치 `w_a` 는 합 = 5 로 정규화.

| 축 | 기본 가중 wₐ | 근거 |
|---|---|---|
| rhythm | 1.2 | 신체 활동 강도 체감 직결, 시니어 핵심 |
| relation | 1.1 | 교류/독립은 만족도 좌우 |
| experience | 1.0 | 중립 |
| participation | 0.9 | 만들기/감상 다소 유연 |
| reward | 0.8 | 사후 만족, 보정 여지 큼 |
| 합 | 5.0 | |

최대 가능 거리(정규화 분모): 각 축 차이 최대 200(−100↔+100), 가중 제곱합의 최대 = `Σ wₐ·200²`. 이를 `D_max` 로 두고 0~100 환산(가까울수록 100):

$$
d_w(\mathbf{u},\mathbf{a}) = \sqrt{\sum_a w_a (u_a-a_a)^2}, \quad
D_{\max}=\sqrt{\sum_a w_a \cdot 200^2}=200\sqrt{\textstyle\sum_a w_a}=200\sqrt{5}
$$

$$
\text{base}_{\%} = 100 \times \left(1 - \frac{d_w}{D_{\max}}\right) \in [0,100]
$$

**최종 매칭 점수** = base + 6유형 정합 보너스 + 보조성향/태그 보정:

$$
\text{Match} = \mathrm{clamp}\Big(\text{base}_{\%} + B_{\text{type}} + B_{\text{sub}} + B_{\text{tag}},\; 0,\; 100\Big)
$$

- `B_type`: 활동이 사용자 메인유형의 추천 활동군(트레킹·도자기 등 시드 매핑)에 속하면 **+8**, 2위(혼합)유형군이면 **+3**.
- `B_sub`: 활동 키워드칩이 보조성향과 일치(trend↔"새로운/감각적", recovery↔"편안/회복/힐링")하면 **+5**.
- `B_tag`: 사용자 `tag_weights` 의 칩 가중 합 × 5 (−5~+5, 피드백 누적분, §2.4).

```ts
const W: Vec5 = [1.2, 1.1, 1.0, 0.9, 0.8];
const D_MAX = 200 * Math.sqrt(W.reduce((s, x) => s + x, 0)); // 200·√5 ≈ 447.2

function baseSimilarity(u: Vec5, a: Vec5): number {
  const dw = Math.sqrt(W.reduce((s, w, i) => s + w * (u[i] - a[i]) ** 2, 0));
  return 100 * (1 - dw / D_MAX);
}
function matchScore(p: UserProfile, act: Activity): number {
  let s = baseSimilarity(p.v_current, act.v_tag);
  if (act.typeGroup === p.main_type)        s += 8;
  else if (act.typeGroup === p.second_type) s += 3;
  if (subMatches(act.keyword_chips, p.sub_trait)) s += 5;
  s += 5 * tagWeightSum(act.keyword_chips, p.tag_weights); // -5~+5
  return clamp(s, 0, 100);
}
```

#### 2.3.4 수치 예시 — 김영자 `v_current=[50,100,75,−50,−66.7]` vs 브리프 활동들

base 유사도(가중 유클리드, W=[1.2,1.1,1.0,0.9,0.8], D_max≈447.2):

| 활동 | v_tag | 가중 제곱합 Σwₐ(u−a)² | dw | base% |
|---|---|---|---|---|
| 다도 모임 | [−20,70,−30,−20,40] | 1.2·70²+1.1·30²+1.0·105²+0.9·30²+0.8·106.7²= 5880+990+11025+810+9108=27813 | 166.8 | **62.7** |
| 전시 관람 | [−10,10,60,−80,20] | 1.2·60²+1.1·90²+1.0·15²+0.9·30²+0.8·86.7²=4320+8910+225+810+6013=20278 | 142.4 | **68.2** |
| 트레킹 | [80,20,70,20,10] | 1.2·30²+1.1·80²+1.0·5²+0.9·70²+0.8·76.7²=1080+7040+25+4410+4705=17260 | 131.4 | **70.6** |
| 도자기 | [−60,−40,−20,80,−20] | 1.2·110²+1.1·140²+1.0·95²+0.9·130²+0.8·46.7²=14520+21560+9025+15210+1745=62060 | 249.1 | **44.3** |
| 목공 | [10,−10,30,90,70] | 1.2·40²+1.1·110²+1.0·45²+0.9·140²+0.8·136.7²=1920+13310+2025+17640+14953=49848 | 223.3 | **50.1** |

base 순위: 트레킹(70.6) > 전시(68.2) > 다도(62.7) > 목공(50.1) > 도자기(44.3).

보너스 적용 후(메인=warmth, sub=recovery): 다도 모임은 warmth 유형군(+8) & "차분/힐링" 칩 recovery 일치(+5) → 62.7+13 = **75.7 로 1위 도약**. 전시(culture군, sub 보너스 0) 68.2 유지, 트레킹(vitality군) 70.6 유지. → **최종: 다도(75.7) > 트레킹(70.6) > 전시(68.2) …**
→ 보조성향·유형 보너스가 "교류·회복 지향" 사용자에게 다도를 올바르게 끌어올림(순수 거리만으론 트레킹이 1위였음).

#### 2.3.5 초기 추천 구성(시안: "맞춤 카드 우선 + 탐색용 일부")

```
top-N 카드 = [ 매칭점수 상위 K개(exploit) ]  +  [ epsilon 비율 탐색 카드(explore) ]
- K = 20, explore 비율 ε = 0.2 → 25장 중 5장은 다양성/탐색용
- 탐색 카드는 "사용자가 아직 반응 안 한 태그/유형" 위주로 의도적 샘플 (§2.4 다양성)
- 다양성 보장: MMR 로 상위 결과의 활동 벡터가 서로 너무 유사하지 않게(같은 유형 연속 3개 방지)
```

---

### 2.4 (d) 활동 카드 피드백 온라인 보정

진단 = 출발점, 카드 반응 = 실제 감성 보정 데이터. 좋아요/싫어요로 **사용자 5축 `v_current` 를 EMA(지수이동평균)** 로 활동 벡터 방향/반대로 끌어당기고, **태그 가중**을 강화/약화한다.

#### 2.4.1 5축 EMA 업데이트 수식

좋아요 → 활동 벡터 방향으로 끌림, 싫어요 → 반대로 밀림.

$$
\mathbf{v}_{\text{current}} \leftarrow \mathrm{clip}\Big(\mathbf{v}_{\text{current}} + \eta \cdot \mathrm{dir} \cdot (\mathbf{a} - \mathbf{v}_{\text{current}}),\; [-100, 100]\Big)
$$

- `dir = +1` (좋아요), `dir = −1` (관심없음/싫어요).
- `η`(학습률) = 콜드스타트 초반 큼 → 점차 감쇠: `η = η0 / (1 + λ·feedback_count)`, `η0=0.20`, `λ=0.05`.
  - 좋아요는 `(a − v)` 방향(활동 쪽으로 이동), 싫어요는 같은 식에 dir=−1 → `v` 가 활동에서 멀어짐.
- **앵커 정규화(폭주 방지 핵심)**: 피드백이 누적돼도 진단 기반선 `v_base` 에서 과도 이탈 못 하게 매 업데이트 후 당김:
$$
\mathbf{v}_{\text{current}} \leftarrow (1-\beta)\,\mathbf{v}_{\text{current}} + \beta\,\mathbf{v}_{\text{base}}, \quad \beta = 0.05
$$
  - 또는 하드 클립: `|v_current,a − v_base,a| ≤ 40` 로 축별 최대 이탈 제한(둘 중 하나 또는 병행).

#### 2.4.2 태그 가중 강화/약화(EMA)

```
for chip in activity.keyword_chips:
    tag_weights[chip] ← clip( tag_weights[chip] + η_tag · dir · (1 − |tag_weights[chip]|), -1, +1 )
    # (1 - |w|): 이미 큰 가중은 더 천천히 → 자연 포화, 폭주 방지
η_tag = 0.15
```

좋아한 활동의 칩(예: "차분한 몰입", "결과물 만족")은 +로, 관심없는 활동 칩은 −로. 이 `tag_weights` 가 §2.3.3 `B_tag` 로 환류.

#### 2.4.3 콜드스타트 · 탐색(epsilon) · 다양성

| 상황 | 정책 |
|---|---|
| 진단 직후(feedback_count=0) | `v_current = v_base`, η 큰 값(η0=0.20)으로 빠르게 적응 |
| 카드 부족·신규 활동 | 인기도(전체 좋아요율) fallback 정렬 + 유형군 대표 카드 |
| 탐색 ε | 추천 25장 중 ε=20% 는 매칭점수 무시하고 "미반응 태그/유형" 샘플 → 취향 사각지대 발견 |
| ε 감쇠 | feedback_count 증가 시 `ε = max(0.05, 0.2 − 0.01·feedback_count)` (점차 exploit 비중↑) |
| 다양성 | MMR: `score' = αꞏMatch − (1−α)ꞏmax_{j∈선택됨} sim(act, j)`, α=0.7 — 비슷한 활동 연속 방지 |

#### 2.4.4 폭주 방지(클리핑) 요약

1. 축 EMA 후 `clip([-100,100])`. 2. 축별 base 이탈 `≤40` 하드 클립. 3. 앵커 당김 β=0.05. 4. 태그 `(1−|w|)` 포화항 + `clip([-1,1])`. 5. 단일 세션 내 최대 업데이트 횟수 캡(예: 50회) 후 η 추가 감쇠.

#### 2.4.5 의사코드(전체)

```ts
function applyFeedback(p: UserProfile, act: Activity, liked: boolean): UserProfile {
  const dir = liked ? 1 : -1;
  const eta = 0.20 / (1 + 0.05 * p.feedback_count);

  // 1) 5축 EMA 이동
  let v = p.v_current.map((vi, i) =>
    clamp(vi + eta * dir * (act.v_tag[i] - vi), -100, 100)) as Vec5;

  // 2) 앵커 당김 + 축별 base 이탈 하드 클립
  const beta = 0.05;
  v = v.map((vi, i) => {
    let nv = (1 - beta) * vi + beta * p.v_base[i];
    nv = clamp(nv, p.v_base[i] - 40, p.v_base[i] + 40);
    return clamp(nv, -100, 100);
  }) as Vec5;

  // 3) 태그 가중 강화/약화
  const tw = { ...p.tag_weights };
  for (const chip of act.keyword_chips) {
    const w0 = tw[chip] ?? 0;
    tw[chip] = clamp(w0 + 0.15 * dir * (1 - Math.abs(w0)), -1, 1);
  }

  return { ...p, v_current: v, tag_weights: tw,
           feedback_count: p.feedback_count + 1, updated_at: new Date().toISOString() };
}
```

#### 2.4.6 수치 예시 — 김영자가 "도자기"에 좋아요

`v_current=[50,100,75,−50,−66.7]`, `v_tag(도자기)=[−60,−40,−20,80,−20]`, feedback_count=0 → η=0.20.

축0: 50 + 0.2·(−60−50)=50−22=**28** → 앵커:0.95·28+0.05·50=29.1 → base±40 범위(10~90) OK → 29.1
축3: −50 + 0.2·(80−(−50))=−50+26=**−24** → 앵커 ≈ −22.7 → base −50±40=(−90~−10) 내 OK
→ 한 번 좋아요로 "감상→만들기" 쪽으로 살짝, 그러나 base 앵커가 과이동 차단. 누적 5회 좋아요 시 participation 이 −50→약 −12 까지(클립 −90~−10 경계 근처) 점진 이동.

---

### 2.5 (e) 실행 위치 — Client vs Edge Function vs Postgres

#### 2.5.1 트레이드오프 표

| 연산 | 권장 위치 | 이유 | 대안/주의 |
|---|---|---|---|
| 12문항 → 5축 점수화 | **Client(Expo)** + 서버 검증 | 즉시 피드백, 오프라인 가능, 연산 가벼움 | 서버에서도 동일 함수 재계산해 신뢰 점수 저장(클라 위조 방지) |
| 6유형 분류 | **Client** 1차 + **Edge Function** 확정 | 결과 화면 즉시 표시 후 서버 정본 기록 | 중심값 상수는 서버 환경변수/테이블로 단일 관리 |
| 하드 필터 | **Postgres(SQL where + 인덱스)** | 후보 수백~수천 건을 DB가 가장 빠르게 축소 | region/price/intensity 복합 인덱스 |
| 유사도 점수·정렬 | **Postgres RPC(plpgsql)** 또는 **Edge Function** | 필터된 수십 건만 계산 → DB 안에서 끝내면 왕복 1회 | 활동 수 폭증 시 §2.6 pgvector 로 이행 |
| 피드백 온라인 보정 | **Edge Function**(트랜잭션) | v_current/tag_weights 원자적 갱신 + 동시성 | 단순하면 Postgres RPC 도 가능 |
| 추천 결과 캐싱 | **Postgres 테이블 + 클라 메모리** | 카드 슬라이드 중 재호출 최소화 | TTL/무효화는 아래 |

#### 2.5.2 권장안(MVP)

```
[Client] 진단 입력·1차 점수화·즉시 결과 미리보기
   │ POST /diagnose (raw 12응답)
   ▼
[Edge Function: diagnose]  서버 재계산 → user_profile upsert(v_base,v_current,type,sub)
   │
[Client] 추천 요청 + 제약(지역/예산/시간/강도)
   │ POST /recommend
   ▼
[Edge Function: recommend]
   ├─ call Postgres RPC  recommend_activities(user_id, constraints, limit)
   │     └─ SQL: 하드필터(where+index) → plpgsql 유사도 계산 → order by → limit
   └─ ε 탐색 카드 혼합 + MMR 다양성 → 카드 리스트 반환(+ recommendation_cache 기록)
   │
[Client] 카드 좋아요/싫어요
   │ POST /feedback
   ▼
[Edge Function: feedback]  applyFeedback 트랜잭션 → user_profile 갱신 → 다음 카드 순서 재계산
```

유사도를 Postgres 함수로 둔 예:

```sql
create or replace function match_score(u real[5], a real[5], w real[5])
returns real language sql immutable as $$
  select 100 * (1 - sqrt(
      w[1]*(u[1]-a[1])^2 + w[2]*(u[2]-a[2])^2 + w[3]*(u[3]-a[3])^2
    + w[4]*(u[4]-a[4])^2 + w[5]*(u[5]-a[5])^2
  ) / (200 * sqrt(w[1]+w[2]+w[3]+w[4]+w[5])));
$$;

create or replace function recommend_activities(
  p_user uuid, p_regions text[], p_max_price int,
  p_max_dur int, p_imin int, p_imax int, p_limit int)
returns table(activity_id uuid, score real) language sql stable as $$
  select a.id,
         match_score(up.v_current, a.v_tag, array[1.2,1.1,1.0,0.9,0.8]::real[5]) as score
  from activity a
  cross join (select v_current from user_profile where user_id = p_user) up
  where a.is_active
    and a.region_code = any(p_regions)
    and a.price <= p_max_price
    and a.duration_min <= p_max_dur
    and a.intensity between p_imin and p_imax
  order by score desc
  limit p_limit;
$$;
```

#### 2.5.3 캐싱 전략

| 캐시 | 키 | TTL/무효화 |
|---|---|---|
| 추천 결과 카드 리스트 | (user_id, constraints 해시) | TTL 15분 또는 **피드백 N회(예 5회) 발생 시 무효화** |
| user_profile 5축 | user_id | 피드백/재진단 시 즉시 무효화 |
| 활동 카탈로그 | region_code | 활동 추가/수정 시 무효화(웹훅) |
| 클라 메모리(슬라이드 세션) | 세션 | 25장 prefetch, 스와이프 중 네트워크 0회 목표 |

> 6유형 보너스 매핑(typeGroup)·중심값·가중치는 **DB 설정 테이블 1곳**에서 관리(클라/서버 하드코딩 금지)해 A/B 튜닝 시 배포 없이 변경.

---

### 2.6 (f) Build vs Borrow + 진화 로드맵

#### 2.6.1 자체 구현 권장 근거

| 관점 | 자체 5축 엔진 | 외부 추천 SaaS/대형 ML |
|---|---|---|
| 데이터량 | MVP 콜드스타트(유저·로그 거의 0) → **CF/딥러닝 학습 불가**, 규칙·거리 기반이 정답 | 데이터 굶주림으로 성능 못 냄 |
| 설명가능성 | 5축·유형·보너스로 "왜 추천됐는지" 사용자/B2B 리포트에 설명 가능 | 블랙박스 |
| 비용 | 300만 MVP 예산 내 Supabase 연산만 | 라이선스·호출 비용 부담 |
| 시니어 UX 정합 | 레이더차트·유형카피 등 도메인 맞춤 | 범용, 도메인 핏 약함 |
| 결론 | **자체 구현 채택** (수식 단순·결정적·이식 쉬움) | 차용은 유틸 수준만 |

#### 2.6.2 차용 가능한 경량 라이브러리(유틸만)

| 용도 | 라이브러리 | 비고 |
|---|---|---|
| 벡터/거리·코사인·정규화 | `ml-distance`, `compute-cosine-similarity`, 또는 직접 5줄 구현 | 의존성 최소화 위해 사실상 자체 함수 권장 |
| 통계/표준화(z-score, 분위수) | `simple-statistics` | 임계값 튜닝·분포 분석용 |
| 다양성(MMR)·랭킹 | 직접 구현(수십 줄) | 라이브러리 불필요 |
| 차원축소/시각화(분석용) | `druid`(UMAP/t-SNE, 오프라인 분석) | 운영 경로 아님, 데이터 탐색용 |
| (미래) 임베딩 검색 | Postgres `pgvector` 확장 | §2.6.3 단계서 도입 |

#### 2.6.3 데이터량 임계점 기반 진화 로드맵

```
[현재] 규칙·거리 기반 (5축 유클리드 + 유형 보너스 + 피드백 EMA)  ← MVP, 데이터 0~수천 피드백
   │   임계점 A: 활성 사용자 ≳ 1,000명 & 피드백 로그 ≳ 50,000건
   ▼
[1단계] 협업 필터링(CF) 보강
   - item-item / user-user CF 또는 ALS(암묵 피드백) 추가, 5축 점수와 가중 앙상블
   - 식: FinalScore = γ·(5축 Match) + (1−γ)·(CF score), γ는 데이터량 따라 0.9→0.6
   - "이 활동을 좋아한 사람들이 함께 좋아한 활동" 신규 추천 경로
   │   임계점 B: 활동 카탈로그 ≳ 수천 & 텍스트/이미지 메타 풍부
   ▼
[2단계] 임베딩 + pgvector (콘텐츠 기반 고도화)
   - 활동 설명/이미지를 임베딩 → activity.embedding vector(768) 컬럼, ivfflat 인덱스
   - 사용자 선호 임베딩(좋아한 활동 평균) ↔ 활동 임베딩 ANN 검색
   - 5축은 "설명가능 필터/리랭킹", 임베딩은 "롱테일·뉘앙스 매칭" 으로 역할 분담
   │   임계점 C: 충분한 자연어 데이터 + 비용 정당화
   ▼
[3단계] LLM 활용
   - (a) 활동 자동 태깅: 신규 활동 설명 → LLM이 5축 점수·키워드칩 초안 생성(운영 비용↓)
   - (b) 추천 사유 자연어 생성: "교류를 즐기고 회복이 필요한 당신께 다도 모임을 추천해요" 설명문
   - (c) 대화형 진단 보조: 12문항 외 자유서술 → LLM이 5축 추정치 보정
   - LLM 호출은 Anthropic Claude API(서버 Edge Function에서 키 보관, 클라 직접 호출 금지)
```

> [가정] 임계점 수치(1,000명/50,000건 등)는 통계적 유의성·CF 희소성 경험칙에 기반한 초기 목표치. 실제 로그 희소도(sparsity) 측정 후 조정한다. 각 단계는 **5축 엔진을 대체하지 않고 위에 얹는(앙상블/리랭킹)** 방식이라 설명가능성과 콜드스타트 견고성을 항상 유지한다.

#### 2.6.4 앙상블 환류 다이어그램

```
        ┌──────────────────────────────────────────────┐
        │              FinalScore (0~100)               │
        │  γ·Match(5축)  +  (1−γ)·CF  +  δ·EmbeddingSim  │
        └───────▲───────────────▲────────────────▲──────┘
                │               │                │
        진단 5축+피드백EMA   협업필터링(임계A~)   pgvector ANN(임계B~)
                │
         ←─ LLM 자동 태깅으로 활동 v_tag/칩 품질 향상(임계C~) ─→
```

---

## 3. 디자인 시스템 · 시니어 UX/접근성 (웹·앱 공통 토큰)

이 섹션은 스크린샷의 "파스텔·둥글둥글·손글씨풍·시니어 친화" 스타일을 **단일 디자인 토큰 소스(JSON)** 로 코드화하고, 합의된 기술 스택(Expo / React Native + react-native-web 단일 코드베이스 → 웹 PWA 우선 → 동일 코드로 iOS/Android)에서 **웹·앱이 픽셀 단위로 동일한 디자인**을 갖도록 설계한다. 모든 수치(HEX·px·dp)는 스크린샷에서 직접 추출할 수 없으므로 "스크린샷 스타일에 부합하는 합리적 확정값"으로 제시하며, 원본 측정이 필요한 경우 `[가정]`으로 명시한다.

---

### 3.0 디자인 원칙 (시니어 퍼스트 8원칙)

| # | 원칙 | 구체 규칙 | 근거 |
|---|------|-----------|------|
| P1 | **크게** | 본문 18px↓ 금지(기본 18~20px, 큰글씨 모드 22~26px). 터치 타깃 최소 48×48dp. | 5060 노안·운동정밀도 저하 |
| P2 | **단순하게** | 한 화면 1개 주행동(Primary CTA 1개). 선택지 ≤ 5개. | 선택 피로 감소(제품 차별점) |
| P3 | **명확하게** | 아이콘 단독 금지 → **아이콘+텍스트 병기** 항상. | 픽토그램 해독 부담 |
| P4 | **여유 있게** | 요소 간 최소 간격 12px, 터치 요소 간 8px↑ 분리. | 오클릭 방지 |
| P5 | **부드럽게** | 큰 라운드(12~24px), 강한 그림자 금지(은은한 elevation). | 친근·비위협적 톤 |
| P6 | **대비 강하게** | 본문 텍스트 대비 WCAG AA(4.5:1)↑, 큰글씨 3:1↑. 하이콘트라스트 모드 별도. | 노안·백내장 |
| P7 | **되돌릴 수 있게** | 모든 파괴/제출 동작 직전 확인 + 실행취소(Undo) 또는 뒤로. | 오류 회복 |
| P8 | **알려주며** | 진행률("3/12"), 로딩, 성공/실패를 항상 가시 + 가능 시 TTS 음성 안내. | 상태 인지 |

---

### 3.1 (a) 컬러 팔레트 · 토큰

#### 3.1.1 브랜드/시맨틱 컬러 (Light 기본)

스크린샷 키워드(콘플라워 블루 주, 코랄/살구 포인트, 민트 보조, 오프화이트 배경, 회색 보조)를 9단계 스케일로 확장한다. 9단계를 두는 이유는 호버/프레스/비활성/배경틴트 상태를 토큰으로 파생하기 위함.

```jsonc
// tokens/color.light.json  — 원시(raw) 팔레트 + 시맨틱 별칭
{
  "$scale": {
    // 주색: 콘플라워 블루 (주 버튼/로고)
    "blue/50":  "#EEF3FF",
    "blue/100": "#D9E4FF",
    "blue/200": "#B6CBFF",
    "blue/300": "#8FAEFF",
    "blue/400": "#6E92FB",
    "blue/500": "#5B7CF5",  // ← 브랜드 기준색 (콘플라워 블루) [가정]
    "blue/600": "#4A63D8",  // 호버
    "blue/700": "#3B4FB0",  // 프레스
    "blue/800": "#2E3C84",
    "blue/900": "#1F2A5C",

    // 포인트: 코랄/살구 (리본·강조·기념일 마케팅)
    "coral/50":  "#FFF1ED",
    "coral/100": "#FFDDD3",
    "coral/300": "#FFB3A0",
    "coral/500": "#FF8A6B",  // 코랄 기준 [가정]
    "coral/600": "#F26F4D",
    "apricot/500": "#FFB47A", // 살구(서브 포인트)

    // 보조: 민트 그린 (보조 블록·성공 톤)
    "mint/50":  "#ECFBF4",
    "mint/100": "#CFF3E2",
    "mint/300": "#8FE0BC",
    "mint/500": "#46C58D",  // 민트 기준 [가정]
    "mint/600": "#2FA876",

    // 중립(오프화이트 배경 + 회색 보조)
    "neutral/0":   "#FFFFFF",
    "neutral/50":  "#FAF9F6",  // 오프화이트 배경 [가정]
    "neutral/100": "#F2F0EB",
    "neutral/200": "#E4E1DA",  // 보더
    "neutral/300": "#CBC7BD",
    "neutral/400": "#A8A399",  // placeholder
    "neutral/500": "#7C776D",  // 보조 텍스트
    "neutral/700": "#4A463F",  // 본문 보조
    "neutral/900": "#221F1A",  // 본문 기본(거의 검정, 순흑 회피로 눈부심↓)

    // 상태색
    "red/100": "#FDE3E0", "red/500": "#E5484D", "red/700": "#C2282D", // error
    "amber/100": "#FFF3D6", "amber/500": "#F0A500",                    // warning
    "green/500": "#2FA876",                                            // success(=mint600 정렬)
    "sky/500": "#3B82C4"                                               // info
  },

  "$semantic": {
    "color.brand.primary":        "{blue/500}",
    "color.brand.primaryHover":   "{blue/600}",
    "color.brand.primaryPressed": "{blue/700}",
    "color.brand.onPrimary":      "{neutral/0}",
    "color.brand.point":          "{coral/500}",
    "color.brand.pointSoft":      "{coral/100}",
    "color.brand.accent":         "{mint/500}",

    "color.bg.canvas":     "{neutral/50}",    // 화면 배경 (오프화이트)
    "color.bg.surface":    "{neutral/0}",     // 카드/시트
    "color.bg.subtle":     "{neutral/100}",
    "color.bg.tintBlue":   "{blue/50}",       // 정보 블록
    "color.bg.tintMint":   "{mint/50}",       // 보조 블록

    "color.text.default":  "{neutral/900}",   // 본문
    "color.text.muted":    "{neutral/500}",   // 보조
    "color.text.placeholder":"{neutral/400}",
    "color.text.onPrimary":"{neutral/0}",
    "color.text.link":     "{blue/600}",

    "color.border.default":"{neutral/200}",
    "color.border.strong": "{neutral/300}",
    "color.border.focus":  "{blue/500}",      // 포커스 링

    "color.state.error":   "{red/500}",
    "color.state.errorBg":  "{red/100}",
    "color.state.warning": "{amber/500}",
    "color.state.success": "{green/500}",
    "color.state.info":    "{sky/500}",

    "color.secondaryBtn.bg":  "{neutral/100}", // 보조 버튼(회색)
    "color.secondaryBtn.text":"{neutral/700}",

    // 성향 5축 차트 전용 컬러(레이더/슬라이더 트랙)
    "color.axis.rhythm":   "{coral/500}",   // 활동 리듬
    "color.axis.relation": "{blue/500}",    // 관계 방식
    "color.axis.novelty":  "{mint/500}",    // 경험 선호
    "color.axis.making":   "{apricot/500}", // 참여 방식
    "color.axis.reward":   "#9B7EDE"        // 기대 보상(보라 포인트) [가정]
  }
}
```

#### 3.1.2 대비 검증 (WCAG)

| 전경 / 배경 | 비율(추정) | 본문 AA(4.5) | 큰글씨 AA(3.0) | 비고 |
|---|---|---|---|---|
| `text.default #221F1A` / `bg.canvas #FAF9F6` | ~15.8:1 | ✅ | ✅ | 본문 안전 |
| `onPrimary #FFF` / `brand.primary #5B7CF5` | ~3.6:1 | ❌ | ✅ | **버튼은 14px↑ 큰글씨 굵게만 사용**, 작은 텍스트엔 금지 → 더 진한 `blue/600`(4.0:1) 권장, 본문급 필요 시 `blue/700` |
| `state.error #E5484D` / `bg.surface #FFF` | ~3.9:1 | ⚠️ | ✅ | 에러 텍스트는 `red/700 #C2282D`(~5.9:1) 사용 |
| `text.muted #7C776D` / `bg.canvas` | ~4.6:1 | ✅ | ✅ | 보조 텍스트 통과 |

> **규칙**: 버튼 라벨은 항상 16px↑ Bold로만 사용해 3:1 대비 규정을 만족시키고, 본문급(≤14px) 컬러 텍스트에는 `*/600~700` 단계를 강제한다. 이 검증은 CI에서 자동화한다(3.4.3 참조).

#### 3.1.3 다크 모드 변형

```jsonc
// tokens/color.dark.json — 시맨틱 키는 동일, 값만 교체
{
  "$semantic": {
    "color.bg.canvas":   "#15161A",
    "color.bg.surface":  "#1E2026",
    "color.bg.subtle":   "#272A31",
    "color.bg.tintBlue": "#1C2440",
    "color.bg.tintMint": "#13302A",
    "color.text.default":"#F2F0EB",
    "color.text.muted":  "#A8A399",
    "color.text.placeholder":"#6B675F",
    "color.border.default":"#33363D",
    "color.border.focus":"#8FAEFF",         // 다크에선 밝은 blue/300
    "color.brand.primary":"#7E9BFF",        // 어두운 배경 대비 위해 밝게(blue/300~400)
    "color.brand.onPrimary":"#15161A",      // 밝은 버튼 위 어두운 글자로 대비 확보
    "color.state.error": "#FF8085",
    "color.state.errorBg":"#3A1F22"
  }
}
```

#### 3.1.4 하이콘트라스트 모드 (시니어 핵심 — 별도 테마)

명도 대비를 7:1↑(WCAG AAA 지향)로 끌어올리고, 모든 테두리를 2px 진하게, 파스텔 채도를 낮춘다.

```jsonc
// tokens/color.hc.json
{
  "$semantic": {
    "color.bg.canvas":   "#FFFFFF",
    "color.bg.surface":  "#FFFFFF",
    "color.text.default":"#000000",
    "color.text.muted":  "#1A1A1A",
    "color.brand.primary":"#1B2E8C",     // 진한 블루(대비 ~9:1)
    "color.brand.onPrimary":"#FFFFFF",
    "color.border.default":"#000000",
    "color.border.focus":"#0033CC",
    "color.state.error": "#B00000",
    "$borderWidthScale": 2,              // 모든 보더 2배
    "$shadowDisabled": true              // 그림자 대신 보더로 경계 표현
  }
}
```

테마 전환은 `ThemeProvider`의 `mode: 'light' | 'dark' | 'hc'` 로 단일화하며, OS 설정(`prefers-color-scheme`, `prefers-contrast: more`)을 초기값으로 감지하되 **앱 내 설정에서 사용자가 수동 고정 가능**(시니어는 OS 설정 진입이 어려움).

---

### 3.2 (b) 타이포그래피

#### 3.2.1 폰트 선택

| 용도 | 폰트 | 사유 |
|---|---|---|
| 본문/UI(한글·영문·숫자) | **Pretendard Variable** | 한글 가독성 최상, 가변 weight, OFL 라이선스(상업 무료), 웹/앱 동시 임베드 용이 |
| 숫자(점수·진행률) | Pretendard `tnum`(고정폭 숫자) 기능 | "3/12", 축 점수 정렬 |
| **Feellog 워드마크** | 손글씨풍 디스플레이 폰트(이미지/SVG로 고정) | 본문 가독성과 분리. 워드마크는 **폰트가 아니라 SVG 자산**으로 고정 렌더 → 플랫폼별 폰트 미설치 리스크 제거. 손글씨 느낌 텍스트가 본문에 번지지 않도록 **워드마크 전용** |

> 워드마크 처리 원칙: `Feellog` 로고는 `assets/logo/feellog-wordmark.svg`(blue/500 채움) 단일 자산으로 관리하고, 다크/HC 모드용 변형(`-light.svg`, `-hc.svg`)을 둔다. 손글씨풍은 **로고에만** 쓰고, 화면 타이틀·버튼·본문에는 절대 적용하지 않는다(시니어 가독성 우선).

#### 3.2.2 타입 스케일 (본문 18px 기준, 1.0× / 1.25× / 1.5× 배율 동기화)

배율 토큰 `typeScale ∈ {1.0, 1.25, 1.5}` 를 곱해 큰글씨 모드를 구현한다. lineHeight는 한글 가독성을 위해 본문 **1.6**, 제목 **1.3**을 기준으로 한다. 자간(letterSpacing)은 한글에서 음수 자간이 가독성을 해치므로 0 또는 미세 양수.

```jsonc
// tokens/typography.json  (px, scale=1.0 기준)
{
  "fontFamily": { "base": "Pretendard, -apple-system, system-ui, sans-serif" },
  "scaleSteps": [1.0, 1.25, 1.5],          // 보통 / 큼 / 아주 큼
  "type": {
    "display":   { "size": 32, "lineHeight": 40, "weight": 700, "letterSpacing": -0.2 }, // 결과 "OO형이에요"
    "h1":        { "size": 26, "lineHeight": 34, "weight": 700, "letterSpacing": -0.1 },
    "h2":        { "size": 22, "lineHeight": 30, "weight": 700, "letterSpacing": 0 },
    "title":     { "size": 20, "lineHeight": 28, "weight": 600, "letterSpacing": 0 },
    "bodyLg":    { "size": 20, "lineHeight": 32, "weight": 400, "letterSpacing": 0 },   // 시니어 본문 권장 기본
    "body":      { "size": 18, "lineHeight": 29, "weight": 400, "letterSpacing": 0 },   // 최소 본문
    "label":     { "size": 18, "lineHeight": 24, "weight": 600, "letterSpacing": 0 },   // 버튼 라벨(≥16 규정 충족)
    "caption":   { "size": 16, "lineHeight": 24, "weight": 400, "letterSpacing": 0 },   // 보조(주의: 시니어용 최소 16)
    "number":    { "size": 22, "lineHeight": 28, "weight": 700, "fontFeature": "tnum" } // 점수/진행률
  },
  "rule": "caption(16px) 미만 텍스트 사용 금지. 비활성/장식 외 14px↓ 금지."
}
```

| 토큰 | 1.0× | 1.25× | 1.5× | 사용처 |
|---|---|---|---|---|
| display | 32 | 40 | 48 | 결과 화면 유형명 |
| h1 | 26 | 32 | 39 | 화면 대제목 |
| title | 20 | 25 | 30 | 카드 제목, 섹션 |
| bodyLg | 20 | 25 | 30 | **기본 본문**(설명·문항) |
| body | 18 | 22 | 27 | 최소 본문 |
| label | 18 | 22 | 27 | 버튼/탭 라벨 |
| caption | 16 | 20 | 24 | 칩·메타 |

> 큰글씨 모드에서 레이아웃이 깨지지 않도록 **모든 버튼·카드 높이는 고정값이 아니라 `minHeight + 패딩` + 텍스트 줄바꿈 허용**으로 설계한다(3.3 컴포넌트 규칙).

---

### 3.3 (c) 스페이싱 · 라운드 · 그림자 · 컴포넌트 인벤토리

#### 3.3.1 기본 토큰

```jsonc
// tokens/layout.json
{
  "space": { "0":0, "1":4, "2":8, "3":12, "4":16, "5":20, "6":24, "8":32, "10":40, "12":48, "16":64 },
  "radius": { "sm":8, "md":12, "lg":16, "xl":24, "pill":999, "card":20 },
  "border": { "thin":1, "default":1.5, "thick":2 },
  "size": {
    "touchMin": 48,        // 최소 터치 타깃(dp) — 시니어 규정
    "touchComfort": 56,    // 권장 버튼 높이
    "iconSm": 20, "iconMd": 24, "iconLg": 32,
    "fieldHeight": 56,
    "bottomNavHeight": 72,
    "contentMaxWidth": 480 // 웹 중앙 정렬 모바일폭
  },
  "shadow": {
    "none": "none",
    "sm":  { "x":0, "y":1, "blur":3,  "color":"rgba(34,31,26,0.06)" },
    "md":  { "x":0, "y":4, "blur":12, "color":"rgba(34,31,26,0.08)" }, // 카드(은은하게)
    "lg":  { "x":0, "y":8, "blur":24, "color":"rgba(34,31,26,0.10)" }  // 모달/시트
  },
  "motion": {
    "fast": 120, "base": 200, "slow": 320,
    "easing": "cubic-bezier(0.2, 0.0, 0.2, 1)",
    "reducedMotionRespect": true   // prefers-reduced-motion 시 transition 0
  }
}
```

#### 3.3.2 컴포넌트 인벤토리 (props + 규칙)

각 컴포넌트는 `@feellog/ui` 패키지에서 RN 컴포넌트로 단일 구현(웹은 react-native-web으로 자동 변환). 모든 컴포넌트는 토큰만 참조하고 하드코딩 색/치수 금지.

| 컴포넌트 | 토큰 적용 | 핵심 props | 시니어 규칙 |
|---|---|---|---|
| **Button(Primary)** | bg `brand.primary`, text `onPrimary`, radius `xl`, minHeight `touchComfort(56)` | `variant='primary'\|'secondary'\|'ghost'`, `size='lg'\|'md'`, `iconLeft`, `loading`, `fullWidth`, `onPress` | 라벨 18px Bold + 아이콘 병기, 프레스 시 `brand.primaryPressed` + 스케일 0.98 |
| **Button(Secondary)** | bg `secondaryBtn.bg`, text `secondaryBtn.text`, border `border.default` | 동일 | "둘러보기/건너뛰기"용 |
| **TextField + Error** | height 56, radius `md`, border `border.default`→focus `border.focus`(2px)→error `state.error`(2px) | `label`, `value`, `error`, `helper`, `secure`, `keyboardType`, `leftIcon` | **라벨 항상 표시**(placeholder만 X), 에러는 빨강 텍스트 16px + 아이콘 + (TTS) |
| **Card(활동)** | bg `surface`, radius `card(20)`, shadow `md`, padding `space.4` | `image`, `title`, `chips[]`, `desc`, `onLike`, `onSkip`, `onDetail` | 이미지 16:9 큰 영역, 좋아요/관심없어요 56dp 버튼 |
| **Chip(키워드)** | bg `bg.subtle`, text `text.default`, radius `pill`, padding `8/12` | `label`, `tone='neutral'\|'mint'\|'coral'`, `selected` | 칩도 16px↑, 단독 의미전달 금지 |
| **SegmentSlider(5단계 바)** | 트랙 `border.default`, 활성 노드 `brand.primary`, 5개 노드 | `value(-2..+2)`, `leftLabel`, `rightLabel`, `onChange` | 각 노드 터치 타깃 48dp, 양끝 텍스트 라벨 병기(아이콘 단독 금지) |
| **CompareCard(이미지 2장 비교)** | 2개 카드 radius `lg`, 선택 시 border `brand.primary` 2px + 체크 | `leftImage`, `rightImage`, `selected`, `onSelect` | 각 이미지 카드 전체가 터치 영역, 선택 상태 시각+음성 피드백 |
| **RadarChart(5축)** | 그리드 `border.default`, 폴리곤 `brand.primary` 30% 채움, 축 라벨 16px | `axes[5]{label,value(-100..100)}`, `compareSeries?` | 색만으로 구분 금지 → **각 축 텍스트 라벨 + 수치 병기**, 색약 대응 패턴 옵션 |
| **OnboardingCarousel** | 페이지 dot `brand.primary`/`border.default` | `slides[]`, `onNext`, `onSkip`, `onStart` | 자동 슬라이드 금지(수동), dot 외 "다음으로" 큰 버튼 |
| **BottomNav** | height 72, 활성 `brand.primary`, 비활성 `text.muted` | `items[]{icon,label,route}` | **아이콘+텍스트 항상**, 탭 최대 4~5개, 각 탭 48dp↑ |
| **Badge(뱃지/인증마크)** | bg tone별, radius `pill`, 아이콘+라벨 | `kind='trend'\|'recharge'\|'verified'\|'gamify'`, `label` | 보조성향 배지(트렌드발견/회복충전), 게이미피케이션 인증 |
| **ProgressIndicator** | 트랙 `bg.subtle`, fill `brand.primary`, "n/12" 텍스트 | `current`, `total` | 숫자 + 막대 동시, `number` 토큰(tnum) |
| **Toast/Snackbar(Undo)** | bg `neutral/900`, text `neutral/0`, action `mint/300` | `message`, `actionLabel='실행취소'`, `onAction`, `duration` | 파괴 동작 후 Undo 제공(P7) |

**Button props 예시(TypeScript):**

```tsx
// @feellog/ui/Button.tsx
type ButtonProps = {
  label: string;                       // 필수: 아이콘만으로 표시 금지
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'lg' | 'md';                  // lg=56h, md=48h
  iconLeft?: IconName;                 // 텍스트와 함께만
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityHint?: string;          // TTS 보조 설명
};

// 사용 예
<Button
  label="테스트 시작하기"
  variant="primary"
  size="lg"
  iconLeft="sparkle"
  fullWidth
  onPress={startTest}
  accessibilityHint="12개의 간단한 질문으로 취향을 알아봅니다"
/>
```

**SegmentSlider props 예시:**

```tsx
<SegmentSlider
  value={answers[q.id] ?? 0}          // -2..+2
  leftLabel="익숙하고 편안한 활동"
  rightLabel="새롭고 화제되는 체험"
  steps={['왼쪽 훨씬','왼쪽 조금','비슷','오른쪽 조금','오른쪽 훨씬']}
  onChange={(v) => setAnswer(q.id, v)}
  accessibilityLabel={`${q.text}. 현재 선택: ${stepLabel}`}
/>
```

---

### 3.4 (d) 웹·앱 동일 디자인을 위한 토큰 공유 전략

#### 3.4.1 단일 소스(SSOT) → 멀티 타깃 빌드 파이프라인

```
                          tokens/*.json  (디자이너·개발 공통 편집, Git 버전관리)
                          (color.light / dark / hc / typography / layout)
                                     │
                          ┌──────────┴───────────┐
                          │  Style Dictionary 빌드 │   (npm run tokens:build)
                          └──────────┬───────────┘
            ┌──────────────┬─────────┴───────┬───────────────────┐
            ▼              ▼                 ▼                   ▼
   tokens.ts (RN)   tokens.css (web :root)  tailwind.preset.js   tokens.figma.json
   StyleSheet용     CSS 변수(웹 폴백)        (선택)              (Figma Tokens 플러그인 동기화)
            │              │
            └──────┬───────┘
                   ▼
          @feellog/ui 컴포넌트 (RN + react-native-web)  → 웹 PWA / iOS / Android 동일 렌더
```

- **단일 진실 원천**: `tokens/*.json`. 디자이너(Figma Tokens 플러그인)와 개발이 동일 JSON을 양방향 동기화.
- **빌드 도구**: [Style Dictionary]를 사용해 한 소스에서 RN(`tokens.ts`)·웹(`tokens.css`)·Figma용을 동시 출력. 사람이 손으로 색을 두 곳에 적지 않는다(드리프트 방지).
- 런타임 테마 전환은 `ThemeProvider`가 light/dark/hc 토큰 객체를 context로 주입 → 컴포넌트는 `useTokens()` 훅으로만 값 접근.

**생성된 RN 토큰 사용:**

```ts
// 빌드 산출물 tokens.ts (자동 생성, 수정 금지)
export const tokens = {
  color: { brandPrimary:'#5B7CF5', textDefault:'#221F1A', bgCanvas:'#FAF9F6', /*…*/ },
  type:  { bodyLg:{fontSize:20,lineHeight:32}, /*…*/ },
  space: { s4:16, s6:24 }, radius:{ xl:24, card:20 },
};

// ThemeProvider + 훅
const { color, type, space } = useTokens();        // 현재 모드/배율 반영
const styles = StyleSheet.create({
  cta: { backgroundColor: color.brandPrimary, borderRadius: radius.xl,
         minHeight: 56, paddingHorizontal: space.s6 },
});
```

**웹 폴백(react-native-web가 처리하지 못하는 PWA 메타/스크롤 등):**

```css
/* tokens.css (자동 생성) — PWA 셸·외부 임베드용 */
:root {
  --color-brand-primary:#5B7CF5; --color-bg-canvas:#FAF9F6; --color-text-default:#221F1A;
  --radius-card:20px; --space-4:16px; --font-base:"Pretendard",system-ui,sans-serif;
}
[data-theme="dark"] { --color-bg-canvas:#15161A; --color-text-default:#F2F0EB; /*…*/ }
[data-theme="hc"]   { --color-text-default:#000; --color-brand-primary:#1B2E8C; /*…*/ }
```

> **핵심**: 컴포넌트는 RN 한 벌만 작성. react-native-web가 `<View>`→`<div>`, `StyleSheet`→인라인/클래스로 변환 → "앱 디자인을 웹에도 동일 배포"라는 확정 방향을 코드 한 벌로 보장.

#### 3.4.2 반응형 (모바일 우선 + 웹 데스크톱 확장)

```
[모바일 ≤480px]            [태블릿 481~1024]         [데스크톱 >1024]
┌───────────┐            ┌──────────────────┐     ┌──────────────────────────┐
│  full폭    │            │  중앙 480px 셸    │     │  중앙 480px 셸 + 양옆 패널 │
│  콘텐츠     │            │  + 좌우 여백      │     │  (좌:내비/우:컨텍스트 보조) │
└───────────┘            └──────────────────┘     └──────────────────────────┘
contentMaxWidth=480, 양옆 16px gutter            데스크톱은 모바일 셸 중앙고정 후
                                                  좌측 영구 사이드내비로 BottomNav 대체
```

| 브레이크포인트 | 토큰 | 레이아웃 |
|---|---|---|
| `bp.sm` | < 481px | 1열, BottomNav, full-bleed 카드 |
| `bp.md` | 481–1024px | 중앙 480 셸, BottomNav 유지 |
| `bp.lg` | > 1024px | 중앙 480 셸 + 좌측 SideNav(BottomNav 대체), 배경 캔버스 확장 |

- 디자인은 항상 480px 모바일 셸이 진실. 데스크톱은 그 셸을 **중앙 정렬**하고 주변을 채울 뿐, 컴포넌트 재설계 없음 → 디자인 일관성 + 시니어가 큰 화면에서도 익숙한 모바일 동선 유지.
- 큰글씨 배율과 무관하게 셸 폭 480 고정(가로 스크롤 금지, 세로로 흐름).

#### 3.4.3 토큰 거버넌스/CI

- PR에서 `tokens/*.json` 변경 시 자동: (1) Style Dictionary 빌드, (2) **대비 자동검사**(모든 text/bg 시맨틱 쌍을 WCAG 계산, AA 미달이면 CI 실패), (3) 스냅샷 스토리(Storybook) 시각 회귀.
- 컴포넌트에 raw HEX/px 하드코딩 시 lint 에러(`no-literal-color`, `no-magic-spacing` 커스텀 룰).

---

### 3.5 (e) 시니어 접근성 체크리스트

| 영역 | 항목 | 기준/구현 | 검증 |
|---|---|---|---|
| 터치 | 모든 인터랙티브 타깃 ≥ 48×48dp, 권장 56 | `touchMin/touchComfort` 토큰 강제 | 자동 lint + 수동 측정 |
| 간격 | 터치 요소 간 ≥ 8px 분리 | `space.2`↑ | 디자인 리뷰 |
| 대비 | 본문 ≥ 4.5:1, 큰글씨/UI ≥ 3:1, HC모드 ≥ 7:1 | 3.4.3 CI 대비검사 | 자동 |
| 글자크기 | 기본 18~20px, 1.0/1.25/1.5 배율 조절 | 설정 화면 슬라이더 + OS 다이나믹 타입 연동(`allowFontScaling`) | 수동 |
| 큰글씨 모드 | 배율 변경 시 레이아웃 무너짐 없음(줄바꿈·minHeight) | 고정 height 금지 규칙 | 스냅샷(1.5× 스토리) |
| 라벨 | 아이콘+텍스트 병기, 버튼 동사 명확("입장하기"는 OK, 추상어 X) | P3 강제 | 카피 리뷰 |
| 스크린리더 | 모든 컴포넌트 `accessibilityLabel/Role/Hint`, 포커스 순서 논리적 | RN a11y props + 웹 ARIA(자동 매핑) | VoiceOver/TalkBack/NVDA |
| TTS 음성안내 | 문항·결과·에러 음성 읽기 옵션(시니어 핵심) | `expo-speech`로 문항/결과/에러 메시지 낭독 토글 | 수동 |
| 포커스 | 키보드 포커스 링 2px `border.focus`, 웹 `:focus-visible` | 토큰 적용 | 키보드 탭 테스트 |
| 동선 | 한 화면 1주행동, 뒤로가기 항상, 최대 깊이 3 | IA 규칙 | UT |
| 오류회복 | 인라인 에러 + 해결 방법 안내 + Undo, 파괴동작 확인 | TextField error + Toast Undo | UT |
| 모션 | `prefers-reduced-motion` 시 애니메이션 제거, 자동재생 캐러셀 금지 | `motion.reducedMotionRespect` | 설정 테스트 |
| 입력 | 숫자/전화 키패드 자동, 자동대문자 OFF, 비밀번호 보기 토글 | TextField props | 수동 |
| 색 의존 | 색만으로 정보 전달 금지(에러=색+아이콘+텍스트, 차트=색+라벨) | 컴포넌트 규칙 | 색약 시뮬레이션 |
| 언어 | 한국어 1차, 쉬운 문장(외래어·전문용어 최소화) | 카피 가이드 | 리뷰 |
| 타임아웃 | 세션/입력 시간 제한 없음 또는 충분히 길게 + 연장 안내 | 설정 | 수동 |

**접근성 props 예시:**

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="입장하기"
  accessibilityHint="입력한 아이디로 로그인합니다"
  accessibilityState={{ disabled: loading }}
  style={{ minWidth:48, minHeight:56 }}
  onPress={login}
/>

// 에러: 색 + 아이콘 + 텍스트 + 스크린리더 라이브 영역
<View accessibilityLiveRegion="polite">
  {error && (
    <Row>
      <Icon name="alert" color={color.stateError} size={20}/>
      <Text style={{color: color.stateError, fontSize:16}}>{error}</Text>
    </Row>
  )}
</View>
```

---

### 3.6 (f) 핵심 화면 와이어프레임 (ASCII, 480px 셸 기준)

#### 3.6.1 로그인

```
┌──────────────────────────────┐
│                              │
│           Feellog            │  ← 손글씨풍 워드마크(SVG, blue/500)
│      취미를 찾고 기록하는 곳     │  ← bodyLg, text.muted
│                              │
│  아이디                        │  ← label 항상 표시
│  ┌────────────────────────┐  │
│  │ 아이디를 입력하세요         │  │  56h, radius md
│  └────────────────────────┘  │
│  비밀번호                       │
│  ┌────────────────────────┐  │
│  │ ••••••••           [👁 보기]│ │
│  └────────────────────────┘  │
│  ⚠ 비밀번호가 일치하지 않아요     │  ← red/700 16px + 아이콘(에러 시)
│                              │
│  ┌────────────────────────┐  │
│  │        입장하기           │  │  ← Primary 56h, blue/500
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │        둘러보기           │  │  ← Secondary(회색)
│  └────────────────────────┘  │
│   ──────  간편 로그인  ──────   │
│   [💬 카카오] [ Apple] [G 구글] │  ← 각 48dp↑, 아이콘+텍스트
└──────────────────────────────┘
```

#### 3.6.2 온보딩 캐러셀 (3장 중 1장)

```
┌──────────────────────────────┐
│                    [건너뛰기]  │  ← 우상단 보조(ghost)
│                              │
│        ╭──────────╮           │
│        │  ✂ 🏺 🎨   │          │  ← 라인 일러스트(가위/도자기/그림)
│        ╰──────────╯           │
│                              │
│   새로운 즐거움, Feellog와 함께   │  ← h1
│   취미를 찾고, 기록하고, 나누는    │  ← bodyLg, text.muted
│   공간                        │
│                              │
│           ● ○ ○              │  ← 페이지 dot(현재=blue/500)
│  ┌────────────────────────┐  │
│  │        다음으로           │  │  ← Primary (마지막 장=시작하기)
│  └────────────────────────┘  │
└──────────────────────────────┘
```

#### 3.6.3 성향 테스트 문항 (12문항 / 이미지 2장 비교 + 5단계 바)

```
┌──────────────────────────────┐
│ [←]            3 / 12         │  ← 뒤로 + 진행(number tnum)
│ ▓▓▓▓░░░░░░░░  (ProgressBar)    │
│                              │
│  활동할 때 더 끌리는 방식은?       │  ← title 20px, 질문
│                              │
│ ┌───────────┐ ┌───────────┐  │
│ │           │ │           │  │  ← CompareCard(좌/우 이미지)
│ │  [직접만들기] │ │ [감상하기]   │ │     선택 시 blue 2px 보더+✓
│ │    이미지    │ │   이미지     │ │
│ └───────────┘ └───────────┘  │
│                              │
│  직접 만들기            감상하기   │  ← 양끝 텍스트 라벨(병기)
│  ●────●────●────●────●        │  ← SegmentSlider 5단계(48dp 노드)
│ 훨씬  조금  비슷  조금  훨씬       │
│                              │
│  ┌────────────────────────┐  │
│  │        다음 문항          │  │  ← Primary (선택 전 disabled)
│  └────────────────────────┘  │
│         🔊 문항 읽어주기         │  ← TTS 토글(ghost)
└──────────────────────────────┘
```

#### 3.6.4 결과 화면 (유형 + 보조성향 배지 + 5축 레이더 + 추천)

```
┌──────────────────────────────┐
│ [←]   나의 취향 결과            │
│                              │
│   당신은 손끝 성취형이에요! 🎉    │  ← display 32px
│   직접 만들고 완성하는 즐거움      │  ← bodyLg muted
│                              │
│   [🌱 회복충전]  [🔨 인증마크]    │  ← 보조성향/뱃지(pill)
│                              │
│        활동리듬                │
│          ▲                   │
│   기대보상 ╱ ╲ 관계방식          │  ← RadarChart(5축)
│        │ ◆◆◆ │                │     폴리곤 blue 30%
│   참여방식 ╲ ╱ 경험선호          │     각 축 라벨+수치 병기
│          ▼                   │
│   활동리듬 -5 · 관계방식 -5      │  ← 수치 텍스트 병기(색의존 X)
│   경험선호 +25 · 참여방식 +25    │
│   기대보상 0                   │
│                              │
│   ── 추천 클래스 ──             │
│  ┌────────────────────────┐  │
│  │ [🖼] 목공 클래스           │  │  ← 추천 썸네일 리스트
│  │  #만들기 #결과물 #성취      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ [🖼] 터프팅 / 베이킹       │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │     추천 더 보기           │  │  ← Primary
│  └────────────────────────┘  │
└──────────────────────────────┘
```

#### 3.6.5 카드 추천 피드 (활동카드 스와이프 — 테스트 완료 사용자 홈)

```
┌──────────────────────────────┐
│  오늘의 추천            1 / 25  │  ← 진행 표시(number)
│                              │
│  ╔════ ← 밀어서 관심없어요 ════╗ │  ← 첫 사용 시 스와이프 안내 크게
│  ║ ┌──────────────────────┐ ║ │     (이후엔 작게/숨김)
│  ║ │                      │ ║ │
│  ║ │     활동 이미지         │ ║ │  ← 16:9 큰 이미지
│  ║ │                      │ ║ │
│  ║ ├──────────────────────┤ ║ │
│  ║ │ 목공 클래스             │ ║ │  ← title
│  ║ │ [만들기][차분한몰입]     │ ║ │  ← 키워드 칩
│  ║ │ [결과물 만족]           │ ║ │
│  ║ │ 손끝으로 완성하는 나만의   │ ║ │  ← 1줄 설명 bodyLg
│  ║ │ 작품을 만들어요          │ ║ │
│  ║ └──────────────────────┘ ║ │
│  ╚══ 밀어서 좋아요 → ════════╝ │
│                              │
│  ┌────────┐  ┌──────────┐    │
│  │ ✕ 관심없어요│  │ ♡ 좋아요   │   │  ← 56dp 큰 버튼(스와이프 대체)
│  └────────┘  └──────────┘    │
│  [📋 상세보기] [📍 지도] [🔗 예약] │  ← 아이콘+텍스트 병기
│ ───────────────────────────  │
│  [🏠홈] [🔍탐색] [📝기록] [👥모임] │  ← BottomNav(아이콘+라벨, 48dp)
└──────────────────────────────┘
```

> 와이어프레임 공통: 모든 화면은 480px 셸 안에서 세로 흐름, 하단 Primary CTA는 화면 폭 가득(`fullWidth`), 진행/상태는 항상 가시, 아이콘에는 텍스트가 붙는다. 홈은 "테스트 미완료=테스트 시작하기 / 완료=카드 추천 피드"로 분기(시안 IA 메모 반영).

---

### 3.7 구현 산출물 요약(이 섹션의 디자인 시스템이 만드는 것)

| 산출물 | 경로(제안) | 비고 |
|---|---|---|
| 토큰 소스 | `tokens/*.json` | SSOT, Git 관리 |
| 빌드 산출물 | `packages/tokens/dist/{tokens.ts, tokens.css, figma.json}` | 자동 생성, 수정 금지 |
| UI 컴포넌트 | `packages/ui/*` | RN 단일 구현 → 웹/앱 공용 |
| 테마 | `ThemeProvider`(light/dark/hc) + `useTokens()`/`useTypeScale()` | OS 감지 + 수동 고정 |
| 폰트 자산 | `assets/fonts/Pretendard*`, `assets/logo/feellog-wordmark*.svg` | 워드마크는 SVG 고정 |
| 스토리북 | `apps/storybook` (1.0×/1.5×, light/dark/hc 매트릭스) | 시각 회귀 + a11y 애드온 |
| CI 검사 | 대비검사·하드코딩 lint·스냅샷 | 토큰 드리프트/AA위반 차단 |

---

## 4. 데이터 모델 · 화면/기능 명세 · API

> 본 섹션은 합의된 기술 결정(Expo + react-native-web 단일 코드베이스, Supabase Postgres/Auth/Storage/Realtime/Edge Functions, 자체 5축 벡터 추천, 카카오/Apple/Google/이메일 인증, 카카오맵, 국내 PG)을 단일 진실 원천으로 삼아, 화면 인벤토리 → DB 스키마 → 홈 상태 분기 → API/RPC → 분석 이벤트 순으로 구현 가능한 수준까지 상세화한다. 모든 5축 점수는 **사용자·활동 모두 `-100 ~ +100` 스케일로 통일**하고, 유형 중심 벡터(`-25~+25` 초안)는 적재 시 4배 스케일링하여 동일 좌표계에서 매칭한다(자세한 식은 (d) 추천 RPC 참조).

---

### 4.0 공통 설계 원칙 (시니어 친화 · 데이터 일관성)

| 원칙 | 적용 |
|---|---|
| 5축 정규화 | 모든 점수 컬럼은 `smallint CHECK (col BETWEEN -100 AND 100)`. 컬럼명 `axis_rhythm`(활동리듬), `axis_relation`(관계방식), `axis_experience`(경험선호), `axis_participation`(참여방식), `axis_reward`(기대보상)로 전 테이블 통일 |
| 표기 흔들림 흡수 | "경험방식=경험선호", "만족방식=참여방식", "추구가치=기대보상"은 모두 위 5컬럼으로 매핑(스크린샷 명칭 차이 무시) |
| 접근성 | `users.font_scale`(글자 크기), `users.high_contrast`, `users.reduce_motion` 등 시니어 설정을 DB에 영속화하여 웹/앱 동일 적용 |
| 멱등성 | 외부 연동(예약/결제/뱃지)은 `idempotency_key`로 중복 방지 |
| RLS 기본 | 모든 사용자 데이터 테이블은 RLS `ENABLE` + `FORCE`, `auth.uid()` 기반 정책. 공개 카탈로그(activities/test_questions 등)는 읽기 공개 |
| 소프트 삭제 | 사용자 콘텐츠는 `deleted_at timestamptz`로 소프트 삭제(법적 보관·복구) |

---

### 4.1 (a) 전체 화면 인벤토리

각 화면은 **목적 / 주요 컴포넌트 / 주요 액션 / 상태(state machine 또는 로딩·빈·에러)** 로 명세한다. 라우트는 Expo Router 규약(`app/...`) 기준.

#### 4.1.1 인증 · 온보딩 영역

| # | 화면 (라우트) | 목적 | 주요 컴포넌트 | 주요 액션 | 상태 |
|---|---|---|---|---|---|
| S01 | 로그인 `app/(auth)/login` | 재방문 사용자 입장, 신규 유입 둘러보기 | Feellog 워드마크, 아이디/비번 입력(대형), `[입장하기]`(콘플라워 블루 주버튼), `[둘러보기]`(보조), 간편로그인(카카오/Apple/Google) 버튼, 인라인 에러(빨강) | 로그인 시도, 소셜 OAuth, 게스트 둘러보기, 비번찾기 이동 | `idle → submitting → error(인라인) / success(→홈 라우터)` |
| S02 | 회원가입 `app/(auth)/signup` | 이메일 가입 (소셜은 콜백 자동 생성) | 이메일/비번/닉네임, 만 14세+·약관 체크, 마케팅 수신 동의(선택) | 가입 제출, 약관 모달 열기 | `idle → validating → submitting → error / success(→온보딩)` |
| S03 | 소셜 콜백 `app/(auth)/callback` | OAuth 리다이렉트 처리, 신규 여부 판별 | 스피너, "프로필 생성 중" | 자동: 세션 확정 → `users` upsert → 분기 | `processing → newUser(→온보딩) / returning(→홈)` |
| S04 | 온보딩 1 `app/(onboard)/intro/0` | 가치 소구 1 | 일러스트, "새로운 즐거움 Feellog와 함께 / 취미를 찾고, 기록하고, 나누는 공간", 인디케이터(●○○), `[다음으로]`/`[건너뛰기]` | 다음, 건너뛰기(→S07 또는 홈) | 정적 |
| S05 | 온보딩 2 `.../1` | "함께 나누는 즐거움, 취향 공동체" | 동일 레이아웃(●●○) | 다음, 건너뛰기 | 정적 |
| S06 | 온보딩 3 `.../2` | "나만의 속도로 즐기는 기록" | 동일(●●●), `[시작하기]`(주버튼) | 시작하기 → 권한/위치 동의 → 홈 | 정적 |

#### 4.1.2 성향 진단 영역

| # | 화면 | 목적 | 주요 컴포넌트 | 주요 액션 | 상태 |
|---|---|---|---|---|---|
| S07 | 테스트 인트로 `app/(test)/intro` | 테스트 시작 안내(12문항·약 3분) | 일러스트, 진행 안내, `[테스트 시작하기]` | 시작, 나중에(홈으로) | 정적 |
| S08 | 문항 `app/(test)/q/[n]` (1~12) | 이미지 2장 비교 + 5단계 바 응답 | 좌/우 이미지(대형 터치), 5단계 세그먼트 바("왼쪽 훨씬/조금·비슷·오른쪽 조금/훨씬"), 상단 **진행바 n/12**, `[이전]`/`[다음]` | 5단계 중 택1(-2~+2), 다음/이전, 이미지 확대 | `unanswered → answered → next`. 중도 이탈 시 로컬+서버 임시 저장(resume) |
| S09 | 채점 로딩 `app/(test)/scoring` | 12응답 → 5축+보조+유형 산출 동안 대기 | 부드러운 로딩 애니메이션, "당신의 취향을 분석 중" | 자동 `submit_test` RPC 호출 | `computing → done(→결과) / error(재시도)` |
| S10 | 결과 `app/(test)/result` | 유형 발표 + 레이더 + 추천 진입 | "당신은 **OO형**이에요!", 보조성향 배지(트렌드발견/회복충전 0~1), **5축 레이더 차트**, 유형 설명, 추천 클래스 썸네일 리스트, `[추천 더 보기]` `[결과 공유]` | 카드 피드 진입, 공유(딥링크), 재검사 | `loaded`. 공유 시 OG 이미지 생성 |

#### 4.1.3 홈 · 추천 영역

| # | 화면 | 목적 | 주요 컴포넌트 | 주요 액션 | 상태 |
|---|---|---|---|---|---|
| S11 | 홈 `app/(tabs)/index` | **상태 분기 허브**(처음=테스트 강제 / 완료=카드 추천 메인) | (A 신규)대형 `[테스트 시작하기]` 히어로 / (B 완료)카드 추천 캐러셀, 유형 요약 배지, 빠른 진입(커뮤니티·기록), 알림 벨 | 분기에 따른 진입, 새로고침 | `loading → variantA(no profile) / variantB(has profile)` (§4.3) |
| S12 | 카드 추천 피드 `app/(reco)/feed` | 스와이프로 좋아요/관심없음/선택, 실시간 재랭킹 | 활동 이미지 카드, 키워드 칩(만들기/차분한 몰입/결과물 만족 등), 1줄 설명, `[좋아요]`/`[관심없어요]`, `[상세보기]`/`[지도]`/`[예약]`, **진행표시 "1/25"**, 첫 진입 시 좌우 스와이프 코치마크(대형)+`[알아보기]` | 스와이프 좌/우, 버튼 탭, 상세 진입 | `coachmark(첫방문) → browsing → cardReaction(→재랭킹) → empty(소진 시 새 묶음 로드)` |
| S13 | 활동 상세 `app/activity/[id]` | 활동 정보·업체·예약 진입 | 이미지 갤러리, 5축 적합도 미니 레이더, 키워드 칩, 설명, **카카오맵 지도**(업체 핀), 가격/소요시간/난이도, `[예약하기]`/`[찜]`/`[공유]`, 후기 | 예약 시작, 찜, 지도 길찾기, 공유 | `loading → loaded / error`. 예약: `→ 예약 시작 RPC → PG/외부링크` |
| S14 | 검색·필터 `app/(tabs)/search` | 지역·예산·시간·강도 하드필터 + 키워드 | 검색바, 필터 칩(지역/가격대/소요시간/신체강도/카테고리), 결과 리스트(카드), 정렬(추천순/거리순/가격순) | 필터 적용, 검색, 결과 탭 | `idle → searching → results / empty` |

#### 4.1.4 커뮤니티 영역

| # | 화면 | 목적 | 주요 컴포넌트 | 주요 액션 | 상태 |
|---|---|---|---|---|---|
| S15 | 커뮤니티 홈 `app/(tabs)/community` | 피드/동행모집/기록 탭 허브 | 상단 세그먼트(피드·동행모집·내 기록), 글 카드 리스트, `[글쓰기 FAB]` | 탭 전환, 글 작성, 무한 스크롤 | `loading → feed / empty` |
| S16 | 글 작성 `app/community/compose` | 활동 기록·후기 작성 | 이미지 업로더(Storage), 본문, 활동 태그 연결, 공개범위 | 게시, 임시저장, 활동 연결 | `editing → posting → done` |
| S17 | 글 상세 `app/community/[postId]` | 본문·댓글·반응 | 이미지, 본문, 좋아요, 댓글 스레드, 작성자 프로필 | 댓글 작성, 좋아요, 신고, 동행 참여(해당 시) | `loading → loaded` |
| S18 | 동행모집 상세 `app/companion/[id]` | 함께 갈 동행 모집/참여 | 활동·일시·장소·정원·현재인원, 참여자 아바타, `[참여하기]`/`[모집마감]` | 참여/취소, 채팅 진입, 마감(작성자) | `open → joining → full / closed` |
| S19 | 내 기록(타임라인) `app/(tabs)/community?tab=log` | 개인 활동 기록 모음 | 월별 타임라인, 활동 썸네일, 뱃지 진척 | 기록 보기/편집 | `loaded / empty` |

#### 4.1.5 프로필 · 게이미피케이션 · 시스템

| # | 화면 | 목적 | 주요 컴포넌트 | 주요 액션 | 상태 |
|---|---|---|---|---|---|
| S20 | 프로필 `app/(tabs)/profile` | 내 유형·활동·뱃지·팔로우 요약 | 아바타, 유형 배지+레이더, 뱃지 그리드, 기록 수/동행 수, 팔로워/팔로잉, `[프로필 편집]` | 편집, 뱃지 상세, 팔로우 목록 | `loaded` |
| S21 | 뱃지/게이미피케이션 `app/badges` | 뱃지 도감·획득 조건·인증마크 | 뱃지 카드 그리드(획득/미획득), 진척 바, 동행 인증마크 | 뱃지 상세 모달, 공유 | `loaded`. 신규 획득 시 축하 모달 |
| S22 | 알림 `app/notifications` | 추천·동행·댓글·뱃지·예약 알림 | 알림 리스트(유형 아이콘), 읽음 처리 | 항목 탭(딥링크), 모두 읽음 | `loading → list / empty`. Realtime 구독 |
| S23 | 설정 `app/settings` | 접근성·계정·알림 설정 | **글자 크기 슬라이더**, 고대비/모션 줄이기 토글, 알림 채널 토글, 로그아웃, 회원탈퇴, 약관 | 설정 변경(즉시 반영+서버 저장), 로그아웃 | `loaded`. 변경 즉시 낙관적 적용 |
| S24 | 예약 내역 `app/reservations` | 진행/완료 예약 관리 | 예약 카드(상태 배지), 예약취소, 후기 작성 유도 | 상세, 취소, 후기 | `loaded / empty` |

> 글로벌: 하단 탭바(홈·검색·커뮤니티·프로필) 대형 아이콘+라벨, 상단 알림 벨. 모든 텍스트는 `font_scale` 반영. 게스트("둘러보기")는 읽기 전용 + 액션 시 로그인 유도 시트.

---

### 4.2 (b) Postgres 스키마 (DDL 스케치 + 인덱스 + RLS)

> 전제: `auth.users`(Supabase 관리)가 존재. 아래 `public.users`는 1:1 프로필 확장. `enum`/`extension`/공통 함수 먼저 선언.

```sql
-- ===== 확장 & 공통 =====
create extension if not exists pgcrypto;     -- gen_random_uuid
create extension if not exists postgis;      -- 위치(지도/거리) [가정: 거점 거리정렬 위해]
-- create extension if not exists vector;    -- 미래 pgvector(임베딩 추천 고도화)

-- 5축을 한 곳에서 재사용하기 위한 도메인
create domain axis_score as smallint check (value between -100 and 100);

-- 메인 6유형
create type main_type as enum (
  'active_explorer',   -- 활력 탐험형
  'calm_immersion',    -- 고요 몰입형
  'handcraft_achiever',-- 손끝 성취형
  'warm_social',       -- 따뜻한 교류형
  'life_upgrade',      -- 생활 업그레이드형
  'culture_enjoyer'    -- 문화 향유형
);
create type sub_trait as enum ('trend_discovery', 'recovery_charge'); -- 트렌드발견/회복충전
create type reaction_kind as enum ('like', 'dislike', 'select');
create type reservation_status as enum ('pending','confirmed','cancelled','completed','failed');
create type notif_type as enum ('reco','companion','comment','badge','reservation','system');

-- updated_at 자동 갱신
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
```

#### 4.2.1 사용자 · 취향 프로필

```sql
-- 사용자(프로필 확장). PK는 auth.users.id 그대로 사용
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  nickname      text not null check (char_length(nickname) between 1 and 30),
  avatar_url    text,
  birth_year    smallint check (birth_year between 1900 and 2025),
  region_code   text,                         -- 시군구 코드(필터)
  -- 시니어 접근성 설정(웹/앱 동일 적용)
  font_scale    numeric(3,2) not null default 1.00 check (font_scale between 0.8 and 2.0),
  high_contrast boolean not null default false,
  reduce_motion boolean not null default false,
  -- 홈 분기 핵심 플래그 (§4.3)
  has_taste_profile boolean not null default false,
  onboarding_done   boolean not null default false,
  marketing_opt_in  boolean not null default false,
  role          text not null default 'member' check (role in ('member','partner','admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create trigger trg_users_updated before update on public.users
  for each row execute function set_updated_at();

-- 취향 프로필(테스트 결과 스냅샷 + 피드백 보정 후 누적). 1 user : N (이력 보존, 최신 1개 active)
create table public.taste_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  -- 5축(정규화 -100~100). 초기값=테스트 산출, 이후 카드 반응으로 온라인 보정
  axis_rhythm        smallint not null check (axis_rhythm between -100 and 100),
  axis_relation      smallint not null check (axis_relation between -100 and 100),
  axis_experience    smallint not null check (axis_experience between -100 and 100),
  axis_participation smallint not null check (axis_participation between -100 and 100),
  axis_reward        smallint not null check (axis_reward between -100 and 100),
  -- 보조 성향 점수(0~100) + 선택된 보조성향(0~1개)
  sub_trend_score    smallint not null default 0 check (sub_trend_score between 0 and 100),
  sub_recovery_score smallint not null default 0 check (sub_recovery_score between 0 and 100),
  sub_trait          sub_trait,           -- null=없음
  main_type          main_type not null,  -- 최근접 중심 분류 결과
  type_distance      real,                -- 분류 시 중심과의 거리(신뢰도 표시용)
  source             text not null default 'test', -- 'test' | 'feedback_adjusted'
  is_active          boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_tp_updated before update on public.taste_profiles
  for each row execute function set_updated_at();
-- user당 active 1개만
create unique index uq_active_profile on public.taste_profiles(user_id)
  where is_active;
create index ix_tp_user on public.taste_profiles(user_id);
```

#### 4.2.2 진단 콘텐츠 · 응답

```sql
-- 12문항 정의(콘텐츠. axis_key + 보조성향 기여 + 좌/우 이미지)
create table public.test_questions (
  id            int primary key,            -- 1..12 (Q번호)
  order_no      smallint not null,
  axis_key      text not null check (axis_key in
                 ('rhythm','relation','experience','participation','reward')),
  -- 보조성향 기여(Q1/Q6/Q11→trend, Q5/Q9/Q11→recovery). Q11은 둘 다 영향
  affects_trend    boolean not null default false,
  affects_recovery boolean not null default false,
  -- +값이 어느 극인지(예: experience에서 +2가 '새로움'이면 polarity_right='new')
  prompt_text   text not null,
  left_label    text not null,
  right_label   text not null,
  left_image_url  text not null,
  right_image_url text not null,
  -- 이 문항 점수가 5축에 가산될 때의 부호/가중(보통 +1). 일부 보강문항 가중 조정
  axis_weight   numeric(3,2) not null default 1.00,
  is_active     boolean not null default true
);

-- 응답 옵션(5단계 바)은 고정 스케일이라 값만 저장하므로 옵션 테이블은 라벨 메타로만 사용
create table public.test_options (
  value   smallint primary key check (value between -2 and 2), -- -2,-1,0,1,2
  label   text not null   -- '왼쪽 훨씬','왼쪽 조금','비슷','오른쪽 조금','오른쪽 훨씬'
);

-- 사용자 응답(세션 단위). 재검사 이력 보존
create table public.test_responses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  session_id    uuid not null,            -- 한 번의 테스트 = 한 session_id
  question_id   int not null references public.test_questions(id),
  value         smallint not null references public.test_options(value), -- -2~+2
  answered_at   timestamptz not null default now(),
  unique (user_id, session_id, question_id)   -- 문항 1회 응답
);
create index ix_resp_session on public.test_responses(user_id, session_id);
```

#### 4.2.3 활동(클래스) · 태그 · 체험처 · 이미지

```sql
-- 체험처(파트너)
create table public.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  region_code text,
  address     text,
  geo         geography(point,4326),      -- 카카오맵 핀/거리
  phone       text,
  booking_url text,                       -- 외부 예약링크(초기 MVP)
  commission_rate numeric(4,3) default 0.125, -- 10~15%
  status      text not null default 'active' check (status in ('active','paused')),
  created_at  timestamptz not null default now()
);
create index ix_partners_geo on public.partners using gist (geo);

-- 활동(클래스)
create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid references public.partners(id) on delete set null,
  title       text not null,
  summary     text,                       -- 카드 1줄 설명
  description text,
  category    text,                       -- 트레킹/도자기/목공/다도/전시...
  keywords    text[] not null default '{}', -- 키워드 칩: {만들기,차분한 몰입,결과물 만족}
  -- 하드필터용 메타
  price       int,                        -- 원
  duration_min int,                       -- 소요시간(분)
  intensity   smallint check (intensity between 0 and 3), -- 신체강도 0~3
  region_code text,
  geo         geography(point,4326),
  thumbnail_url text,
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_act_updated before update on public.activities
  for each row execute function set_updated_at();
create index ix_act_filter on public.activities(region_code, price, duration_min, intensity)
  where is_published;
create index ix_act_keywords on public.activities using gin (keywords);

-- 활동 5축 태그(활동:1:1, 추천 매칭의 핵심). 별도 테이블로 분리해 버저닝 용이
create table public.activity_tags (
  activity_id uuid primary key references public.activities(id) on delete cascade,
  axis_rhythm        smallint not null check (axis_rhythm between -100 and 100),
  axis_relation      smallint not null check (axis_relation between -100 and 100),
  axis_experience    smallint not null check (axis_experience between -100 and 100),
  axis_participation smallint not null check (axis_participation between -100 and 100),
  axis_reward        smallint not null check (axis_reward between -100 and 100),
  -- 보조성향 가산(분위기 보정용 0~100)
  trend_affinity    smallint not null default 0 check (trend_affinity between 0 and 100),
  recovery_affinity smallint not null default 0 check (recovery_affinity between 0 and 100),
  updated_at  timestamptz not null default now()
);
-- 예: 트레킹 (80,20,70,20,10), 도자기 (-60,-40,-20,80,-20) ...

create table public.activity_images (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  url         text not null,
  order_no    smallint not null default 0
);
create index ix_actimg on public.activity_images(activity_id, order_no);

-- 6유형 중심 벡터(추천 분류/방향 기준). -25~25 초안을 4x 스케일해 -100~100로 저장
create table public.type_centroids (
  main_type   main_type primary key,
  axis_rhythm        smallint not null,
  axis_relation      smallint not null,
  axis_experience    smallint not null,
  axis_participation smallint not null,
  axis_reward        smallint not null
);
-- 시드 예: active_explorer = (100,20,20,0,0)  [= +25,+5,+5,0,0 의 4배]
```

#### 4.2.4 추천 · 카드 반응 · 예약

```sql
-- 카드 반응(좋아요/싫어요/선택) — 온라인 보정 입력
create table public.reactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  kind        reaction_kind not null,
  context     text default 'feed',   -- feed/detail/search
  created_at  timestamptz not null default now(),
  unique (user_id, activity_id)      -- 활동당 최종 반응 1개(upsert로 갱신)
);
create index ix_react_user on public.reactions(user_id, created_at desc);

-- 추천 결과 캐시/이력(재현·분석). 재랭킹마다 새 batch
create table public.recommendations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  batch_id    uuid not null,
  rank        smallint not null,
  match_score real not null,         -- 0~100 (5축 유사도 기반)
  reason      jsonb,                 -- {top_axis:'participation', main_type:'handcraft_achiever'}
  is_explore  boolean not null default false, -- 탐색용 카드 여부
  created_at  timestamptz not null default now()
);
create index ix_reco_user_batch on public.recommendations(user_id, batch_id, rank);

-- 예약(초기: 외부링크/오프 매칭, 이후 PG 결제 연동)
create table public.reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  partner_id  uuid references public.partners(id),
  status      reservation_status not null default 'pending',
  scheduled_at timestamptz,
  headcount   smallint default 1,
  amount      int,                  -- 결제금액
  pg_provider text,                 -- 'toss'|'portone'|'external_link'
  pg_tx_id    text,
  idempotency_key text unique,      -- 중복 결제 방지
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_resv_updated before update on public.reservations
  for each row execute function set_updated_at();
create index ix_resv_user on public.reservations(user_id, status);
```

#### 4.2.5 커뮤니티 · 동행 · 게이미피케이션 · 알림

```sql
create table public.community_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.users(id) on delete cascade,
  kind        text not null default 'feed' check (kind in ('feed','log','companion')),
  activity_id uuid references public.activities(id),  -- 연결 활동(선택)
  title       text,
  body        text,
  image_urls  text[] not null default '{}',
  visibility  text not null default 'public' check (visibility in ('public','followers','private')),
  like_count    int not null default 0,
  comment_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create trigger trg_post_updated before update on public.community_posts
  for each row execute function set_updated_at();
create index ix_post_feed on public.community_posts(kind, created_at desc) where deleted_at is null;
create index ix_post_author on public.community_posts(author_id) where deleted_at is null;

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  author_id   uuid not null references public.users(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade, -- 대댓글
  body        text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index ix_comment_post on public.comments(post_id, created_at);

create table public.post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- 동행모집(community_posts.kind='companion'를 보강하는 메타)
create table public.companions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null unique references public.community_posts(id) on delete cascade,
  activity_id uuid references public.activities(id),
  host_id     uuid not null references public.users(id) on delete cascade,
  meet_at     timestamptz not null,
  place       text,
  geo         geography(point,4326),
  capacity    smallint not null check (capacity between 2 and 50),
  joined_count smallint not null default 1,
  status      text not null default 'open' check (status in ('open','full','closed','done')),
  created_at  timestamptz not null default now()
);
create table public.companion_members (
  companion_id uuid not null references public.companions(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (companion_id, user_id)
);

create table public.badges (
  code        text primary key,        -- 'first_test','first_reservation','companion_3'...
  name        text not null,
  description text not null,
  icon_url    text,
  criteria    jsonb not null,          -- {event:'reservation_completed', count:1}
  is_certmark boolean not null default false  -- 동행 인증마크 등
);
create table public.user_badges (
  user_id   uuid not null references public.users(id) on delete cascade,
  badge_code text not null references public.badges(code),
  awarded_at timestamptz not null default now(),
  progress   jsonb,                    -- {current:2, target:3}
  primary key (user_id, badge_code)
);

create table public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  followee_id uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index ix_follow_followee on public.follows(followee_id);

create table public.notifications (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id) on delete cascade,
  type      notif_type not null,
  title     text not null,
  body      text,
  deep_link text,                       -- feellog://activity/123 등
  payload   jsonb,
  read_at   timestamptz,
  created_at timestamptz not null default now()
);
create index ix_notif_unread on public.notifications(user_id, created_at desc) where read_at is null;

-- 분석 이벤트(§4.5)
create table public.analytics_events (
  id        bigint generated always as identity primary key,
  user_id   uuid references public.users(id) on delete set null,
  anon_id   text,                       -- 비로그인 식별
  name      text not null,              -- 'signup','test_completed'...
  props     jsonb not null default '{}',
  session_id text,
  ts        timestamptz not null default now()
);
create index ix_evt_name_ts on public.analytics_events(name, ts);
create index ix_evt_user on public.analytics_events(user_id, ts);
```

#### 4.2.6 인덱스 · RLS 정책 개요

**인덱스 요약**

| 테이블 | 인덱스 | 목적 |
|---|---|---|
| taste_profiles | `uq_active_profile (user_id) WHERE is_active` | active 프로필 1개 보장·조회 |
| activities | `ix_act_filter`, `ix_act_keywords(gin)` | 하드필터·키워드 |
| activities/partners | `gist(geo)` | 거리 정렬(검색·동행) |
| reactions | `(user_id, created_at desc)` | 재랭킹 입력 스캔 |
| recommendations | `(user_id, batch_id, rank)` | 피드 페이지네이션 |
| community_posts | `(kind, created_at desc) WHERE deleted_at is null` | 피드 무한스크롤 |
| notifications | `(user_id, created_at desc) WHERE read_at is null` | 미읽음 뱃지 |
| analytics_events | `(name, ts)`, `(user_id, ts)` | 퍼널 집계 |

**RLS 정책(개요)** — 모든 사용자 데이터 테이블 `enable row level security` + `force`.

```sql
-- 패턴 1) 본인 소유 데이터: 본인만 R/W
alter table public.taste_profiles enable row level security;
create policy tp_self on public.taste_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 동일 패턴 적용: users(id=auth.uid()), test_responses, reactions,
--   recommendations, reservations, notifications, user_badges
alter table public.users enable row level security;
create policy users_self on public.users
  for all using (id = auth.uid()) with check (id = auth.uid());

-- 패턴 2) 공개 카탈로그: 인증/익명 읽기 공개, 쓰기는 admin/partner만
alter table public.activities enable row level security;
create policy act_read on public.activities
  for select using (is_published or auth.role() = 'service_role');
create policy act_write on public.activities
  for all to authenticated
  using (exists (select 1 from public.users u
                 where u.id = auth.uid() and u.role in ('admin','partner')));
-- test_questions/test_options/activity_tags/activity_images/type_centroids/badges 도 읽기 공개

-- 패턴 3) 커뮤니티 가시성: 공개글은 모두, 비공개는 본인, 팔로워공개는 팔로워
alter table public.community_posts enable row level security;
create policy post_read on public.community_posts
  for select using (
    deleted_at is null and (
      visibility = 'public'
      or author_id = auth.uid()
      or (visibility = 'followers' and exists (
            select 1 from public.follows f
            where f.followee_id = author_id and f.follower_id = auth.uid()))
    ));
create policy post_write on public.community_posts
  for insert with check (author_id = auth.uid());
create policy post_modify on public.community_posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

-- 패턴 4) 분석 이벤트: 클라이언트는 insert만(읽기 금지), 집계는 service_role
alter table public.analytics_events enable row level security;
create policy evt_insert on public.analytics_events
  for insert to authenticated, anon with check (true);
```

> 카운터(`like_count`/`comment_count`/`joined_count`)는 트리거 또는 RPC 내 원자 갱신으로 일관성 유지(직접 update 금지 → RLS로 컬럼 보호 어렵기에 RPC 경유).

---

### 4.3 (c) 홈 화면 상태 분기 로직

핵심: **"처음 로그인 = 성향테스트 강제 / 테스트 완료 = 카드 추천 메인"**. 단일 플래그가 아니라 2-플래그 + 서버 단일 진실로 설계해 클라이언트 변조·경합을 방지한다.

**플래그 설계**

| 위치 | 필드 | 의미 | 갱신 시점 |
|---|---|---|---|
| `users.onboarding_done` | bool | 온보딩 3장 완료 | 온보딩 `[시작하기]` |
| `users.has_taste_profile` | bool | active 취향 프로필 존재 | `submit_test` 성공 시 `true`(트랜잭션 내) |
| `taste_profiles.is_active` | bool | 진실의 원천(플래그는 캐시) | 프로필 생성/재검사 |

> `has_taste_profile`은 조회 성능을 위한 **캐시**다. 진실은 `taste_profiles` active row. `submit_test` RPC가 동일 트랜잭션에서 프로필 insert + 플래그 update를 함께 수행하여 불일치 차단.

**분기 의사코드 (홈 진입 시)**

```text
function resolveHome(session):
    if session == null:                      # 게스트 둘러보기
        return GUEST_HOME (읽기전용 + 액션 시 로그인 시트)

    me = getUser(session.uid)                # users 1행 (RLS로 본인만)
    if not me.onboarding_done:
        return REDIRECT(onboarding/0)        # 온보딩 미완

    if not me.has_taste_profile:             # === Variant A ===
        return HOME_A {
            hero: 대형 [테스트 시작하기] 카드,
            secondary: 둘러보기용 인기 활동 (read-only),
            lock: 카드추천/커뮤니티 일부 잠금 + "테스트하면 열려요" 안내
        }
    else:                                     # === Variant B ===
        feed = getRecommendations(me.uid)    # 캐시된 batch 없으면 생성
        return HOME_B {
            main: 카드 추천 캐러셀(feed),
            typeBadge: me.main_type + 보조성향,
            quick: [커뮤니티][내 기록][검색]
        }
```

**경합/일관성 처리 (ASCII)**

```
[테스트 12문항 제출]
      |
      v
  RPC submit_test  (single transaction, security definer)
      |---- 5축/보조/유형 계산
      |---- insert taste_profiles(is_active=true)  --+
      |---- update old profiles set is_active=false  | 원자적
      |---- update users set has_taste_profile=true --+
      |---- (옵션) 초기 recommendations batch 생성
      v
  commit  ->  client invalidate ['user','recommendations']
      |
      v
  홈 재조회 => Variant B (카드 추천)
```

- **재검사**: 같은 RPC 재호출 → 기존 active=false, 신규 active=true. `has_taste_profile`은 계속 true.
- **로컬 캐시 신뢰 금지**: 클라이언트는 홈 진입 시 `users` 행을 항상 fetch(또는 Realtime). 딥링크로 `/reco/feed`에 직접 진입해도 `has_taste_profile=false`면 라우터 가드가 테스트로 리다이렉트.
- **레이스(테스트 중 다른 기기)**: `uq_active_profile`로 active 1개 강제, upsert 충돌 시 재시도.

---

### 4.4 (d) API / RPC 목록 (Supabase) + 요청·응답 예시

원칙: 단순 CRUD는 PostgREST(REST) 자동 엔드포인트 + RLS. 복합 트랜잭션·계산·외부연동은 **Postgres RPC**(`security definer`) 또는 **Edge Function**.

| 영역 | 종류 | 이름 | 설명 |
|---|---|---|---|
| 인증 | SDK | `supabase.auth.signInWithOAuth({provider:'kakao'\|'apple'\|'google'})` / `signInWithPassword` | 소셜·이메일 로그인 |
| 인증 | Trigger | `on_auth_user_created` | auth.users insert 시 `public.users` upsert |
| 테스트 | RPC | `submit_test(session_id, responses[])` | 채점→프로필 생성→플래그→초기 추천(트랜잭션) |
| 추천 | RPC | `get_recommendations(limit, exclude_reacted)` | 5축 매칭 정렬 + 탐색카드 혼합 |
| 추천 | RPC | `record_reaction(activity_id, kind)` | 반응 upsert → 프로필 온라인 보정 → 다음 카드 재랭킹 |
| 활동 | REST | `GET /activities/:id` (+`activity_tags`,`images`,`partner` embed) | 상세 |
| 검색 | RPC | `search_activities(filters, sort, cursor)` | 하드필터 + 거리/추천 정렬 |
| 예약 | Edge | `start_reservation(activity_id, schedule, headcount)` | 멱등 예약/결제 세션 시작 |
| 커뮤니티 | REST/RPC | posts/comments CRUD, `toggle_post_like` | 글·댓글·좋아요 |
| 동행 | RPC | `join_companion(companion_id)` / `leave_companion` | 정원·상태 원자 갱신 |
| 뱃지 | RPC/Edge | `evaluate_badges(event)` | 이벤트 기반 뱃지 획득 평가 |
| 분석 | Edge/REST | `track(name, props)` | 이벤트 적재 |

#### 4.4.1 테스트 제출 → 프로필 생성

채점 규칙(확정 스펙 반영):
- 각 문항 value(-2~+2)를 `axis_key`별로 합산 후, 축별 문항 수로 정규화하여 `-100~+100` 스케일링.
- 보조: trend = mean(Q1,Q6,Q11) → 0~100, recovery = mean(Q5,Q9,Q11) → 0~100. 더 높고 임계(예: ≥40) 넘으면 그 하나를 `sub_trait`로, 둘 다 낮으면 null.
- 유형: 사용자 5축 벡터와 `type_centroids` 6개의 **유클리드 거리 최소** 중심 → `main_type`.

```jsonc
// 요청: POST /rest/v1/rpc/submit_test
{
  "p_session_id": "7c3f...e1",
  "p_responses": [
    {"question_id": 1, "value":  2},   // Q1 경험선호 +2(새로움) → trend↑
    {"question_id": 2, "value": -1},
    {"question_id": 3, "value":  1},
    {"question_id": 4, "value":  2},   // 참여 +2(만들기)
    {"question_id": 5, "value": -1},   // recovery↑
    {"question_id": 6, "value":  1},
    {"question_id": 7, "value": -2},
    {"question_id": 8, "value":  0},
    {"question_id": 9, "value": -1},
    {"question_id": 10, "value": 1},
    {"question_id": 11, "value": 1},   // trend vs recovery 분기
    {"question_id": 12, "value": 2}
  ]
}
```
```jsonc
// 응답 200
{
  "profile_id": "9b1...",
  "axes": {
    "axis_rhythm": -35, "axis_relation": 20, "axis_experience": 45,
    "axis_participation": 75, "axis_reward": -10
  },
  "sub": { "trend_score": 67, "recovery_score": 41, "sub_trait": "trend_discovery" },
  "main_type": "handcraft_achiever",      // 손끝 성취형
  "type_distance": 28.4,
  "type_label": "손끝 성취형",
  "initial_batch_id": "b12...",            // 결과 화면 추천 썸네일용
  "top_recommendations": [
    {"activity_id":"a-mokgong","title":"목공 클래스","match_score":92.3},
    {"activity_id":"a-tufting","title":"터프팅","match_score":88.1}
  ]
}
```

RPC 핵심 의사코드:

```sql
create or replace function submit_test(p_session_id uuid, p_responses jsonb)
returns jsonb language plpgsql security definer as $$
declare v_axes record; v_type main_type; v_tp uuid; ...
begin
  -- 1) 응답 저장(upsert)
  insert into test_responses(user_id,session_id,question_id,value)
    select auth.uid(), p_session_id, (r->>'question_id')::int, (r->>'value')::int
    from jsonb_array_elements(p_responses) r
  on conflict (user_id,session_id,question_id) do update set value=excluded.value;

  -- 2) 축별 정규화 점수 (문항→axis_key 매핑, axis_weight 반영, *50/문항수)
  -- 3) 보조 trend/recovery 평균→0~100, 임계 비교로 sub_trait
  -- 4) 최근접 중심 분류: order by euclid(user_vec, centroid) limit 1
  -- 5) old active=false; insert new active=true
  update taste_profiles set is_active=false where user_id=auth.uid() and is_active;
  insert into taste_profiles(...) returning id into v_tp;
  update users set has_taste_profile=true where id=auth.uid();
  -- 6) 초기 추천 batch 생성(get_recommendations 호출)
  return jsonb_build_object(...);
end $$;
```

#### 4.4.2 추천 조회 (5축 매칭)

매칭 점수식(가중 유클리드 → 0~100 변환):

```text
axes = [rhythm, relation, experience, participation, reward]
w    = [w1..w5]   # 기본 1.0, 유형 강조축 1.5 (예: 손끝성취형→participation,experience)
dist = sqrt( Σ wi*(user_i - activity_i)^2 )
max_dist = sqrt( Σ wi*(200)^2 )            # 최대(각 축 -100~100, 폭 200)
match_score = round( (1 - dist/max_dist) * 100, 1 )
# 보조성향 보정: activity.trend_affinity/recovery_affinity가 사용자 sub_trait와 일치 시 +가산(최대 +8)
# 최종 정렬: match_score desc, 단 매 N장마다 is_explore 카드 1장 삽입(탐색)
```

```jsonc
// 요청: POST /rest/v1/rpc/get_recommendations
{ "p_limit": 25, "p_exclude_reacted": true }
```
```jsonc
// 응답 200
{
  "batch_id": "b12...",
  "items": [
    {
      "activity_id":"a-mokgong","title":"목공 클래스","summary":"내 손으로 완성하는 우드 트레이",
      "thumbnail_url":"https://.../mokgong.jpg",
      "keywords":["만들기","결과물 만족","집중"],
      "match_score":92.3,"is_explore":false,
      "reason":{"top_axis":"participation","main_type":"handcraft_achiever"},
      "partner":{"name":"○○공방","booking_url":"https://...","distance_km":3.2}
    },
    {
      "activity_id":"a-trekking","title":"근교 트레킹","match_score":61.0,
      "is_explore":true, "reason":{"explore":"새 취향 탐색"}
    }
  ],
  "progress":{"index":1,"total":25}     // 카드 "1/25"
}
```

#### 4.4.3 카드 반응 기록 → 온라인 보정 → 재랭킹

보정 규칙(확정: 좋아한 태그 강화 / 관심없는 태그 약화):

```text
on like(activity):    user_axis_i += α * (activity_axis_i - user_axis_i)   # α=0.08, 활동쪽으로 끌림
on dislike(activity): user_axis_i -= β * (activity_axis_i - user_axis_i)   # β=0.04, 활동쪽에서 밀어냄
clamp(-100,100); 보조 affinity도 동일 미세 조정
재분류 트리거: 누적 보정 Δ가 임계 초과 시 main_type 재계산(type_centroids 최근접)
```

```jsonc
// 요청: POST /rest/v1/rpc/record_reaction
{ "p_activity_id": "a-jeonsi", "p_kind": "dislike" }
```
```jsonc
// 응답 200
{
  "updated_axes": {"axis_experience": 38, "axis_participation": 78},  // 변동분만 표기
  "main_type": "handcraft_achiever",       // 유지 또는 재분류 시 변경
  "next_cards": [                          // 즉시 재랭킹된 다음 카드들
    {"activity_id":"a-baking","title":"베이킹 클래스","match_score":90.5},
    {"activity_id":"a-leather","title":"가죽공예","match_score":87.2}
  ],
  "badge_unlocked": null
}
```

#### 4.4.4 예약 시작 (Edge Function, 멱등)

```jsonc
// 요청: POST /functions/v1/start_reservation
{
  "activity_id":"a-mokgong",
  "scheduled_at":"2026-07-12T14:00:00+09:00",
  "headcount":2,
  "idempotency_key":"resv-7c3f-0712-1400"   // 중복 클릭 방지
}
```
```jsonc
// 응답 200 — 초기 MVP: 외부 예약링크 / 향후: PG 결제 세션
{
  "reservation_id":"r-882",
  "status":"pending",
  "mode":"external_link",                    // 또는 "pg_checkout"
  "redirect_url":"https://partner.example/booking/xyz",  // external_link
  "pg":{ "provider":"toss", "payment_url":null }         // pg_checkout 시 채워짐
}
```

#### 4.4.5 커뮤니티 · 동행 · 뱃지

```jsonc
// 글 작성: POST /rest/v1/community_posts  (RLS: author_id=auth.uid())
// 요청
{ "kind":"log","activity_id":"a-mokgong",
  "body":"오늘 목공 클래스 완성! 트레이 너무 예뻐요","image_urls":["https://.../1.jpg"],
  "visibility":"public" }
// 응답 201
{ "id":"p-501","like_count":0,"comment_count":0,"created_at":"2026-06-30T05:10:00Z" }
```
```jsonc
// 좋아요 토글: POST /rest/v1/rpc/toggle_post_like  { "p_post_id":"p-501" }
// 응답: { "liked": true, "like_count": 13 }
```
```jsonc
// 동행 참여: POST /rest/v1/rpc/join_companion  { "p_companion_id":"c-77" }
// 응답 200 (정원/상태 원자 갱신)
{ "companion_id":"c-77","joined_count":4,"capacity":6,"status":"open","joined":true }
// 정원 초과 시 409: { "error":"companion_full" }
```
```jsonc
// 뱃지 평가: POST /rest/v1/rpc/evaluate_badges  { "p_event":"reservation_completed" }
// 응답 200
{ "newly_awarded":[
    {"code":"first_reservation","name":"첫 체험 도전","icon_url":"https://.../badge.png"}
  ],
  "progress":[{"code":"companion_3","current":2,"target":3}] }
```

> 커뮤니티 글 작성/좋아요/댓글/동행참여 시 `comment_count` 등 카운터는 동일 RPC/트리거 내에서 갱신하고, 작성자에게 `notifications` insert + Realtime push(알림 화면 S22)로 연결.

---

### 4.5 (e) 분석 이벤트 스키마 (퍼널)

퍼널: **가입 → 테스트완료 → 첫추천 → 카드반응 → 예약 → 재방문**. 모든 이벤트는 `analytics_events`(§4.2.5)에 적재(`track` API), 또는 Edge에서 GA4/Amplitude 병행 전송.

**핵심 이벤트 정의**

| 단계 | 이벤트명 | 발화 위치 | props(JSON) |
|---|---|---|---|
| 유입 | `app_open` | 앱/웹 진입 | `{platform, source, anon_id}` |
| 가입 | `signup` | S02/S03 성공 | `{method:'kakao'\|'apple'\|'google'\|'email', is_self_gift?:bool}` |
| 온보딩 | `onboarding_complete` | S06 | `{skipped:bool}` |
| 테스트 | `test_start` | S07/S08 Q1 | `{session_id}` |
| 테스트 | `test_question_answered` | S08 각 문항 | `{session_id, q:1..12, value:-2..2, ms}` |
| 테스트 | `test_completed` | S09 submit 성공 | `{session_id, main_type, sub_trait, axes:{...}}` |
| 추천 | `reco_first_view` | S10/S12 첫 노출 | `{batch_id, item_count, top_match}` |
| 추천 | `card_impression` | S12 카드 노출 | `{activity_id, rank, is_explore}` |
| 반응 | `card_reaction` | S12 좋아요/싫어요/선택 | `{activity_id, kind, position, dwell_ms}` |
| 상세 | `activity_view` | S13 | `{activity_id, from:'feed'\|'search'}` |
| 예약 | `reservation_start` | S13/Edge | `{activity_id, mode, amount}` |
| 예약 | `reservation_complete` | 콜백 | `{reservation_id, status, amount, commission}` |
| 커뮤니티 | `post_create` / `companion_join` | S16/S18 | `{kind}` / `{companion_id}` |
| 게이미 | `badge_unlocked` | RPC | `{code}` |
| 재방문 | `retention_dau` | 세션 시작(파생) | `{days_since_signup, has_taste_profile}` |

**퍼널 집계 예시 (전환율)**

```sql
-- 가입→테스트완료→첫추천→반응→예약 전환 (최근 30일)
with f as (
  select user_id,
    bool_or(name='signup')          as s_signup,
    bool_or(name='test_completed')  as s_test,
    bool_or(name='reco_first_view') as s_reco,
    bool_or(name='card_reaction')   as s_react,
    bool_or(name='reservation_complete') as s_resv
  from analytics_events
  where ts > now() - interval '30 days'
  group by user_id
)
select
  count(*) filter (where s_signup) as signup,
  count(*) filter (where s_test)   as test_done,
  count(*) filter (where s_reco)   as first_reco,
  count(*) filter (where s_react)  as reacted,
  count(*) filter (where s_resv)   as reserved
from f;
```

```text
퍼널(예시 시각화)
가입 ████████████████████ 100%
테스트완료 ███████████████ 76%   ← 12문항 길이/이미지 로딩 이탈 모니터
첫추천 ██████████████ 71%
카드반응 ███████████ 58%        ← 스와이프 코치마크 효과 A/B
예약 ███ 14%                     ← 외부링크 이탈 vs 내부결제 비교
재방문(D7) ████ 22%
```

**[가정]** 이벤트는 클라이언트 직접 insert(RLS insert-only) + 민감 지표(매출/수수료)는 `reservation_complete`를 서버 콜백에서만 적재하여 위변조 방지. 비로그인 사용자는 `anon_id`로 추적 후 가입 시 `user_id`와 스티칭(`identify` 이벤트로 매핑 테이블 갱신).

---

I have all the context I need from the brief. Writing the section now.

## 5. 백엔드 · 인프라 · 결제 · 지도 · 커뮤니티/실시간 · 보안/개인정보

> 본 섹션은 합의된 기술 결정(Expo + react-native-web 단일 코드베이스, 웹(PWA) 우선, Supabase 백엔드, 자체 5축 추천, 카카오/Apple/Google/이메일 인증, 카카오맵, 국내 PG)을 단일 진실 원천으로 삼아 백엔드·인프라 전반을 구현 가능한 수준으로 설계한다. 비용은 모두 2026년 6월 기준 환율 **[가정] 1 USD ≈ 1,380 KRW**로 환산한다.

---

### 5.0 전체 아키텍처 한눈에 보기

```
                          ┌───────────────────────────────────────────────┐
                          │   클라이언트 (Expo / react-native-web)         │
                          │   웹(PWA) → 이후 동일코드 iOS/Android           │
                          │   - supabase-js (Auth/DB/Storage/Realtime)     │
                          │   - 카카오 로그인 SDK, 카카오맵 SDK             │
                          │   - PG 결제 SDK(토스/포트원) 위젯               │
                          └───────────────┬───────────────────────────────┘
                                          │ HTTPS / WSS (JWT in header)
            ┌─────────────────────────────┼──────────────────────────────────────┐
            │                             │                                        │
   ┌────────▼─────────┐        ┌──────────▼───────────┐            ┌───────────────▼────────────┐
   │ Vercel / CF Pages│        │      Supabase        │            │   외부 SaaS / 채널           │
   │ (정적 웹/PWA 호스팅)│       │  ┌────────────────┐  │            │  - 카카오 OAuth/맵/선물하기  │
   │  - SSG/SPA 번들  │        │  │ Postgres + RLS │  │            │  - 토스페이먼츠/포트원 PG    │
   │  - Edge 캐싱     │        │  │ Auth (GoTrue)  │  │            │  - 네이버 스마트스토어       │
   └──────────────────┘        │  │ Storage(S3호환)│  │            │  - Resend/SES (메일)        │
                               │  │ Realtime       │  │            │  - Sentry, 카카오 알림톡     │
                               │  │ Edge Functions │◄─┼────웹훅────┤  (PG/카카오/네이버 콜백)     │
                               │  │ Cron(pg_cron)  │  │            └─────────────────────────────┘
                               │  └────────────────┘  │
                               └──────────────────────┘
```

핵심 원칙: **모든 신뢰 경계는 Supabase RLS + Edge Function 서버 검증**에 둔다. 클라이언트는 절대 신뢰하지 않으며, 결제 금액·수수료·정산은 전부 서버에서 재계산한다.

---

### 5.1 Supabase 설정

#### 5.1.1 프로젝트 구성 (환경 분리)

| 환경 | Supabase 프로젝트 | 용도 | 비고 |
|---|---|---|---|
| `feellog-dev` | 별도 프로젝트(무료 티어) | 로컬/개발 | seed 데이터, 잦은 마이그레이션 |
| `feellog-stg` | 별도 프로젝트(무료/Pro) | QA/베타 | 실 PG 테스트 키 사용 |
| `feellog-prod` | Pro 플랜 | 운영 | 일일 백업, PITR |

- **리전:** `ap-northeast-2`(서울)에 가장 가까운 Supabase 리전 선택. Supabase 서울 리전 가용 시 서울, 미가용 시 도쿄(`ap-northeast-1`). 시니어 체감 지연 최소화 + 개인정보 국내/근접 보관 명분. **[가정]** 운영 시점 서울 리전 사용.
- **로컬 개발:** `supabase` CLI로 로컬 스택(Docker) 구동. 마이그레이션은 `supabase/migrations/*.sql`로 버전 관리하고 git에 커밋. 절대 대시보드에서 직접 스키마 수정 금지(드리프트 방지).

```bash
# 프로젝트 부트스트랩
supabase init
supabase start                      # 로컬 Postgres/Studio/Storage 기동
supabase migration new init_schema  # 스키마 마이그레이션 작성
supabase db push                    # 원격(stg/prod) 반영
supabase functions deploy recommend # Edge Function 배포
supabase secrets set --env-file ./supabase/.env.prod  # 시크릿 등록
```

#### 5.1.2 핵심 테이블 개요 (3·4섹션 추천/진단 스키마와 정합)

```sql
-- 사용자 프로필 (auth.users 1:1 확장)
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  birth_year    smallint,          -- 연령대만 보관(생년월일 X) = 최소수집
  region_code   text,              -- 시군구 코드 (지역 하드필터용)
  avatar_path   text,              -- storage object path (URL 아님)
  senior_mode   boolean default true,  -- 큰글씨/단순동선 토글
  created_at    timestamptz default now()
);

-- 진단 결과(5축 점수 + 메인유형 + 보조성향) : 4섹션 산출물 저장
create table public.assessment_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  axis         jsonb not null,     -- {"rhythm":int,"relation":int,"experience":int,"participation":int,"reward":int}  (-100~100)
  main_type    text not null,      -- 'vital_explorer' | 'calm_immersion' | ...
  sub_trait    text,               -- 'trend' | 'recovery' | null
  raw_answers  smallint[],         -- 12문항 응답(-2~+2) 재계산/감사용
  created_at   timestamptz default now()
);

-- 활동(클래스) 마스터 : 5축 태그 + 하드필터 메타
create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid references public.partners(id),
  title        text, summary text, keywords text[],
  axis_tag     jsonb not null,     -- 5축 점수(-100~100)
  region_code  text, price int, duration_min int,
  intensity    smallint,           -- 신체활동 강도(1~5) 하드필터
  lat double precision, lng double precision,
  cover_path   text,
  is_active    boolean default true
);

-- 카드 반응(좋아요/관심없음/선택) : 4섹션 감성보정 입력
create table public.card_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id),
  reaction text check (reaction in ('like','skip','pick')),
  created_at timestamptz default now(),
  unique (user_id, activity_id)
);

-- 커뮤니티/예약/결제/게이미피케이션 테이블은 각 절에서 정의
```

#### 5.1.3 Storage 버킷 설계

| 버킷 | 공개여부 | 용도 | RLS/정책 |
|---|---|---|---|
| `activity-images` | **public-read** | 활동/클래스 커버 이미지(파트너 업로드) | 쓰기: 파트너/관리자만. 읽기: 전체 |
| `avatars` | **public-read** | 프로필 사진 | 쓰기: 본인(`owner = auth.uid()`)만. 읽기: 전체 |
| `community-media` | **private** → 서명URL | 피드 사진/동행모집 이미지 | 쓰기: 작성자. 읽기: 서명URL(만료 1h) 또는 정책기반 |
| `verification` | **private** | 활동 인증샷(인증마크 발급용) | 쓰기: 본인. 읽기: 본인 + 모더레이터 |
| `partner-docs` | **private** | 파트너 사업자등록증 등 심사서류 | 쓰기/읽기: 관리자만 |

핵심: **DB에는 공개 URL이 아니라 object path만 저장**한다. 공개 버킷은 path → 변환 URL로 즉시 렌더, 비공개 버킷은 Edge Function/`createSignedUrl`로 단기 서명 URL 발급.

Storage RLS 예시(아바타 본인 쓰기):

```sql
-- storage.objects 에 정책
create policy "avatar_owner_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text   -- avatars/{uid}/file.jpg
);
```

#### 5.1.4 이미지 변환 / CDN

- Supabase Storage의 **Image Transformation**(`?width=&height=&quality=&resize=cover`)을 사용해 원본 1장만 보관하고 렌더 사이즈를 쿼리 파라미터로 제어. 시니어 카드 UI는 큰 썸네일이 많으므로 다음 프리셋을 표준화.

| 프리셋 | 용도 | 변환 파라미터 |
|---|---|---|
| `card` | 추천 카드 | `width=720&quality=70&resize=cover` |
| `thumb` | 결과화면 리스트 썸네일 | `width=240&quality=70&resize=cover` |
| `avatar` | 프로필 | `width=160&quality=75&resize=cover` |
| `feed` | 커뮤니티 피드 | `width=1080&quality=72` |

- 변환 결과는 Supabase 내장 CDN에 캐시. 추가로 **Cloudflare를 앞단 캐시 레이어**로 둘 수 있으나 MVP에서는 내장 CDN으로 충분. **[가정]** 트래픽 급증 시 Cloudflare Images로 이관.
- 업로드는 클라이언트에서 **WebP/JPEG로 1차 다운스케일 후 업로드**(react-native-image-resizer 류)하여 Storage 용량·변환부하·요금 절감.

#### 5.1.5 Edge Functions (추천 / 웹훅)

Deno 기반 Edge Function으로 다음을 구현. 추천 핵심 연산은 Postgres SQL/RPC로 두고 Function은 오케스트레이션 담당.

| Function | 트리거 | 역할 |
|---|---|---|
| `recommend` | 클라이언트 호출(JWT) | 하드필터 → 5축 매칭 점수 → 피드백 보정 → 상위 N 카드 반환(3·4섹션 로직) |
| `assess-finalize` | 진단 완료 시 | 12문항 → 5축/메인유형/보조성향 산출·저장 |
| `payment-webhook` | PG(토스/포트원) | 결제 승인/취소 콜백 검증 → 예약 확정/정산 레코드 |
| `kakao-token-exchange` | 클라이언트 | 카카오 access token → Supabase 세션 교환(5.2) |
| `gift-webhook` | 카카오 선물하기/네이버 | 기프티콘 발급/사용 동기화 |
| `gamify-eval` | DB 이벤트/cron | 뱃지·인증마크 조건 평가·발급 |
| `moderation-action` | 신고 임계 도달 | 자동 블라인드/모더레이터 알림 |

추천 점수(5축 거리)는 Postgres RPC로:

```sql
-- 5축 코사인/유클리드 혼합. 차이가 작을수록 100점에 근접.
create or replace function public.match_activities(
  p_user uuid, p_region text, p_budget int, p_max_intensity smallint, p_limit int default 25
) returns table(activity_id uuid, score numeric) language sql stable as $$
  with u as (
    select axis from public.assessment_results
    where user_id = p_user order by created_at desc limit 1
  ),
  -- 카드 피드백 기반 축 보정 가중치(좋아한 태그 강화/관심없는 태그 약화)
  fb as (
    select coalesce(jsonb_object_agg(k, w),'{}'::jsonb) adj from (
      select 'rhythm' k, 0 w  -- 실제 보정은 5.x/4섹션 로직, 여기선 자리표시
    ) t
  )
  select a.id,
         100 - ( -- L1 거리를 점수로 환산(스케일 통일: 모두 -100~100)
            abs((u.axis->>'rhythm')::int       - (a.axis_tag->>'rhythm')::int) +
            abs((u.axis->>'relation')::int      - (a.axis_tag->>'relation')::int) +
            abs((u.axis->>'experience')::int     - (a.axis_tag->>'experience')::int) +
            abs((u.axis->>'participation')::int   - (a.axis_tag->>'participation')::int) +
            abs((u.axis->>'reward')::int        - (a.axis_tag->>'reward')::int)
         ) / 10.0 as score
  from public.activities a, u
  where a.is_active
    and a.region_code = p_region          -- 하드필터: 지역
    and a.price <= p_budget               -- 하드필터: 예산
    and a.intensity <= p_max_intensity    -- 하드필터: 신체강도
  order by score desc
  limit p_limit;
$$;
```

> 주의(브리프 정합): 유형 중심값은 -25~+25 초안, 사용자/활동은 -100~+100 스케일이므로 추천 엔진 진입 전 **중심 벡터를 ×4 해 -100~100으로 통일**한다(스케일 통일 규칙은 4섹션과 동일하게 유지).

#### 5.1.6 환경변수 / 시크릿 관리

| 시크릿 | 저장 위치 | 클라이언트 노출 |
|---|---|---|
| `SUPABASE_ANON_KEY` | 빌드 환경변수(EXPO_PUBLIC_) | 노출 OK(RLS로 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Edge Function secret만** | 절대 노출 금지 |
| `KAKAO_REST_API_KEY`, `KAKAO_ADMIN_KEY` | Edge Function secret | 금지 |
| `TOSS_SECRET_KEY` / `PORTONE_API_SECRET` | Edge Function secret | 금지 |
| `KAKAO_JS_KEY`(맵/로그인 JS) | 빌드 환경변수 | 노출 OK(도메인 화이트리스트로 제한) |
| `WEBHOOK_SIGNING_SECRET` | Edge Function secret | 금지 |

- 클라이언트엔 `EXPO_PUBLIC_*` 접두 변수만 주입. 서버 비밀은 `supabase secrets set`으로 Function에만 주입.
- 키 로테이션: 분기 1회 또는 유출 의심 시 즉시. 서비스 롤 키는 Edge Function 외 어디에도 두지 않음(Vercel 빌드에도 금지).

---

### 5.2 인증 상세

#### 5.2.1 제공자별 방식

| 제공자 | 방식 | 비고 |
|---|---|---|
| **카카오** | Supabase Auth가 카카오 OAuth 공식 미지원 가능성 → **카카오 SDK 로그인 후 access token을 Edge Function에서 검증 → Supabase Admin으로 사용자 생성/로그인** | 시니어 핵심 채널. 한국어 동의화면 |
| **Apple** | Supabase Auth 네이티브 지원(Sign in with Apple) | iOS 심사 필수(소셜로그인 1개 이상 시 Apple 의무) |
| **Google** | Supabase Auth 네이티브 지원 | 웹/안드로이드 |
| **이메일** | Supabase Auth Email OTP(매직링크) 우선, 비밀번호 보조 | 시니어는 매직링크가 비번관리 부담 ↓ |

> **[가정]** Supabase가 카카오를 기본 OAuth 공급자로 제공하지 않는다고 전제하고 토큰 교환 경로를 1순위로 설계. 향후 기본 지원이 확정되면 단순화 가능.

#### 5.2.2 카카오 로그인 — 토큰 교환 흐름

```
[클라이언트]            [카카오]               [Edge: kakao-token-exchange]      [Supabase Auth]
  로그인 버튼 ── 인가요청 ──▶ 동의화면
       ◀── access_token(+id) ──┘
  access_token ───────────────────────────▶ (1) 카카오 /v2/user/me 로 토큰 검증·프로필 취득
                                            (2) email/kakao_id 추출
                                            (3) admin.createUser 또는 기존조회 ─────▶ users upsert
                                            (4) admin.generateLink/세션 발급 ◀──────  session
       ◀──────────────── { access_token, refresh_token } ──────────────────────────┘
  supabase.auth.setSession(...)  → 이후 모든 호출 JWT 인증
```

검증 핵심(Edge Function 의사코드):

```ts
// kakao-token-exchange (Deno)
const { kakaoAccessToken } = await req.json();
// 1) 카카오 토큰으로 사용자정보 조회 (위조 access token 차단)
const me = await fetch("https://kapi.kakao.com/v2/user/me", {
  headers: { Authorization: `Bearer ${kakaoAccessToken}` }
}).then(r => r.ok ? r.json() : Promise.reject("invalid kakao token"));

const kakaoId = String(me.id);
const email = me.kakao_account?.email ?? `kakao_${kakaoId}@feellog.local`; // 이메일 미동의 대비
// 2) service_role 로만 사용자 upsert (클라이언트엔 절대 미노출)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
let user = await findUserByKakaoId(admin, kakaoId)
        ?? await admin.auth.admin.createUser({ email, email_confirm: true,
              user_metadata: { provider: "kakao", kakao_id: kakaoId, nickname: me.properties?.nickname }});
// 3) 세션 발급 (refresh token 포함) 후 클라이언트 반환
return jsonSession(await issueSession(admin, user.id));
```

#### 5.2.3 세션 / 리프레시

- supabase-js가 access token(JWT, 기본 1h) + refresh token(장기)을 관리. **자동 갱신** 활성화.
- 저장소: 웹 PWA는 `localStorage`(또는 보안상 메모리+`httpOnly` 쿠키 미들웨어 고려), 앱은 `expo-secure-store`(키체인/키스토어). RN 단일코드이므로 플랫폼 분기 어댑터로 SecureStore/localStorage를 주입.
- 시니어 배려: **세션 만료 주기를 길게**(refresh 30일) 하여 잦은 재로그인 방지. 단, 결제·개인정보 변경 등 민감 액션은 **재인증(step-up)** 요구.

#### 5.2.4 시니어용 간편 로그인 UX (디자인 브리프 정합)

- 로그인 화면: 카카오톡 버튼을 **최상단·가장 크게**(노란 박스, 큰 터치 영역), Apple/Google는 그 아래, 이메일은 "이메일로 시작" 텍스트 링크로 강조 축소.
- [입장하기](콘플라워 블루 주버튼) / [둘러보기](회색 보조버튼, 로그인 없이 온보딩·샘플 추천 열람) 분기. "둘러보기"는 익명 세션(읽기전용)으로 진입 후 행동 시점에 로그인 유도.
- 인라인 에러(빨강) + 큰 글씨 안내문. 비밀번호 대신 매직링크 권장 문구.
- 자동 로그인 기본 ON(시니어 재로그인 피로 ↓), 공용기기 안내 토글 제공.

---

### 5.3 결제 (토스페이먼츠 / 포트원)

#### 5.3.1 PG 선택

- **1순위 포트원(구 아임포트):** 토스/카카오페이/네이버페이/카드 등 다중 PG를 단일 연동으로 묶어 시니어 결제수단 다양성 확보. **[가정]** 정산·다채널 통합 이점.
- **대안 토스페이먼츠:** 결제위젯 UX 우수, 단일 PG. MVP에서 토스 단독으로 시작해도 무방.
- 공통 원칙: **카드정보는 PG가 처리(PCI-DSS는 PG에 위임)**, 우리 서버·DB는 카드번호를 절대 보관/전송하지 않는다.

#### 5.3.2 예약 결제 흐름(서버 검증 필수)

```
[클라이언트]                 [Edge: create-order]        [PG]            [Edge: payment-webhook]
 1. 예약하기(활동/일시 선택)
 2. 주문생성 요청 ──────────▶ (a) 활동가격·수수료 서버 재계산
                            (b) orders(status=ready) 생성
    ◀── orderId, amount ────┘
 3. PG 결제창 호출 ─────────────────────────────────▶ 카드/페이 인증
 4. 결제성공 콜백(클라) ───▶ [Edge: confirm-payment] ──승인요청──▶  승인
                            (c) 금액 == 서버금액 검증            ◀─ 승인완료
                            (d) orders(status=paid), reservations 확정
                                                                  ── webhook ──▶ (재확인/멱등 처리)
 5. 예약확정 + 카카오 알림톡/푸시 발송
```

- **금액 위변조 방지:** 클라이언트가 보낸 금액을 절대 신뢰하지 않고 `activities.price`로 서버 재계산 후 승인. 승인 응답 금액과 주문 금액 불일치 시 자동 취소.
- **멱등성:** webhook은 동일 `paymentKey`/`imp_uid`에 대해 멱등(이미 처리 시 200 반환). `orders`에 unique 제약.

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  activity_id uuid references public.activities(id),
  partner_id uuid references public.partners(id),
  amount int not null,                 -- 결제총액
  fee_rate numeric not null,           -- 매칭 수수료율(0.10~0.15)
  fee_amount int generated always as (round(amount*fee_rate)) stored,
  payout_amount int generated always as (amount - round(amount*fee_rate)) stored,
  pg_payment_key text unique,          -- 멱등 키
  status text check (status in ('ready','paid','canceled','refunded','settled')) default 'ready',
  created_at timestamptz default now()
);
```

#### 5.3.3 매칭 수수료 정산 구조 (10~15%)

| 단계 | 처리 | 정산 모델 |
|---|---|---|
| 결제 수금 | PG가 사용자 카드에서 전액 수금 → **플랫폼 정산계좌로 입금** | 일반 PG 정산(D+2~). 우리가 1차 수령 |
| 수수료 차감 | `fee_amount = amount × fee_rate(10~15%)` 서버 산정 | `orders.payout_amount`가 파트너 지급액 |
| 파트너 지급 | 주기 정산(주 1회/월 2회) — 체험 **이용완료 확정 후** 지급 | 노쇼/취소 리스크 회피 |
| 정산 명세 | `settlements` 테이블 + 파트너 대시보드/CSV | 세금계산서 연동(향후) |

```
정산 타임라인(에스크로 유사):
 결제(D0) ── 체험일(D+n) ── 이용완료확정(자동/수동) ── 정산마감 ── 파트너 지급(주1회 배치)
            ↑ 이 기간 자금은 플랫폼 정산계좌에 '미지급(예치)' 상태로 보유 → 환불 대응 버퍼
```

- **본격 에스크로/PG 하위가맹점(서브몰) 정산**(PG가 파트너에게 직접 분배)은 고도화 단계(7000만원 자체 예약·결제)에서 도입. MVP는 **수동/배치 정산**으로 시작(개발 부담·예산 절감).
- 정산 배치는 `pg_cron` + Edge Function으로 주 1회 실행, `settlements` 생성·알림톡 발송.

#### 5.3.4 카카오 선물하기 / 네이버 스마트스토어 (기프티콘·체험권)

타깃의 초기 진입(2040 자녀의 부모 선물) 핵심 채널.

| 채널 | 상품 형태 | 연동 방식 | 사용 흐름 |
|---|---|---|---|
| 카카오 선물하기 | 체험권/기프티콘 | 카카오 비즈니스 입점 + 상품 등록(외부 채널) → 발급 webhook(`gift-webhook`)으로 핀번호 동기화 | 자녀 구매 → 부모 카톡 수신 → 앱에서 핀 등록 → 체험 예약 |
| 네이버 스마트스토어 | 기프티콘/체험권 | 스마트스토어 채널 판매 → 주문 API/엑셀 연동으로 핀 발급 | 동일(쿠폰 코드 등록) |

```sql
create table public.gift_vouchers (
  id uuid primary key default gen_random_uuid(),
  channel text check (channel in ('kakao_gift','naver_store')),
  pin_code_hash text unique,         -- 핀은 해시 저장(원문 미보관)
  activity_id uuid references public.activities(id),
  face_value int,
  status text check (status in ('issued','registered','used','expired','refunded')) default 'issued',
  registered_by uuid references public.profiles(id),
  expires_at timestamptz
);
```

- **체험권 등록:** 사용자는 핀 입력 → Edge Function이 해시 매칭·상태 검증 → 본인 계정에 귀속(`registered`). 사용 시 `used`.
- 외부 채널 결제는 해당 플랫폼 정책·수수료를 따르며, 우리 매칭 수수료와 **이중과금 방지** 규칙 필요(채널 판매분은 별도 정산 라인).

#### 5.3.5 환불 정책 (전자상거래법 정합)

| 시점 | 환불율 | 근거 |
|---|---|---|
| 체험일 7일 전까지 | 100% | 청약철회 보장 |
| 6~3일 전 | 80~90% | [가정] 파트너 표준약관 협의 |
| 2~1일 전 | 50% | |
| 당일/노쇼 | 0~30% | 파트너별 차등 |
| **콘텐츠/일정 하자(업체 귀책)** | 100% + 재예약 | 우리 책임 고지 |

- **청약철회 14일 원칙:** 체험 미이용 + 유효기간 내라면 콘텐츠 미개시로 보아 전액환불 원칙. 단, 날짜 지정 예약형은 위 일정표 적용(약관에 명시·고지).
- 환불 처리: `confirm-payment` 역경로로 PG 부분/전액 취소 API 호출 → `orders.status=refunded`, 정산 미지급분에서 차감(이미 지급 시 파트너 차기 정산 상계).
- 미성년 결제·착오 결제 보호 절차 안내(전자상거래법).

---

### 5.4 지도 (카카오맵 SDK)

#### 5.4.1 연동 단계

```
1) 카카오 디벨로퍼스 앱 등록 → JavaScript 키 발급
2) 플랫폼 등록: 웹 도메인(feellog.app 등) / iOS 번들ID / Android 키해시
3) 웹: react-native-web 환경 → 카카오맵 JS SDK를 웹뷰/iframe 또는 web 전용 컴포넌트로 로드
   앱: WebView로 카카오맵 JS 로드(가장 단일코드 친화) 또는 네이티브 브리지
4) 활동 좌표(activities.lat/lng) → 마커 렌더 → 클릭 시 상세 바텀시트
```

> 단일 코드베이스 유지를 위해 **카카오맵 JS SDK를 WebView로 래핑한 공용 `<FeellogMap>` 컴포넌트**를 만들어 웹/앱 모두 동일 사용. **[가정]** 네이티브 성능 이슈 시 앱에서만 네이티브 SDK로 교체.

#### 5.4.2 "좋아한 활동 업체" 지도 표시 흐름 (4섹션 7단계의 마지막 "지도·업체 연결"과 정합)

```
카드 좋아요 → card_feedback(like) → '내 관심 활동' → 지도 탭
 ┌──────────────── 지도 화면 ────────────────┐
 │  [지도]  좋아요한 활동 마커들(코랄 핀)      │
 │   📍 도자기공방 A   📍 목공방 B            │
 │   ─ 마커 탭 → 바텀시트 ─                   │
 │   [활동 커버 이미지(card 프리셋)]          │
 │   제목 / 키워드칩 / 1줄설명                │
 │   [상세보기] [예약하기] [길찾기(카카오맵)] │
 └────────────────────────────────────────────┘
```

- 마커 표시: 사용자 위치 권한 → 현위치 중심 + 반경 필터(지역 하드필터와 동일 `region_code`). 시니어 배려로 **마커·핀·텍스트 크게**, 클러스터링은 과밀 시에만.
- [예약하기]는 5.3 결제 흐름으로 연결, [상세보기]는 활동 상세, [길찾기]는 카카오맵 길찾기 딥링크/URL 스킴.
- 좌표 미보유 파트너는 주소→지오코딩(카카오 로컬 API) 배치로 보강.

---

### 5.5 커뮤니티 / 실시간

#### 5.5.1 Supabase Realtime 적용 범위

| 기능 | Realtime 방식 | 테이블/채널 |
|---|---|---|
| 피드(활동 공유) | Postgres Changes 구독(insert) + 페이지네이션 | `posts` |
| 댓글 | Postgres Changes(해당 post 채널) | `comments` |
| 동행모집 | Changes + presence(참여중 표시) | `companion_recruits`, `recruit_members` |
| 좋아요/반응 카운트 | Broadcast 또는 집계 트리거 | `reactions` |
| 알림(뱃지획득/댓글) | Realtime + 푸시 폴백 | `notifications` |

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id),
  body text, media_paths text[],     -- community-media 버킷 path
  status text check (status in ('public','blinded','deleted')) default 'public',
  created_at timestamptz default now()
);
create table public.companion_recruits (   -- 동행모집
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id),
  activity_id uuid references public.activities(id),
  meet_at timestamptz, capacity smallint, region_code text,
  status text check (status in ('open','closed','done')) default 'open'
);
```

```
클라이언트 구독 패턴:
supabase.channel('feed')
  .on('postgres_changes', {event:'INSERT', schema:'public', table:'posts',
       filter:'status=eq.public'}, push)
  .subscribe()
// 동행모집 정원 변화는 presence + DB 트리거로 'open→closed' 자동 전환
```

#### 5.5.2 게이미피케이션 (뱃지 / 인증마크) 이벤트 처리

차별점(지속성 확보) 핵심. **이벤트 소싱형**으로 처리.

```
사용자 행동(예약완료/인증샷업로드/동행참여/연속기록)
   └─▶ activity_log(insert) ──트리거/cron──▶ [Edge: gamify-eval]
                                              규칙엔진(rules 테이블) 평가
                                              조건 충족 → user_badges insert
                                              → notifications insert(Realtime로 즉시 표시)
```

| 뱃지/마크 | 트리거 조건 | 발급 |
|---|---|---|
| 첫 체험 완료 | 첫 `orders.status=settled` | `first_experience` |
| 인증마크 | `verification` 인증샷 + 모더 승인 | 활동별 인증 |
| 동행 리더 | 동행모집 3회 호스팅 | `companion_leader` |
| 꾸준함 | 4주 연속 기록 | `streak_4w` |

- 규칙은 코드 하드코딩이 아니라 `rules`(JSON 조건) 테이블로 두어 마케팅/운영이 추가 가능하게 설계.
- 부정 발급 방지: 발급은 **service_role(Edge) 단독**, 클라이언트 직접 insert 금지(RLS).

#### 5.5.3 신고 / 차단 / 모더레이션 (시니어 안전)

```sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id),
  target_type text check (target_type in ('post','comment','user')),
  target_id uuid, reason text, created_at timestamptz default now()
);
create table public.blocks (
  blocker uuid references public.profiles(id),
  blocked uuid references public.profiles(id),
  primary key (blocker, blocked)
);
```

- **자동 블라인드:** 동일 콘텐츠 신고 N건(예: 3) 도달 시 `moderation-action`이 `status=blinded` 처리 + 모더레이터 알림.
- **차단:** 차단 시 RLS/뷰에서 상대 콘텐츠 미노출(피드 쿼리에 `not in (select blocked ...)`).
- **시니어 안전 강화:** 욕설/금융사기·외부결제 유도 키워드 필터(간단 사전 + 향후 분류기), 1:1 DM은 MVP 비활성(피드/댓글 공개 중심), 미성년/이상거래 신고 단축 버튼.
- 모더레이터용 별도 관리 화면(차후) — MVP에선 Supabase Studio + 간단 관리뷰.

---

### 5.6 보안 · 개인정보

#### 5.6.1 개인정보보호법 준수

| 항목 | 설계 |
|---|---|
| **최소수집** | 생년월일 대신 **연령대(birth_year)**, 정밀주소 대신 **시군구 코드**. 카드정보 미보관. |
| **수집·이용 동의 UX** | 필수/선택 동의 **분리 체크**(전체동의 강제 금지=다크패턴 금지). 시니어용 큰 글씨·쉬운 말 요약 + 상세 펼치기. |
| **마케팅 수신동의** | 별도 옵트인(기본 해제). 알림톡/푸시 발송 근거 보관. |
| **보관기간** | 회원정보: 탈퇴 후 즉시/법정 보존분만 분리보관. 전자상거래 기록: 계약·청약철회 5년, 결제 5년, 소비자불만 3년(전자상거래법). 로그·접속기록: 통신비밀보호법상 보존. |
| **파기** | 보관기간 만료 시 자동 파기 배치(`pg_cron`), 비식별/삭제 로그 보존. |
| **열람·정정·삭제권** | 마이페이지에서 본인정보 내려받기/삭제 요청(탈퇴=`on delete cascade`로 데이터 연쇄삭제, 단 법정보존분 제외). |
| **위탁/제3자 제공** | Supabase(해외 인프라), PG, 카카오, 카카오맵, 메일 발송사 등 **처리위탁 현황·국외이전 고지** 필수. |
| **개인정보처리방침** | 공개 페이지 게시. 책임자 지정. |

> **국외이전 고지:** Supabase 리전이 서울이어도 운영 주체/지원 인프라가 국외일 수 있어 **국외이전 동의/고지**를 보수적으로 포함. **[가정]** 법무 검토 후 확정.

#### 5.6.2 결제정보 PCI — PG 위임

- 카드번호·CVC·유효기간은 **PG 결제창/위젯에서만 입력**되고 우리 시스템을 통과하지 않음 → PCI-DSS 범위 최소화(SAQ-A 수준 목표).
- 우리 DB는 `pg_payment_key`, 금액, 상태만 보관. 영수증/카드사명 등 비민감 메타만.

#### 5.6.3 RLS (Row Level Security) — 전 테이블 기본 활성

```sql
alter table public.profiles enable row level security;
create policy "own_profile_rw" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.orders enable row level security;
create policy "own_orders_read" on public.orders
  for select to authenticated using (user_id = auth.uid());
-- 주문 '쓰기'는 클라이언트 금지: Edge(service_role)만 insert/update

alter table public.posts enable row level security;
create policy "public_posts_read" on public.posts
  for select using (status = 'public' or author_id = auth.uid());
create policy "author_write" on public.posts
  for insert to authenticated with check (author_id = auth.uid());
```

| 원칙 | 적용 |
|---|---|
| 기본 거부 | 모든 테이블 RLS on, 정책 없으면 접근 불가 |
| 금전·발급·정산 | 클라이언트 직접 변경 금지 → **service_role Edge Function 단독** |
| 진단/추천 | 본인 데이터만 read, 활동 마스터는 공개 read |
| 차단 반영 | 피드/댓글 select 정책에 block 필터 |

#### 5.6.4 시니어 대상 다크패턴 금지 · 전자상거래법 고지

- **금지:** 전체동의 강제, 숨겨진 자동결제·자동갱신, 해지 어렵게 하기, 오인 유도 버튼색(취소를 회색·작게/결제를 거대하게 등), 카운트다운 압박.
- **필수 고지:** 사업자정보(상호/대표/사업자번호/통신판매업신고/연락처) 푸터 상시 노출, 가격·수수료·환불정책 결제 전 명확 표시, 청약철회 안내.
- **결제 전 요약 화면:** 총액·수수료·환불조건을 큰 글씨로 재고지 후 [동의하고 결제].

#### 5.6.5 접근성(시니어/법적 의무 정합)

- 디자인 브리프(큰 글씨/큰 터치영역/단순 동선)와 정합해 **WCAG 2.1 AA** 지향: 명도대비, 최소 터치 44×44pt, 폰트 스케일 대응(senior_mode), 스크린리더 레이블.
- 한국 웹접근성 인증마크(KWCAG)는 향후 목표. PWA부터 시맨틱·대체텍스트 준수.

#### 5.6.6 운영 보안

- 시크릿 분리(5.1.6), 서비스롤 키 격리, webhook 서명검증, 멱등키, 감사로그(`audit_log`), Sentry 에러 추적, 의존성 취약점 점검, 백업/PITR(Pro).

---

### 5.7 인프라 비용 추정 (MVP 300만원 / 인프라 250만원·4개월 적합성)

> 예산 배분(브리프): 인프라 35% / 마케팅·고객확보 40% / 운영·파트너십 25%. MVP 개발 250만원 = 4개월 × 서버 등 인프라, 광고 50만원.

#### 5.7.1 MVP 4개월 인프라 월별 비용

| 항목 | 플랜 | 월 비용(KRW) | 비고 |
|---|---|---|---|
| Supabase | **Pro** $25/월 ≈ 34,500 | 34,500 | DB+Auth+Storage+Realtime+Edge 포함, 8GB DB·100GB 전송·일일백업 |
| 웹 호스팅(**Cloudflare Pages 확정**) | Free (무제한 대역폭·상업용 허용) | **0** | 영리 서비스도 무료, 트래픽 폭증해도 추가비용 없음 |
| 도메인(feellog.app 등) | 연 1.5~3만 | ≈ 2,000/월 | 연 단위 |
| 카카오맵/카카오 로그인 | 무료 쿼터 내 | 0 | 무료 한도 내 운영 |
| 메일 발송(Resend/SES) | Free tier | 0 | 저볼륨 무료 |
| Sentry | Developer Free | 0 | 무료 |
| EAS(앱 빌드) | 웹 우선이라 MVP 미사용 | 0 | 앱 단계에서 $0(무료빌드 한도)~$19 |
| **월 합계** | | **약 36,500 ~ 64,000** | |

| 시나리오 | 월 비용 | 4개월 총액 | 250만원 예산 대비 |
|---|---|---|---|
| **알뜰(Supabase Pro만 유료)** | ≈ 36,500 | **≈ 146,000** | 250만원 대비 **여유 큼** |
| **극초기(Supabase도 Free)** | ≈ 2,000 | **≈ 8,000** | 도메인값만 — 사실상 0원 시작 가능 |

→ **결론: MVP 인프라 실비는 4개월 15~26만원 수준으로, "인프라 250만원" 예산은 충분.** 인프라 250만원은 순수 클라우드 요금이라기보다 **개발 기간 운영비(서버+α)** 항목으로 해석되며, 잔여는 추가 SaaS(분석/모더레이션)·예비비로 배정 가능.

| 재배분 제안 | 금액 | 용도 |
|---|---|---|
| 실 클라우드 요금(4개월) | ~30만원 | Supabase Pro + 도메인 + 여유 |
| PG/결제 테스트·정산 셋업 | ~30만원 | 사업자/PG 가입·테스트 |
| 모니터링·분석·보안 SaaS | ~40만원 | 필요시 유료 전환 |
| 예비비/버퍼 | ~150만원 | 트래픽 급증·추가 스토리지·이미지 변환 초과분 |

> **[가정]** 카카오맵/메일/Sentry 무료 한도 내 운영 가능. 한도 초과 시 예비비에서 충당.

#### 5.7.2 확장 시 비용 곡선

| 단계 | MAU(가정) | 월 인프라(KRW) | 주 비용동인 |
|---|---|---|---|
| MVP/베타 | ~1천 | 3.5만~6만 | Supabase Pro 고정 |
| 초기 성장 | ~1만 | 10만~25만 | Storage(이미지)·전송량·Edge 호출, Vercel Pro |
| 성장 | ~5만 | 40만~90만 | DB 컴퓨트 업그레이드, 이미지 변환량, Realtime 동시접속 |
| 확장 | ~20만+ | 150만~400만+ | 읽기 복제·캐시(CF Images), pgvector 추천, 자체 예약·결제 인프라 |

```
월 인프라 비용 (KRW)
400만 ┤                                          ╭── 자체 예약·결제+pgvector(7000만 고도화 단계)
      │                                      ╭───╯
150만 ┤                              ╭───────╯
      │                      ╭──────╯  (Storage/전송/Realtime 동시접속이 주동인)
 25만 ┤            ╭────────╯
      │      ╭────╯
3.5만 ┤──────╯ (MVP: Supabase Pro 고정비 중심, 거의 평탄)
      └────────┬────────┬────────┬────────┬────────▶ MAU
              1천      1만       5만      20만
```

- 비용 급증 변곡점: **(1) 이미지/미디어 전송량**(카드·피드), **(2) Realtime 동시접속**(커뮤니티 활성), **(3) Edge Function 호출수**(추천 빈도). 각각 **CDN 캐시·이미지 사전 다운스케일·추천 결과 캐싱**으로 곡선 완만화.
- 고도화(브리프 7000만원: AI 추천 정밀화+보안+자체 예약·결제) 진입 시 pgvector·읽기복제·전용 컴퓨트로 단계 상향. 그 전까지는 **Supabase 단일 의존으로 고정비 최소화**가 예산 최적.

#### 5.7.3 비용 절감 운영 수칙

| 수칙 | 효과 |
|---|---|
| 업로드 전 클라 다운스케일(WebP) | Storage 용량·변환·전송 ↓ |
| 추천 결과 단기 캐시(유저별 N분) | Edge 호출·DB부하 ↓ |
| 이미지 변환 프리셋 고정(5.1.4) | 변환 종류 폭증 방지 |
| 무료 한도 모니터링 알림 | 초과 과금 사전 차단 |
| dev/stg는 무료 티어 | 운영비 절감 |

---

> **섹션 정합성 메모:** 본 섹션의 인증(5.2)·추천 RPC(5.1.5)·결제(5.3)·스케일 통일 규칙은 합의된 기술 결정 및 3·4섹션의 진단/추천 스펙과 일관되며, 자체 추천(경량 5축 매칭 + 피드백 보정)은 Edge Function/Postgres에서 동작하고 미래 pgvector 확장 경로를 5.7.2에 반영했다.

---

## 6. 활동/공방 데이터 구축 · 콘텐츠 운영 · 파트너 온보딩

> 이 섹션은 추천 엔진(5축 벡터 매칭 + 최근접 중심 분류 + 피드백 온라인 보정)의 **연료**가 되는 활동(클래스) 데이터셋과, 그 데이터를 만들어내고 유지하는 **콘텐츠 운영 체계 · 파트너 온보딩 파이프라인**을 구현 가능한 수준으로 정의한다. 모든 점수/벡터 스케일은 합의된 기술 결정에 맞춰 사용자·활동 태그는 **-100~+100**, 6유형 중심값은 브리프의 -25~+25 초안을 **×4로 정규화하여 -100~+100로 통일**한다(8장 추천 엔진 설계와 정합). 저장소는 Supabase(Postgres + Storage), 태깅/검수 워크플로는 파트너 어드민 + 내부 운영 콘솔에서 수행한다.

---

### 6.0 데이터 구축 철학 — "성향 테스트와 활동 카드는 활동/공방 데이터를 만들고 정리하면서 함께 구축된다"

스크린샷 메모대로, 활동 데이터셋과 진단/추천 콘텐츠는 분리된 작업이 아니라 **하나의 데이터 구축 사이클**이다.

```
┌──────────────────────────────────────────────────────────────────────┐
│  활동/공방 데이터 구축 사이클 (Data-Content Co-construction)            │
│                                                                        │
│   [1] 활동 소싱        →  [2] 5축 루브릭 태깅  →  [3] 검수/합의        │
│   (공방·문화센터)         (평가자 2~3인)          (운영 리드 최종승인) │
│        │                       │                       │              │
│        ▼                       ▼                       ▼              │
│   카드 카피/이미지       12문항 이미지 자산       6유형 중심값 보정    │
│   톤앤매너 정리          제작/소싱(축별 대비쌍)   (실데이터로 재계산)  │
│        │                       │                       │              │
│        └───────────────────────┴───────────────────────┘             │
│                          ▼                                            │
│              추천 엔진에 투입 → 사용자 카드 반응 수집                  │
│              → 태그 가중치/중심값 보정(8장) → 다시 [2]로 환류         │
└──────────────────────────────────────────────────────────────────────┘
```

핵심 원칙:
- **태깅 루브릭이 진단 문항과 같은 5축을 공유**하므로, 활동을 태깅하는 과정에서 12문항의 대비쌍(예: "만들기 vs 감상")이 자연스럽게 검증·보정된다.
- 활동 카드의 키워드 칩은 **5축 태그 점수에서 자동 파생**(6.6 규칙)되어, 카피 작성과 태깅이 일관된다.
- 모든 활동·태그·검수 이력은 버전 관리(`scored_at`, `scoring_version`)되어 추천 정확도 회귀 분석이 가능하다.

---

### 6.1 활동 데이터 스키마와 메타데이터 (요구사항 a)

#### 6.1.1 논리 데이터 모델 (ERD)

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   partners      │1      *│     activities       │*      1│  categories     │
│ (체험처/공방)   ├────────┤   (활동/클래스)       ├────────┤ (택소노미)      │
└─────────────────┘        └──────────┬───────────┘        └─────────────────┘
                                      │1                            
                            ┌─────────┴─────────┐                  
                          *↓                   *↓                  
              ┌────────────────────┐  ┌──────────────────────┐    
              │ activity_axis_scores│  │  activity_media      │    
              │ (5축 점수 + 검수)   │  │  (이미지/썸네일)     │    
              └────────────────────┘  └──────────────────────┘    
                                      │1                          
                            ┌─────────┴─────────┐                 
                          *↓                   *↓                 
              ┌────────────────────┐  ┌──────────────────────┐   
              │ activity_keywords  │  │  activity_schedules  │   
              │ (키워드 칩)        │  │  (회차/정원/예약링크)│   
              └────────────────────┘  └──────────────────────┘   
                                                                  
              ┌────────────────────┐  ┌──────────────────────┐   
              │ activity_reviews   │  │ activity_card_events │   
              │ (후기/평점)        │  │ (좋아요/관심없음 로그)│  
              └────────────────────┘  └──────────────────────┘   
```

#### 6.1.2 핵심 테이블 정의 (PostgreSQL / Supabase)

```sql
-- 6.1.2.1 활동(클래스) 마스터
CREATE TABLE activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        uuid NOT NULL REFERENCES partners(id),
  category_id       uuid NOT NULL REFERENCES categories(id),

  -- (a) 카드 노출 메타데이터
  title             text NOT NULL,                 -- 제목 (예: "흙으로 빚는 나만의 머그컵")
  one_liner         text NOT NULL,                 -- 1줄 설명 (시니어 친화, 35자 내외)
  description       text,                          -- 상세 본문
  hero_image_id     uuid REFERENCES activity_media(id), -- 대표 이미지

  -- 지역
  region_sido       text NOT NULL,                 -- 시/도 (예: "서울특별시")
  region_sigungu    text NOT NULL,                 -- 시군구 (예: "마포구")
  address           text,                          -- 상세 주소
  lat               double precision,              -- 카카오맵 핀
  lng               double precision,

  -- 가격/시간
  price_krw         integer NOT NULL,              -- 1인 기준 가격(원). 0=무료
  price_unit        text DEFAULT '1인 1회',        -- 가격 단위 표기
  duration_min      integer NOT NULL,              -- 소요 시간(분)

  -- 하드 필터용 속성 (8장 추천 1단계 필터)
  difficulty        smallint NOT NULL,             -- 난이도 1(입문)~5(전문)
  physical_intensity smallint NOT NULL,            -- 신체강도 1(거의없음)~5(고강도)
  indoor_outdoor    text NOT NULL,                 -- 'indoor'|'outdoor'|'both'
  capacity_min      smallint,                      -- 최소 정원
  capacity_max      smallint,                      -- 최대 정원
  senior_friendly_flags jsonb DEFAULT '{}',        -- {wheelchair:true, hearing_aid:true, ...}

  -- 예약/외부 연동
  booking_url       text,                          -- 예약 링크(외부 or 자체)
  booking_type      text DEFAULT 'external',       -- 'external'|'internal'|'inquiry'
  channel_flags     jsonb DEFAULT '{}',            -- {kakao_gift:true, naver_store:true}

  -- 운영/상태
  status            text NOT NULL DEFAULT 'draft', -- draft|tagging|review|published|paused|archived
  scoring_version   text,                          -- 태깅 루브릭 버전 (예: 'v1.2')
  created_by        uuid REFERENCES profiles(id),
  created_at        timestamptz DEFAULT now(),
  published_at      timestamptz,

  CONSTRAINT chk_difficulty CHECK (difficulty BETWEEN 1 AND 5),
  CONSTRAINT chk_intensity  CHECK (physical_intensity BETWEEN 1 AND 5)
);
CREATE INDEX idx_activities_filter
  ON activities (status, region_sido, region_sigungu, price_krw, physical_intensity);

-- 6.1.2.2 5축 점수 (검수/합의 이력 포함) — 추천 매칭의 핵심
CREATE TABLE activity_axis_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id     uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,

  -- 5축 (-100 ~ +100), 8장 매칭 벡터와 동일 순서
  axis_rhythm     smallint NOT NULL,  -- 활동리듬: 활동적(+) ↔ 차분함(-)
  axis_relation   smallint NOT NULL,  -- 관계방식: 교류(+) ↔ 독립(-)
  axis_experience smallint NOT NULL,  -- 경험선호: 새로움(+) ↔ 익숙함(-)
  axis_participation smallint NOT NULL,-- 참여방식: 만들기(+) ↔ 감상(-)
  axis_reward     smallint NOT NULL,  -- 기대보상: 실용·성취(+) ↔ 정서·회복(-)

  -- 검수/합의 메타
  status          text NOT NULL DEFAULT 'proposed', -- proposed|agreed|final
  scoring_version text NOT NULL,
  rater_scores    jsonb,              -- [{rater_id, axes:{...}, rated_at}] 다중 평가자 원본
  variance        jsonb,              -- 축별 평가자 간 분산(검수 트리거용)
  reviewed_by     uuid REFERENCES profiles(id),
  is_current      boolean DEFAULT true,
  scored_at       timestamptz DEFAULT now(),

  CONSTRAINT chk_axis_range CHECK (
    axis_rhythm BETWEEN -100 AND 100 AND
    axis_relation BETWEEN -100 AND 100 AND
    axis_experience BETWEEN -100 AND 100 AND
    axis_participation BETWEEN -100 AND 100 AND
    axis_reward BETWEEN -100 AND 100
  )
);
CREATE UNIQUE INDEX uq_axis_current
  ON activity_axis_scores (activity_id) WHERE is_current;

-- 6.1.2.3 키워드 칩 (카드 노출, 5축에서 일부 자동 파생)
CREATE TABLE activity_keywords (
  activity_id  uuid REFERENCES activities(id) ON DELETE CASCADE,
  keyword      text NOT NULL,        -- 예: "만들기", "차분한 몰입", "결과물 만족"
  source       text DEFAULT 'auto',  -- 'auto'(축 파생) | 'manual'
  PRIMARY KEY (activity_id, keyword)
);

-- 6.1.2.4 미디어 (Supabase Storage 경로)
CREATE TABLE activity_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  uuid REFERENCES activities(id) ON DELETE CASCADE,
  storage_path text NOT NULL,        -- storage 버킷 경로
  kind         text DEFAULT 'photo', -- photo|thumb|illustration
  alt_text     text,                 -- 접근성 대체 텍스트(시니어/스크린리더)
  license      text,                 -- 'partner_provided'|'cc0'|'purchased'|'self_shot'
  license_ref  text,                 -- 출처/라이선스 증빙 URL
  ord          smallint DEFAULT 0
);

-- 6.1.2.5 회차/정원/예약
CREATE TABLE activity_schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  uuid REFERENCES activities(id) ON DELETE CASCADE,
  starts_at    timestamptz NOT NULL,
  seats_total  smallint,
  seats_left   smallint,
  booking_url  text                  -- 회차별 예약 링크(우선) → 없으면 activities.booking_url
);

-- 6.1.2.6 후기/평점 (콘텐츠 운영 환류)
CREATE TABLE activity_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  uuid REFERENCES activities(id),
  user_id      uuid REFERENCES profiles(id),
  rating       smallint CHECK (rating BETWEEN 1 AND 5),
  body         text,
  axis_feedback jsonb,               -- 선택: 사용자가 느낀 축(예: 생각보다 만들기 비중 높음)
  status       text DEFAULT 'visible', -- visible|hidden|reported
  created_at   timestamptz DEFAULT now()
);
```

#### 6.1.3 메타데이터 필드 정의 표 (운영자/파트너 입력 가이드)

| 필드 | 타입 | 필수 | 입력 규칙 / 예시 | 카드 노출 |
|------|------|:---:|------------------|:---:|
| title 제목 | text | ● | 명사형, 18자 내외. "흙으로 빚는 나만의 머그컵" | ● |
| one_liner 1줄설명 | text | ● | 35자 내외, 시니어 친화 존댓말. "천천히 흙을 만지며 마음까지 차분해지는 시간" | ● |
| hero_image 이미지 | media | ● | 4:3, 1200px 이상, 손/결과물·웃는 시니어 중심 | ● |
| region 지역 | text | ● | 시/도 + 시군구 (카카오맵 지오코딩 자동 보완) | ● |
| price_krw 가격 | int | ● | 1인 1회 기준, VAT 포함. 무료=0 | ● |
| duration_min 소요시간 | int | ● | 분 단위. 카드엔 "약 2시간"으로 변환 노출 | ● |
| difficulty 난이도 | 1~5 | ● | 1 입문(준비물 무) ~ 5 전문(선수지식 필요) | △(아이콘) |
| physical_intensity 신체강도 | 1~5 | ● | 1 앉아서 / 3 가볍게 서서 / 5 등산·고강도 (시니어 필터 핵심) | △(아이콘) |
| capacity 정원 | int | ○ | min~max. 소수 정원이면 "교류형" 카피 강화 | ○ |
| booking_url 예약링크 | url | ● | 외부 예약 페이지 또는 자체 예약. 깨진 링크 자동 점검(6.5) | ●(버튼) |
| keyword_chips 키워드칩 | text[] | ● | 3~4개, 5축 파생 + 수동 1개. (6.6 규칙) | ● |
| 5축 점수 | int×5 | ● | -100~+100, 루브릭(6.2) 적용, 평가자 2~3인 | ✕(내부) |

---

### 6.2 5축 태깅 루브릭 + 12문항 이미지 자산 가이드 (요구사항 b)

#### 6.2.1 스케일 통일 원칙

| 대상 | 스케일 | 비고 |
|------|--------|------|
| 사용자 진단 결과(5축) | -100 ~ +100 | 12문항 환산(8장) |
| 활동 태그(5축) | -100 ~ +100 | 본 루브릭으로 부여 |
| 6유형 중심 벡터 | -100 ~ +100 | 브리프 -25~+25 초안 **×4 정규화** |

> **[가정]** 브리프 6유형 중심값(-25~+25)은 가중치 초안이므로, 추천 엔진 일관성을 위해 ×4 하여 동일 -100~+100 공간에 둔다. 예: 활력 탐험형 활동리듬 +25 → **+100**. 추후 6.5의 실데이터(카드 반응)로 중심값을 재추정한다(8장과 연동).

#### 6.2.2 축별 평가 기준표 (앵커 루브릭)

각 축은 **-100~+100를 5개 앵커 구간**으로 끊어 평가자가 "정성→정량" 매핑하도록 한다. 앵커 사이는 평가자 재량(예: +60).

##### 축 1. 활동 리듬 — 활동적(+) ↔ 차분함(-)
| 점수 앵커 | 정의 (관찰 가능한 기준) | 예시 활동 |
|:---:|------|------|
| +100 | 지속적 큰 움직임·이동·심박 상승. 야외·체력 소모 큼 | 등산, 자전거 투어 |
| +50 | 자주 서고 움직이나 강도 중간. 장소 이동 일부 | 야간 산책, 플로깅 |
| 0 | 앉기/서기 혼합, 신체 부담 거의 없음 | 베이킹, 요리 |
| -50 | 대부분 앉아서 진행, 손작업 위주 | 드로잉, 터프팅 |
| -100 | 정적·집중·명상적. 신체 거의 정지 | 명상 다도, 서예 |

##### 축 2. 관계 방식 — 교류(+) ↔ 독립(-)
| 점수 앵커 | 정의 | 예시 |
|:---:|------|------|
| +100 | 대화·협업이 활동의 본질. 모임 자체가 목적 | 독서 모임, 다도 모임 |
| +50 | 그룹 진행이나 작업은 개별 | 그룹 베이킹 클래스 |
| 0 | 그룹/개인 모두 가능, 상호작용 선택적 | 전시 관람(동행 가능) |
| -50 | 개인 집중 위주, 강사 1:n 최소 소통 | 도자기 물레 |
| -100 | 완전 단독·몰입. 타인 개입 불필요 | 1인 드로잉, 명상 |

##### 축 3. 경험 선호 — 새로움(+) ↔ 익숙함(-)
| 점수 앵커 | 정의 | 예시 |
|:---:|------|------|
| +100 | 트렌디·화제성·생소한 감각. SNS 인증 욕구 자극 | 미디어아트 전시, 신상 체험 |
| +50 | 비교적 새롭지만 진입장벽 낮음 | 터프팅, 향수 공방 |
| 0 | 무난·보편 | 요리 클래스 |
| -50 | 전통/정감/익숙 | 다도, 한지공예 |
| -100 | 고전적·전통·예스러움 | 서예, 전통 차 |

##### 축 4. 참여 방식 — 만들기(+) ↔ 감상(-)
| 점수 앵커 | 정의 | 예시 |
|:---:|------|------|
| +100 | 손으로 직접 제작, 결과물 소유 | 목공, 도자기, 터프팅 |
| +50 | 만들되 가이드 의존 큼 | 원데이 베이킹 |
| 0 | 만들기·감상 혼합 | 쿠킹 시연+시식 |
| -50 | 주로 보고 듣되 약간 참여 | 클래식 해설 음악회 |
| -100 | 순수 감상·관람 | 전시 관람, 연극 |

##### 축 5. 기대 보상 — 실용·성취(+) ↔ 정서·회복(-)
| 점수 앵커 | 정의 | 예시 |
|:---:|------|------|
| +100 | 일상 활용·기술 습득·성과 명확 | 정리수납, 실용 요리 |
| +50 | 결과물이 남고 약간 실용 | 목공(가구) |
| 0 | 실용/정서 균형 | 홈카페 |
| -50 | 정서·힐링 위주, 활용도 낮음 | 드로잉, 전시 |
| -100 | 순수 회복·이완·감정 충전 | 명상, 사운드 테라피 |

#### 6.2.3 태깅 검수 프로세스 (다중 평가자 합의)

```
[1] 평가자 배정     2~3인(콘텐츠 담당 예민 + 운영 변준 + 외부 검수자 1)
        │
        ▼
[2] 독립 채점       각자 루브릭 보며 5축 -100~+100 독립 입력 (서로 미공개)
        │            → activity_axis_scores.rater_scores 누적
        ▼
[3] 분산 점검       축별 |max-min| 계산
        │            ├─ ≤ 25  → 자동 평균(소수 반올림) = 합의값 (status=agreed)
        │            └─ > 25  → [4] 합의 회의로 이관
        ▼
[4] 합의 회의       이견 축만 토론, 루브릭 앵커 근거로 재합의 → status=agreed
        │
        ▼
[5] 리드 최종승인   운영 리드가 6유형 중심값과 정합성 sanity check
        │            (예: "도자기인데 만들기축이 음수면 재검토") → status=final
        ▼
[6] 게시            activities.status=published, scoring_version 기록
```

분산 판정 규칙(코드):
```python
def consensus(rater_axes: list[dict]) -> dict:
    # rater_axes = [{rhythm:.., relation:.., ...}, ...]
    result, needs_meeting = {}, []
    for axis in ["rhythm","relation","experience","participation","reward"]:
        vals = [r[axis] for r in rater_axes]
        spread = max(vals) - min(vals)
        if spread <= 25:
            result[axis] = round(sum(vals)/len(vals))
        else:
            needs_meeting.append(axis)        # 합의 회의 대상
            result[axis] = round(sum(vals)/len(vals))  # 잠정 평균
    return {"axes": result, "needs_meeting": needs_meeting}
```

#### 6.2.4 12문항 이미지 자산 제작/소싱 가이드 (저작권 + 시니어 친화)

진단 12문항은 **각 문항당 좌/우 2장의 대비 이미지**가 필요(총 24장 + 보조 Q11 포함). 좌=음수 방향, 우=양수 방향으로 **축 대비가 직관적으로 읽혀야** 한다.

문항-이미지 대비쌍 매핑:

| 문항 | 축 | 좌(−) 이미지 컨셉 | 우(+) 이미지 컨셉 |
|------|----|----|----|
| Q1 | 경험선호 | 정감 있는 익숙한 카페 한 잔 | 화제의 새 감각 체험 공간 |
| Q2 | 활동리듬 | 앉아 집중하는 손작업 | 가볍게 걷는 야외 활동 |
| Q3 | 관계방식 | 혼자 조용히 몰입 | 여럿이 웃으며 함께 |
| Q4 | 참여방식 | 공연·전시 감상 | 손으로 직접 만들기 |
| Q5 | 기대보상 | 편안히 쉬는 정서적 휴식 | 배워서 활용하는 실용 결과물 |
| Q6 | 경험선호 | 편안·정감 공간 | 감각적·새로운 공간 |
| Q7 | 활동리듬 | 실내 조용한 집중 | 밖으로 나가 장소 전환 |
| Q8 | 관계방식 | 활동에 몰입하는 모습 | 대화하며 교류하는 모습 |
| Q9 | 기대보상 | 좋은 감정·경험이 남음 | 결과물이 남음 |
| Q10 | 기대보상 | 취향·즐거움 채우기 | 일상에 활용 |
| Q11 | 보조성향 | 편안하고 회복되는 시간 | 새롭고 감각적인 체험 |
| Q12 | 참여방식 | 전시·공연·음악 즐기기 | 나만의 것 만들기 |

이미지 제작/소싱 원칙:

| 항목 | 가이드 |
|------|------|
| **저작권 1순위** | 자체 촬영(파트너 공방 현장) + 파트너 제공(`license=partner_provided`, 서면 사용동의) |
| **저작권 2순위** | CC0/상업 무료(Unsplash, Pexels) — 단 인물 식별 가능 사진은 **모델 릴리즈 확인** |
| **저작권 3순위** | 유료 스톡(게티/셔터스톡) 또는 자체 라인 일러스트(디자인 담당) — 디자인 톤(파스텔·둥근·손글씨풍)과 통일 |
| **금지** | 출처 불명 웹 이미지, 타 플랫폼(오뉴·온다) 캡처, 워터마크 잔존 이미지 |
| **시니어 친화** | 큰 피사체·고대비·과한 클로즈업 회피. **시니어 모델 또는 손/결과물 중심**(특정 연령 배제 느낌 X), 텍스트 인-이미지 최소화(가독성은 별도 캡션 칩으로) |
| **대비 일관성** | 좌/우 이미지의 **구도·밝기·채도 톤 매칭**(한쪽만 화려하면 선택 편향). 동일 촬영/필터 프리셋 |
| **접근성** | 모든 이미지 `alt_text` 필수, 색맹 고려(파랑-코랄 대비는 안전), 12문항은 라인 일러스트 우선 권장(저작권·톤 통제 용이) |
| **자산 명세** | 1080×1080(정사각, 두 이미지 좌우 분할 레이아웃), WebP, ≤150KB, `assets/diagnosis/qXX_left|right.webp` |
| **증빙 관리** | `activity_media.license` + `license_ref`에 동의서/구매영수증 URL 보관, 분기 1회 라이선스 감사 |

> **권고**: MVP 단계 12문항은 **자체 라인 일러스트**로 통일하면 (1) 저작권 리스크 0, (2) 파스텔·손글씨풍 톤 일관, (3) 좌우 대비 통제가 쉽다. 활동 카드는 실사 위주(현장감), 진단은 일러스트 위주로 역할을 분리한다.

---

### 6.3 MVP 시드 데이터: 규모 · 수집 · 택소노미 (요구사항 c)

#### 6.3.1 시드 규모 목표

| 단계 | 활동 수 | 6유형 커버리지 | 지역 | 기간 |
|------|:---:|------|------|------|
| 알파(내부 테스트) | 30 | 6유형 각 5개 이상 | 서울 1~2개 구 집중 | ~2주 |
| **MVP 베타** | **50~100** | **6유형 균등 + 보조성향(트렌드/회복) 각 커버** | 서울/수도권 거점 3~4개 구 | ~6주 |
| 정식 출시 | 200+ | 전 유형 + 지역 확장 | 수도권 전역 | 출시 후 |

균형 목표(MVP 100개 기준 가이드):

| 6유형 | 목표 비중 | 대표 활동 시드 |
|------|:---:|------|
| 활력 탐험형 | ~15% | 트레킹, 야간 산책, 자전거 투어 |
| 고요 몰입형 | ~17% | 도자기, 서예, 드로잉 |
| 손끝 성취형 | ~18% | 목공, 터프팅, 베이킹 |
| 따뜻한 교류형 | ~17% | 다도 모임, 독서 모임, 그룹 클래스 |
| 생활 업그레이드형 | ~17% | 요리, 정리수납, 홈카페 |
| 문화 향유형 | ~16% | 전시, 클래식 음악회, 연극 |

> 보조성향 커버: **트렌드 발견**(경험선호 高 + 감각적 공간) 활동 ≥15개, **회복 충전**(기대보상 음수 + 차분) 활동 ≥15개를 별도 태깅 점검.

#### 6.3.2 수집 방법 (섭외 파이프라인)

```
소싱 채널                       1차 접촉                 전환
─────────────────────────────────────────────────────────────
지역 공방·문화센터(오프라인)  → QR/리플렛 + 방문 제안 → 입점 신청
  (변준 파트너 담당)              "효도 선물 채널 합류"
구청 평생학습관/복지관        → 공문/제휴 제안서       → 프로그램 데이터 수령
시니어 대상 원데이클래스 플랫폼 → 공개정보 큐레이션*    → 파트너 역제안
                               (*무단복제 금지, 직접 섭외)
기존 인스타 1.5만 팔로워망     → 예민 콘텐츠로 후보 발굴 → 입점 유도
```

수집 표준 절차:
1. **콜드 아웃리치**(변준): 제휴 제안서 + 수수료(10~15%)·노출 혜택 안내.
2. **현장 방문 촬영**(예민): hero 이미지·키워드 후보·1줄설명 초안 수집(`license=self_shot`).
3. **데이터 정규화**: 운영 콘솔 입력 → status `draft`.
4. **5축 태깅**(6.2 프로세스) → `review` → `published`.
5. **검증 리스트**: 예약 링크 유효, 가격·시간 정확, 신체강도 시니어 적합성 재확인.

#### 6.3.3 카테고리 택소노미 (6유형 매핑)

2단계 분류: **대분류(category) → 활동**. 각 카테고리는 **주(primary) 6유형 + 부(secondary) 유형**을 가진다(활동의 최종 유형은 5축 벡터 ↔ 6유형 중심 최근접으로 결정되나, 택소노미는 운영/탐색 필터용).

| 대분류 | 예시 활동 | 주 유형 | 부 유형 | 보조성향 경향 |
|------|------|------|------|------|
| 야외/신체 | 트레킹, 자전거, 산책 | 활력 탐험형 | — | 트렌드(코스에 따라) |
| 흙·공예(정적) | 도자기, 서예, 드로잉 | 고요 몰입형 | 손끝 성취형 | 회복 충전 |
| 핸드메이드 제작 | 목공, 터프팅, 가죽 | 손끝 성취형 | 고요 몰입형 | — |
| 모임·소통 | 다도 모임, 독서 모임 | 따뜻한 교류형 | 문화 향유형 | — |
| 생활·실용 | 요리, 정리수납, 홈카페 | 생활 업그레이드형 | 손끝 성취형 | — |
| 문화·감상 | 전시, 음악회, 연극 | 문화 향유형 | 따뜻한 교류형 | 트렌드(전시 따라) |
| 베이킹·식음 | 베이킹, 향수, 칵테일(무알콜) | 손끝 성취형 | 생활 업그레이드형 | 트렌드 |

```sql
CREATE TABLE categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  primary_type  text NOT NULL,    -- 6유형 코드
  secondary_type text,
  sub_tendency  text,             -- 'trend'|'recovery'|null
  ord           smallint
);
```

---

### 6.4 파트너(체험처) 온보딩 (요구사항 d)

#### 6.4.1 온보딩 파이프라인 (상태 흐름)

```
[입점 신청]──▶[자격 검증]──▶[활동 등록]──▶[5축 태깅]──▶[검수]──▶[노출]
   apply        verify         register      tagging      review     published
     │            │               │             │           │           │
 신청폼      사업자/안전     파트너 어드민   내부 운영팀  리드 승인   카드/검색
 (파트너)    /시니어적합성   (파트너 입력)   (예민/변준)  (스케일확인) 노출 시작
     │            │
     └─ 반려 시 사유 회신 ──┘   (실패 시 status=rejected, 재신청 가능)
```

상태 머신:
```
apply → verify → register → tagging → review → published
                                                   │
                                          paused ◀─┤ (파트너 요청/품질이슈)
                                        archived ◀─┘ (종료)
```

#### 6.4.2 단계별 책임/체크리스트

| 단계 | 담당 | 체크리스트 | 산출 |
|------|------|------|------|
| 입점 신청 | 파트너(변준 안내) | 상호·연락처·공방 위치·대표 활동·사진 | partners(draft) |
| 자격 검증 | 변준 | 사업자등록/시니어 안전(계단·화기·날카로운 도구 안내), 보험 여부 | partners(verified) |
| 활동 등록 | 파트너(어드민) | 제목/1줄/가격/시간/정원/예약링크/사진 | activities(draft) |
| 5축 태깅 | 예민+변준(+외부) | 루브릭 2~3인 채점 → 합의(6.2.3) | axis_scores(final) |
| 검수 | 운영 리드 | 스케일·중심값 정합, 링크 유효, 카피 톤 | activities(review) |
| 노출 | 시스템 | 추천/검색/카드 풀 편입, scoring_version 기록 | published |

#### 6.4.3 파트너용 간이 어드민 (MVP 범위)

> **[가정]** MVP 예산(인프라 250만원/4개월)을 고려, 별도 어드민 앱 대신 **Supabase RLS + 동일 Expo 코드의 파트너 모드 화면**(웹 우선)으로 구현. 파트너는 본인 `partner_id` 데이터만 RLS로 접근.

기능 범위:

| 기능 | 파트너 | 내부 운영 | 비고 |
|------|:---:|:---:|------|
| 활동 등록/수정(메타·사진·회차) | ● | ● | 5축은 파트너 미노출(내부만) |
| 예약 링크/정원 갱신 | ● | ● | 깨진 링크 알림 수신 |
| 노출 상태 보기(draft/review/published) | ● | ● | 사유 표시 |
| 5축 점수 입력/합의 | ✕ | ● | 객관성 위해 내부 전담 |
| 후기/평점 열람 | ● | ● | 답글은 운영 검토 후 |
| 정산 내역 조회 | ● | ● | 6.4.4 |

RLS 예시:
```sql
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_own_rows ON activities
  FOR ALL USING (
    partner_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
-- 5축 점수는 파트너에게 SELECT 미허용(내부 role만)
CREATE POLICY internal_only_scores ON activity_axis_scores
  FOR ALL USING (auth.jwt()->>'role' = 'ops');
```

#### 6.4.4 수수료/정산 안내

| 항목 | 내용 |
|------|------|
| 수수료율 | 예약 결제 매칭 **10~15%** (활동 유형/볼륨별 차등, 계약 시 확정) |
| 과금 시점 | 예약 **확정·정상 진행** 건 기준 (노쇼·환불 건 제외) |
| 정산 주기 | **월 1회**, 익월 10일 전월 분 정산 (MVP는 수기 정산표 → 추후 PG 자동) |
| 정산 채널 | 자체 예약(토스페이먼츠/포트원) 건은 자동 집계, 외부 링크 건은 파트너 신고+검증 |
| 외부 채널 | 카카오 선물하기/네이버 스마트스토어 기프티콘은 채널 정책 별도(채널 수수료 + 필로그 매칭) |
| 투명성 | 어드민 정산 화면에 건별 (활동·금액·수수료·정산액) 명세 제공 |

정산 데이터(MVP 최소):
```sql
CREATE TABLE settlements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    uuid REFERENCES partners(id),
  period_month  date,                 -- 정산 월(1일)
  gross_krw     bigint,               -- 총 거래액
  fee_rate      numeric(4,3),         -- 0.100 ~ 0.150
  fee_krw       bigint,               -- 수수료
  payout_krw    bigint,               -- 지급액
  status        text DEFAULT 'pending'-- pending|confirmed|paid
);
```

---

### 6.5 콘텐츠 운영 루틴 (요구사항 e)

#### 6.5.1 운영 주기 (스프린트 루틴)

| 주기 | 작업 | 담당 | 산출/지표 |
|------|------|------|------|
| 매일 | 신규 입점 신청 확인, 예약 링크 헬스체크(자동), 신고 후기 모니터 | 변준 | 미처리 큐 0 |
| 매주 | 신규 활동 5축 태깅·합의, 카드 카피 검수, 후기·평점 반영 | 예민+변준 | 주당 신규 ≥10개 published |
| 격주 | 추천 보정 모니터링(카드 반응 vs 태그 정합), 이상 활동 재태깅 | 서준형+예민 | 좋아요율·매칭편차 리포트 |
| 매월 | 6유형 중심값 재추정 검토, 라이선스 감사, 파트너 정산 | 팀 전체 | 중심값 버전 갱신 |

#### 6.5.2 품질관리(QA) 게이트

```
신규/수정 활동
   │
   ├─[자동] 필수필드·이미지 해상도·예약링크 200 OK·욕설/금지어 필터
   │            └─ 실패 → status 유지(draft), 파트너에게 보완 요청
   │
   ├─[수동] 5축 합의(분산 ≤25) + 6유형 sanity check
   │            └─ 도자기인데 참여축<0 → 재검토 (루브릭 위반 플래그)
   │
   └─[게시 후] 카드 반응·후기 모니터 → 이상 시 재태깅 트리거
```

#### 6.5.3 후기/평점 → 추천 보정 환류

```
후기/평점(activity_reviews) + 카드반응(activity_card_events)
        │
        ▼
[집계] 활동별 좋아요율, 평균 평점, axis_feedback 빈도
        │
        ├─ 평점 < 3.0 또는 좋아요율 하위 10% → 품질 검토 큐
        │
        ├─ axis_feedback 다수 "예상과 다름" → 5축 재태깅 트리거
        │     (예: "감상인 줄 알았는데 만들기 비중 큼" 반복 → 참여축 상향)
        │
        └─ 정상 → 추천 가중치 정상 반영(8장 온라인 보정)
```

#### 6.5.4 추천 보정 모니터링 (데이터 → 의사결정)

| 모니터 지표 | 정의 | 임계/액션 |
|------|------|------|
| 카드 좋아요율 | 좋아요/(좋아요+관심없음) | 유형 평균 대비 ±2σ 이탈 시 태그 점검 |
| 매칭-반응 정합도 | 매칭점수 상위인데 관심없음 多 | 해당 활동 재태깅 또는 중심값 재추정 |
| 보조성향 적중 | 트렌드/회복 부여 사용자의 해당 칩 카드 반응 | 낮으면 보조성향 산출식 재검토 |
| 콜드스타트 커버 | 6유형별 published 활동 수 | 특정 유형 < 8개면 소싱 우선순위 ↑ |

```sql
-- 활동별 반응 로그 (보정의 원천)
CREATE TABLE activity_card_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid,
  activity_id uuid REFERENCES activities(id),
  reaction    text,        -- 'like'|'skip'|'select'|'detail'|'booking_click'
  match_score numeric,     -- 노출 시점의 5축 매칭점수(정합도 분석용)
  shown_at    timestamptz DEFAULT now()
);
```

#### 6.5.5 운영 담당 R&R

| 담당 | 역할 | 본 섹션 책임 |
|------|------|------|
| **변준**(경제/기획·파트너) | 파트너 섭외·검증·정산·신청 큐 | 6.3.2 소싱, 6.4 온보딩, 6.4.4 정산 |
| **예민**(인스타 1.5만·콘텐츠/브랜드) | 카피·이미지·톤앤매너·후기 | 6.2.4 이미지, 6.6 카피, 5축 태깅 참여 |
| **서준형**(개발) | 어드민·스키마·헬스체크·보정 파이프 | 6.1 스키마, 6.4.3 어드민, 6.5.4 모니터 |
| **UI/UX**(시각디자인) | 12문항 일러스트·카드 디자인 | 6.2.4 일러스트, 6.6 톤 |
| 외부 검수자 1 | 5축 객관성 보강 | 6.2.3 합의 |

---

### 6.6 카드 추천 카피 · 이미지 톤앤매너 가이드 (요구사항 f)

#### 6.6.1 키워드 칩 자동 파생 규칙 (5축 → 칩)

카드 칩 3~4개는 5축 점수에서 규칙으로 1차 생성 후, 수동 1개 추가 가능(`source='auto'|'manual'`).

```
규칙(임계 |score| ≥ 40 기준, 각 축 1개 칩):
  참여 +  → "만들기" / "직접 제작"      참여 −  → "감상" / "보고 즐기기"
  활동 +  → "활기차게" / "몸 쓰기"      활동 −  → "차분한 몰입"
  관계 +  → "함께 어울림"               관계 −  → "혼자 집중"
  경험 +  → "새로운 감각"               경험 −  → "익숙한 편안함"
  보상 +  → "결과물 만족" / "생활 활용"  보상 −  → "마음 충전" / "힐링"
→ 절댓값 큰 축 순으로 3개 선택 + 운영자 수동 1개
```

예: 도자기(-60/-40/-20/+80/-20) → 절댓값 순 참여(+80)·활동(-60)·관계(-40) → **"직접 제작 · 차분한 몰입 · 혼자 집중"** + 수동 "흙 감촉".

#### 6.6.2 카피 톤앤매너 (시니어 친화)

| 원칙 | Do | Don't |
|------|------|------|
| 존댓말·따뜻함 | "천천히 즐기실 수 있어요" | "꿀잼 핫플 클래스" |
| 쉬운 단어 | "함께 만드는 시간" | "DIY 워크숍 세션" |
| 부담 낮춤 | "처음이어도 괜찮아요" | "전문가 과정" |
| 외래어 절제 | "차 마시는 모임" | "티세리머니 클래스" |
| 글자 크게·짧게 | 1줄 ≤ 35자 | 긴 수식·중첩 문장 |
| 결과/감정 강조 | "내 손으로 완성하는 머그컵" | "선택의 결과 만족도 극대화" |
| 명령형 회피 | "둘러보세요" | "지금 당장 신청!" |

문장 템플릿(자동 생성 보조):
```
1줄설명 = "{동사구}, {감정·결과}는 시간"
  예) "천천히 흙을 빚으며, 마음까지 차분해지는 시간"
      "내 손으로 완성하는, 세상 하나뿐인 머그컵"
카드 제목 = "{재료/대상} {활동} {결과물}"  (18자 내외)
스와이프 안내 = "마음에 들면 오른쪽, 아니면 왼쪽으로 살짝 밀어보세요"
                (첫 사용 시 크게 + [알아보기] 버튼 / 시안 메모 반영)
```

#### 6.6.3 이미지 톤앤매너 (카드용 실사)

| 항목 | 가이드 |
|------|------|
| 피사체 | 손·결과물·웃는 시니어 중심. 과한 군중·소음감 X |
| 색감 | 파스텔·따뜻한 톤, 오프화이트 배경과 조화. 채도 과하지 않게 |
| 구도 | 4:3, 피사체 크게, 여백(베젤) 고려 — 결과 화면·카드 모두 가독 |
| 밝기 | 균일·밝게(어두운 실내 사진 보정). 고대비 텍스트 회피 |
| 일관성 | 동일 필터 프리셋(파스텔 LUT), 카드 간 톤 통일 |
| 접근성 | alt_text 필수, 색만으로 정보 전달 금지(칩 텍스트 병기) |
| 라인 일러스트 | 가위·도자기·망치·찻잔·냄비·그림 등 둥근 손글씨풍, 카테고리 아이콘·빈 이미지 대체용 |

#### 6.6.4 예시 활동 태깅 샘플 (브리프 활동 벡터와 정합)

아래는 **브리프에 명시된 5축 벡터를 그대로 사용**해 메타·칩·카피·6유형 매핑까지 완성한 시드 샘플이다(스케일 -100~+100, 6유형 중심값은 ×4 정규화 후 최근접).

| 활동 | 활동리듬 | 관계방식 | 경험선호 | 참여방식 | 기대보상 | 자동 칩(절댓값 순) | 최근접 6유형 |
|------|:---:|:---:|:---:|:---:|:---:|------|------|
| 트레킹 | 80 | 20 | 70 | 20 | 10 | 활기차게 · 새로운 감각 · 함께 어울림 | 활력 탐험형 |
| 도자기 | -60 | -40 | -20 | 80 | -20 | 직접 제작 · 차분한 몰입 · 혼자 집중 | 고요 몰입형 |
| 목공 클래스 | 10 | -10 | 30 | 90 | 70 | 직접 제작 · 결과물 만족 · 새로운 감각 | 손끝 성취형 |
| 다도 모임 | -20 | 70 | -30 | -20 | 40 | 함께 어울림 · 마음 충전 · 익숙한 편안함 | 따뜻한 교류형 |
| 전시 관람 | -10 | 10 | 60 | -80 | 20 | 보고 즐기기 · 새로운 감각 · 결과물 만족 | 문화 향유형 |

> 칩 규칙(6.6.1, 임계 40)에 따라 |점수|≥40 축만 칩화 → 절댓값 큰 3개 노출. 다도 모임의 기대보상 +40은 임계 경계라 운영자 판단으로 "마음 충전" 대신 노출 가능.

완성 카드 예시(도자기):

```
┌─────────────────────────────────────┐
│  [흙 빚는 손 + 머그컵 사진, 4:3]     │   ← 파스텔 톤, 손/결과물 중심
│                                     │
│  흙으로 빚는 나만의 머그컵           │   ← 제목 18자 내외
│  [직접 제작][차분한 몰입][혼자 집중] │   ← 5축 파생 칩
│  천천히 흙을 빚으며, 마음까지        │   ← 1줄설명 ≤35자, 존댓말
│  차분해지는 시간                    │
│                                     │
│  📍 마포구 · 약 2시간 · 4만원        │   ← 지역/시간/가격
│  난이도 ●○○○○  신체강도 ●○○○○      │   ← 시니어 필터 아이콘
│  [상세보기] [지도보기] [예약하기]    │
│  ─────────── 12 / 25 ───────────    │   ← 진행 표시
│   ◀ 관심없어요          좋아요 ▶     │   ← 첫 사용 시 스와이프 안내 크게
└─────────────────────────────────────┘
```

#### 6.6.5 태깅→카드 산출 의사코드 (운영 일관성 보장)

```python
def build_card(activity, axis_scores):
    chips = derive_chips(axis_scores, threshold=40, top_n=3)  # 6.6.1
    chips += manual_chips(activity)[:1]                        # 수동 1개
    nearest = nearest_type(axis_scores, TYPE_CENTROIDS_x4)     # ×4 정규화 중심
    sub = sub_tendency(axis_scores)                            # trend|recovery|None
    return Card(
        title       = activity.title,             # ≤18자 검증
        one_liner   = activity.one_liner,          # ≤35자, 존댓말 lint
        chips       = chips,
        meta        = (region, f"약 {dur//60}시간", f"{price//10000}만원"),
        difficulty  = activity.difficulty,         # 아이콘 5단계
        intensity   = activity.physical_intensity, # 시니어 필터
        actions     = ["상세보기","지도보기","예약하기"],
        type_for_reco = nearest, sub_tendency = sub
    )
```

이로써 **활동 데이터(스키마·메타) → 일관된 5축 태깅(루브릭·합의) → 시드 수집·택소노미 → 파트너 온보딩·정산 → 콘텐츠 운영 환류 → 카드 카피·톤**까지, 추천 엔진(8장)과 동일한 5축 -100~+100 공간 위에서 일관되게 작동하는 데이터 구축·운영 체계가 완성된다.

---

## 7. 개발 로드맵 · 마일스톤 · 팀 R&R · 예산 · KPI · 리스크

> **전제 정리 (오늘 = 2026-06-30)**
> 사업계획서상 "성향 진단(5~6월) → 추천(6~7월) → 커뮤니티(7~8월), 2026 3분기 출시"는 **이미 출발선에서 약 2개월 지연**되어 있고, 1인 개발(서준형) + 학기 병행 조건에서 **공격적(Aggressive)** 일정이다. 본 섹션은 사업계획서 흐름을 존중하되, **웹(PWA) 우선 → 앱 확장** 전략과 1인 개발 현실에 맞춰 **현실안(Realistic)**으로 재설계한다. 모든 일정은 합의된 기술 스택(Expo + react-native-web, Supabase, 자체 5축 추천 엔진)을 단일 진실 원천으로 삼는다.

---

### 7.0 사업계획서 일정 vs 현실안 — 갭 분석 및 재설계 원칙

| 구분 | 사업계획서(원안) | 현실안(본 로드맵) | 갭 / 근거 |
|---|---|---|---|
| 성향 진단 설문 | 2026.05~06 | 2026.07 (Phase 1 내) | 코드 0줄 상태 → 셋업부터 필요 |
| 추천 시스템 | 2026.06~07 | 2026.08~09 (Phase 1 후반) | 자체 5축 엔진 + 카드 보정 로직 = 단순 설문보다 무거움 |
| 커뮤니티 | 2026.07~08 | 2026.10~11 (Phase 2) | MVP는 추천까지가 핵심, 커뮤니티는 리텐션 단계 기능 |
| 정식 출시 | 2026 Q3 (7~9월) | **웹 PWA 베타 2026.09 / 정식 2026.11 / 앱 2027.01~02** | 1인 개발 + 웹우선 전략 반영 |
| 가입자 3천명 | 시점 모호 | **2027 Q2~Q3 누적 3,000명** | 마케팅 예산(메타 50만원) 규모 현실화 |

**재설계 5원칙**
1. **웹 PWA를 "출시 가능한 제품"으로** 먼저 완성 → 앱은 동일 코드 재배포(스토어 작업만 추가).
2. **MVP 스코프 = 5단계 진단 + 카드 추천 + 활동상세까지**. 커뮤니티/예약/결제는 Phase 2로 분리(스코프 보호).
3. **1인 개발 병목**을 가정에 명시 → AI 보조 코딩 + 외주(디자인/일부 컴포넌트) + 칸반 WIP 제한.
4. **데이터부터 확보**: Phase 1에서 활동 카드 반응 로그를 쌓아야 Phase 4 추천 정밀화가 가능 → 로깅을 초기 설계에 내장.
5. **지원사업 마일스톤 연동**: 초기창업패키지 등 응모 시점에 "동작하는 데모 URL"이 존재하도록 역산.

---

### 7.1 단계(Phase) 정의 및 사업계획서 매핑

```
2026                                                          2027
 07    08    09    10    11    12  | 01    02    03    04    05    06   07
 │     │     │     │     │     │   │  │     │     │     │     │     │
 ├─Phase0─┤
 │ 셋업  │
 │       ├──────── Phase 1: 웹 MVP (PWA) ────────┤
 │       │ 진단·점수·유형·카드추천·활동상세        │
 │       │  (사업계획서 진단6월→추천7월 = 여기 압축)│
 │       │                          베타9월  정식11월│
 │                                  ├─ Phase 2: 커뮤니티+게이미피케이션+예약 ─┤
 │                                  │ (사업계획서 커뮤니티8월 = 여기)          │
 │                                                  ├─ Phase 3: 네이티브 앱 ─┤
 │                                                  │ iOS/Android 동일코드     │
 │                                                                  ├ Phase 4 고도화→
 │                                                                  │ 추천정밀화·B2B
```

| Phase | 기간(현실안) | 목표 산출물 | 사업계획서 매핑 | 출시 게이트 |
|---|---|---|---|---|
| **Phase 0 셋업** | 2026.07.01~07.15 (2주) | 레포/CI/CD, Expo+RNW 부트스트랩, Supabase 프로젝트, 디자인 토큰, 인증 스캐폴드 | (선행 작업) | 헬로월드 PWA가 Vercel에 배포됨 |
| **Phase 1 웹 MVP (PWA)** | 2026.07.16~11.15 (4개월) | 로그인/온보딩/성향테스트(12문항)/점수·유형/보조성향/**카드 추천**/활동상세 | 진단(설문)+추천 | 베타 09.15, 정식 11.15 |
| **Phase 2 커뮤니티+게이미피케이션+예약** | 2026.11.16~2027.02.15 (3개월) | 활동기록/피드, 뱃지·인증마크·동행모집, 예약 링크→PG 결제, 지도·업체연결 | 커뮤니티 | 예약 1건 E2E 성공 |
| **Phase 3 네이티브 앱** | 2027.01.15~2027.03.15 (2개월, Phase2와 일부 병행) | iOS/Android 동일 코드, 카카오 네이티브 SDK, 푸시, 딥링크, 스토어 심사 통과 | (신규) | App Store/Play 등록 승인 |
| **Phase 4 고도화** | 2027.03~ (지속) | 추천 정밀화(pgvector/온라인보정), B2B 데이터 리포트, 자체 예약·결제 내재화 | (신규) | 추천 만족도 +10%p |

---

### 7.2 스프린트(2주 단위) 백로그

> 담당 코드: **준형**=서준형(개발리드), **변준**=예산·파트너, **예민**=콘텐츠·SNS, **UX**=UI/UX, **팀장**=기획·테스트.
> DoD 공통 규칙: ① 메인 브랜치 머지 + CI 통과 ② 시니어 친화 체크(글씨≥18sp, 터치영역≥48dp) ③ Vercel 프리뷰 URL에서 동작 확인 ④ 팀장 수용 테스트 1건 통과.

#### Phase 0 — 셋업 (S0)

| 스프린트 | 기간 | 산출물 | 담당 | 완료기준(DoD) |
|---|---|---|---|---|
| **S0** | 07.01~07.15 | Monorepo(Expo+RNW), Supabase 프로젝트(Postgres/Auth/Storage), CI/CD(GitHub Actions→Vercel), 디자인 토큰(컬러/타이포/spacing), ESLint/Prettier, 기본 라우팅(expo-router) | 준형(주), UX(토큰) | PWA 헬로월드 Vercel 배포 / Supabase Auth 이메일 가입 1건 성공 / 디자인 토큰 Figma↔코드 1:1 매핑 |

#### Phase 1 — 웹 MVP (S1~S8)

| 스프린트 | 기간 | 산출물 | 담당 | 완료기준(DoD) |
|---|---|---|---|---|
| **S1** 인증·온보딩 | 07.16~07.29 | 로그인 화면(아이디/PW, 인라인 에러), [입장하기]/[둘러보기], **카카오 로그인**(웹 OAuth), Apple/Google/이메일, 온보딩 3장(인디케이터/건너뛰기/시작하기) | 준형, UX | 4개 인증 경로 로그인 성공 / 온보딩 스킵·완료 후 홈 진입 / 세션 유지(새로고침 후 로그인 상태) |
| **S2** 홈 상태분기 + 테스트 셸 | 07.30~08.12 | 홈 라우팅 상태분기(미테스트→"테스트 시작하기" / 기테스트→카드추천), 12문항 테스트 컨테이너(진행바 1/12, 이미지 2장 비교 + 5단계 바), 응답 로컬·서버 저장 스키마 | 준형, 팀장(문항검수), UX | 12문항 끝까지 진행/뒤로가기 가능 / 응답이 `quiz_responses`에 저장 / 베젤 여백 반영 레이아웃 검수 통과 |
| **S3** 점수·유형 엔진 | 08.13~08.26 | 5축 점수 계산(-100~+100 스케일 정규화), 보조성향(트렌드발견 Q1·Q6·Q11 / 회복충전 Q5·Q9·Q11), **6유형 최근접 중심 분류**(중심벡터 스케일 통일), 단위테스트 | 준형 | 골든셋 12케이스(유형별 2) 분류 정확 / 보조성향 0~1개 규칙 동작 / 점수 함수 단위테스트 100% 그린 |
| **S4** 결과 화면 | 08.27~09.09 | "당신은 OO형이에요!" + 보조성향 배지 + **5축 레이더 차트**(react-native-svg) + 추천클래스 썸네일 리스트, 결과 공유(이미지/URL) | 준형, UX, 예민(공유카피) | 6유형 모두 결과 정상 렌더 / 레이더 차트 웹·모바일뷰 깨짐 없음 / 결과 공유 링크 OG 이미지 노출 |
| **S5** 카드 추천 엔진 v1 | 09.10~09.23 | 하드필터(지역/예산/시간/강도) → 5축 매칭점수(유사도) → 정렬, 활동 시드 데이터 30~50개(태그 5축), Edge Function 추천 API | 준형, 변준(활동시드/파트너정보) | 동일 유형 사용자에 일관 추천 / 필터 적용 시 결과 변동 확인 / API p95 < 800ms |
| **S6** 활동 카드 UI + 반응 수집 | 09.24~10.07 | 슬라이드 카드(이미지+키워드칩+1줄설명+좋아요/관심없어요+상세/지도/예약), "1/25" 진행, 첫사용 스와이프 설명 크게+"알아보기", **반응 로그 적재**(`card_feedback`) | 준형, UX | 스와이프/버튼 양방향 동작 / 좋아요·관심없음이 DB 적재 / 첫 진입 가이드 1회 노출 후 미노출 |
| **S7** 활동상세 + 감성보정 v1 | 10.08~10.21 | 활동상세 화면(설명/사진/위치/예약링크 placeholder), **온라인 보정**(좋아한 태그 강화·관심없는 태그 약화 → 다음 카드 순서 조정) | 준형 | 좋아요 누른 태그 비중이 다음 추천에 반영(A/B 로그로 검증) / 활동상세 진입·복귀 정상 |
| **S8** 베타 안정화 + 분석 | 10.22~11.04 | 에러 바운더리, 로딩/빈상태, 접근성 점검(고대비/글씨크기 토글), 분석 이벤트(GA4/PostHog), 베타 배포 | 준형, 팀장, 예민(랜딩) | 핵심 퍼널 이벤트 수집(가입→테스트완료→첫추천→좋아요) / 시니어 5명 사용성 테스트 통과 / **09.15 이전 베타 URL 오픈** |
| **(정식)** 11.05~11.15 | 버그픽스·콘텐츠 확충, 정식 오픈 | 전원 | **11.15 정식 PWA 오픈** + 메타 광고 점화 |

#### Phase 2 — 커뮤니티+게이미피케이션+예약 (S9~S14)

| 스프린트 | 기간 | 산출물 | 담당 | 완료기준(DoD) |
|---|---|---|---|---|
| **S9** | 11.16~11.29 | 활동기록(사진+텍스트), 개인 기록 타임라인 | 준형, UX | 기록 CRUD + Storage 업로드 동작 |
| **S10** | 11.30~12.13 | 피드/공유, 좋아요·댓글 | 준형 | 피드 무한스크롤, RLS로 권한 분리 |
| **S11** | 12.14~12.27 | 게이미피케이션: 뱃지/인증마크/포인트 규칙 엔진 | 준형, 팀장(규칙설계) | 활동 완료→뱃지 자동 부여 |
| **S12** | 12.28~01.10 | 동행 모집(모임 생성/참여) | 준형, 예민 | 모집글 생성→참여신청→확정 플로우 |
| **S13** | 01.11~01.24 | 지도(카카오맵 SDK)·업체 연결, 예약링크/딥링크 | 준형, 변준(업체) | 좋아한 활동의 업체 지도 표시 + 상세이동 |
| **S14** | 01.25~02.07 | 예약·결제(토스페이먼츠/포트원), 카카오 선물하기 채널 연동 | 준형, 변준 | **예약 1건 결제→정산 E2E 성공** |

#### Phase 3 — 네이티브 앱 (S15~S18, Phase 2와 일부 병행)

| 스프린트 | 기간 | 산출물 | 담당 | 완료기준(DoD) |
|---|---|---|---|---|
| **S15** | 01.15~01.28 | EAS 빌드 파이프라인, 네이티브 셸 구동, 앱 라우팅 점검 | 준형 | iOS/Android 시뮬레이터에서 웹과 동일 화면 구동 |
| **S16** | 01.29~02.11 | **카카오 네이티브 SDK** 로그인/공유, expo 푸시 알림 | 준형 | 카카오 네이티브 로그인 성공 + 푸시 수신 |
| **S17** | 02.12~02.25 | 딥링크(universal/app link), 결제 네이티브 처리, 스토어 메타데이터 | 준형, UX(스토어 이미지) | 딥링크로 활동상세 직접 진입 |
| **S18** | 02.26~03.15 | 스토어 심사 대응(개인정보/권한 고지), 출시 | 준형, 팀장 | **App Store + Play 승인** |

#### Phase 4 — 고도화 (지속, 백로그)

| 항목 | 내용 | 담당 |
|---|---|---|
| 추천 정밀화 | pgvector 도입, 협업필터/콘텐츠 하이브리드, 온라인 보정 정교화 | 준형 |
| B2B 데이터 리포트 | 시니어 취향 집계 대시보드, 제휴 광고 | 변준, 준형 |
| 자체 예약·결제 내재화 | 외부 링크 → 자체 예약엔진 | 준형, 변준 |

---

### 7.3 웹-우선 → 앱-확장 전환 체크리스트

> react-native-web으로 짠 동일 코드를 네이티브로 "재배포"할 때, **웹에서는 안 보이던 갭**이 드러나는 지점들. Phase 3 진입 게이트로 사용.

```
[ 전환 게이트 체크리스트 — 통과해야 S15 시작 ]

A. 네비게이션 / 라우팅
  ☐ expo-router URL 라우팅이 네이티브 스택/탭으로 정상 매핑
  ☐ 웹의 history.back ↔ 네이티브 하드웨어 백버튼(안드로이드) 동작 일치
  ☐ 모달/시트가 네이티브 제스처(스와이프 닫기)와 충돌 없음

B. 푸시 알림
  ☐ expo-notifications 토큰 발급(iOS APNs / Android FCM) — 웹엔 없던 항목
  ☐ 권한 요청 UX(시니어 친화: 왜 필요한지 1줄 설명 선노출)
  ☐ 알림 탭 → 딥링크 진입 동작

C. 딥링크 / Universal Link
  ☐ 웹 URL(feellog.app/activity/123) ↔ 앱 딥링크 동일 경로 매핑
  ☐ apple-app-site-association / assetlinks.json 호스팅(Vercel)
  ☐ 결과·활동 공유 링크가 앱 설치 시 앱으로, 미설치 시 웹으로

D. 카카오 네이티브 SDK (웹 OAuth → 네이티브 전환의 핵심 함정)
  ☐ 웹: 카카오 JS/REST OAuth → 네이티브: 카카오 네이티브 SDK(앱키 분리)
  ☐ 리다이렉트 URI / 번들ID·패키지명·키해시 카카오 콘솔 등록
  ☐ Expo 환경에서 config plugin(또는 dev client) 적용 — Expo Go로는 불가, **EAS dev build 필요**

E. 스토어 심사
  ☐ Apple: 로그인 시 카카오 외 "Apple로 로그인" 동시 제공(소셜 단독 시 필수)
  ☐ 개인정보처리방침 URL, 데이터 수집 항목(App Privacy) 고지
  ☐ Android 권한 최소화, 타깃 SDK 최신 / 14세 미만 아닌 시니어 대상 명시
  ☐ 결제: 디지털콘텐츠 아닌 "오프라인 체험 예약" → 외부 PG 허용 범위 확인

F. 플랫폼 분기 코드 정리
  ☐ Platform.OS 분기 / .web.tsx · .native.tsx 파일 분리 지점 목록화
  ☐ 웹 전용(SEO/OG 메타) vs 앱 전용(스플래시/앱아이콘) 자산 분리
  ☐ 로컬스토리지(웹) ↔ AsyncStorage/SecureStore(앱) 추상화 확인
```

| 전환 위험 | 영향 | 완화 |
|---|---|---|
| 카카오 네이티브 SDK = Expo Go 미지원 | 개발 막힘 | **Phase 0부터 EAS dev client 전제**로 셋업(나중에 갈아끼우지 않음) |
| Apple 심사 "소셜 단독 거절" | 출시 지연 | 처음부터 Apple 로그인 동시 구현(S1에 포함됨) |
| 딥링크 도메인 검증 누락 | 공유 유입 깨짐 | 도메인 확보 후 S0에서 association 파일 선배치 |

---

### 7.4 팀 R&R — RACI

> R=실행(Responsible), A=최종책임(Accountable), C=자문(Consulted), I=공유(Informed)

| 워크스트림 | 서준형(개발리드) | 변준(예산·파트너) | 예민(콘텐츠·SNS) | UI/UX | 팀장(기획·테스트) |
|---|---|---|---|---|---|
| 기술 아키텍처/코드 | **A/R** | I | I | C | C |
| 디자인 시스템·화면 | C | I | I | **A/R** | C |
| 성향테스트·추천 기획 | R | C | I | C | **A/R** |
| QA·수용테스트·시니어 사용성 | C | I | I | C | **A/R** |
| 활동 공급(공방·문화센터 제휴) | I | **A/R** | C | I | C |
| 예산·정산·지원사업 응모 | I | **A/R** | I | I | C |
| 결제·정산 연동(기술) | **A/R** | C | I | I | C |
| 콘텐츠·SNS(인스타 1.5만 활용) | I | C | **A/R** | C | C |
| 마케팅(메타 광고)·기프티콘 채널 | I | C | **A/R** | C | C |
| 출시·스토어 등록 | **A/R** | I | C | C | C |

#### 1인 개발(서준형) 병목 — 완충안

```
완충 레버 3종
 ┌──────────────┬─────────────────────────────────────────────┐
 │ 1) 스코프 관리 │ MVP=진단+추천+상세까지. 커뮤니티/예약은 Phase2로 │
 │              │ 강제 분리. 칸반 WIP=1(한 번에 1스프린트 1테마)  │
 │              │ "MoSCoW"로 Must만 Phase1, Should/Could는 백로그│
 ├──────────────┼─────────────────────────────────────────────┤
 │ 2) AI 보조    │ 보일러플레이트·테스트·문서·CRUD 생성에 AI 코딩  │
 │              │ 활용 → 준형은 추천엔진/인증/결제 등 코어에 집중 │
 ├──────────────┼─────────────────────────────────────────────┤
 │ 3) 외주/조달  │ 일러스트 아이콘·OG이미지=디자인 외주(예산 일부)  │
 │              │ 컴포넌트는 검증된 OSS 차용(차트/캐러셀/폼)       │
 └──────────────┴─────────────────────────────────────────────┘
보조 인력 활용: UX가 Storybook 수준 컴포넌트 명세, 팀장이 더미데이터·
QA 시나리오·활동 콘텐츠 입력을 분담 → 준형의 비코어 작업 제거.
```
**[가정]** 서준형은 학기 병행으로 주 20~25시간 가용. 본 일정은 이 가용시간을 전제로 한 것이며, 방학(7~8월, 1~2월) 집중 투입을 코어 개발 구간(S3~S7, S15~S18)에 배치했다.

---

### 7.5 예산 배분 — 초기 300만원 & 향후 고도화 자금

#### (1) 교내 창업동아리 지원금 300만원 (초기 MVP, 2026.07~)

| 카테고리 | 비율 | 금액 | 세부 사용처 | 비고 |
|---|---|---:|---|---|
| 인프라 | 35% | 105만원 | Supabase 유료 플랜·Vercel·도메인·EAS 빌드, **4개월 운영비** | 사업계획서 "MVP개발 250만원=4개월×서버 등 인프라"를 인프라+운영으로 분해 |
| 마케팅·고객확보 | 40% | 120만원 | 메타 광고(50만원), 인스타 릴스/유튜브 숏츠 제작비, 랜딩/OG 자산 | 사업계획서 "광고 50만원=메타광고" 포함, 예민 주도 |
| 운영·파트너십 | 25% | 75만원 | 공방·문화센터 QR/리플렛, 활동 시드 콘텐츠 제작, 디자인 외주 소액 | 변준 주도 |

> **사업계획서 항목 매핑**: "MVP 개발 250만원"은 본질적으로 4개월 인프라·운영성 비용(자체개발이라 인건비 비계상) → 본 표에서 인프라(105) + 운영·파트너십(75) + 마케팅 내 제작비 일부로 분산 흡수. "광고 50만원"은 마케팅(120) 안의 메타광고로 명시. 합계 300만원 정합.

```
300만원 흐름 (4개월)
 07월 ──── 08월 ──── 09월(베타) ──── 10월 ──── 11월(정식)
 인프라:  월 ~26만 균등 (105/4)
 마케팅:  베타전 소액 → 정식(11월) 메타광고 집중 점화
 운영:    07~08 활동시드/리플렛 선투입(파트너 확보 선행)
```

#### (2) 향후 고도화 자금 (투자/지원 유치 전제, Phase 4~)

| 항목 | 금액 | 사용처 정렬 | 연결 Phase |
|---|---:|---|---|
| AI 추천 정밀화 + 보안 + 자체 예약·결제 | 7,000만원 | pgvector/하이브리드 추천, 보안 강화(개인정보·결제 PCI 범위), 자체 예약엔진 내재화 | Phase 4 + Phase 2 결제 고도화 |
| 마케팅 | 3,000만원 | 퍼포먼스 광고 확장, 효도 패키지 캠페인(어버이날/명절), 인플루언서 | Phase 2~4 |
| 제휴처·프로그램 | 2,500만원 | 활동 공급 확대(공방·문화센터 온보딩), 콘텐츠 제작 지원 | Phase 2~ |
| 복지몰/지자체 | 1,500만원 | 기업 복지몰·지자체 연계(B2B), 지역 거점 확대 | Phase 4 (B2B) |

#### (3) 지원사업 응모 일정 (데모 URL 역산 배치)

```
응모 캘린더 (데모 준비 = 베타 URL 9월 / 정식 11월에 맞춤)
 ┌─────────────┬──────────────┬──────────────────────────┐
 │ 지원사업      │ [가정]응모시점 │ 준비물(우리 상태)          │
 ├─────────────┼──────────────┼──────────────────────────┤
 │ 로컬크리에이터 │ 2026 하반기   │ 베타 URL + 지역파트너 LOI  │
 │ 초기창업패키지 │ 2027 상반기   │ 정식 PWA + 가입/리텐션 지표 │
 │ 사회적기업가  │ 2027 상반기   │ 시니어 임팩트 지표·사용후기  │
 │  육성사업     │              │                          │
 └─────────────┴──────────────┴──────────────────────────┘
 ※ 실제 공고일은 매년 변동 → 변준이 공고 모니터링, 마감 6주 전 착수
```
**[가정]** 각 지원사업의 정확한 2026~2027 공고일은 미확정이므로 "하반기/상반기"로만 표기. 변준이 K-Startup·중기부 공고 모니터링 담당.

---

### 7.6 KPI / 북극성 지표 (North Star)

> **북극성 지표(NSM): "월간 완료 활동 수"** = (추천을 받아 실제로 좋아요/예약/기록까지 이어진 활동 건수). 단순 가입이 아니라 *취향 발견→체험→지속*이라는 제품 본질을 가장 잘 대변. NSM = (테스트완료율 × 첫추천만족 × 예약전환 × 재방문)의 곱으로 분해되어 하위 KPI와 직결.

| 지표 | 정의 | Phase 1 (~2026.11) | Phase 2 (~2027.02) | 2027 Q2~Q3 목표 |
|---|---|---|---|---|
| **누적 가입자** | 가입 완료 계정 | 500명 | 1,500명 | **3,000명** |
| **MAU** | 월 활성 사용자 | 200 | 700 | 1,500 |
| **테스트 완료율** | 시작 대비 12문항 완료 | ≥ 60% | ≥ 70% | ≥ 75% |
| **첫 추천 만족도** | 첫 추천에 좋아요≥1 / CSAT | ≥ 50% | ≥ 60% | ≥ 65% |
| **예약 전환율** | 추천→예약클릭/결제 | (링크클릭) ≥ 8% | 결제전환 ≥ 5% | ≥ 8% |
| **재방문 / 리텐션** | D7 / W4 리텐션 | D7 ≥ 25% | D7 ≥ 30% / W4 ≥ 15% | W4 ≥ 20% |
| **NSM: 월 완료 활동 수** | 위 정의 | 50건/월 | 300건/월 | 800건/월 |

```
퍼널 (각 단계가 KPI와 1:1)
 방문 ─→ 가입(가입자) ─→ 테스트완료(완료율) ─→ 첫추천(만족도)
   └→ 좋아요/카드반응 ─→ 예약클릭/결제(전환율) ─→ 활동기록/재방문(리텐션) ─→ [NSM]
```
**[가정]** 5060 시니어 + 2040 자녀 선물 유입 혼합이므로 가입 대비 활성 전환은 일반 앱보다 보수적으로 설정.

---

### 7.7 리스크 등록부 (Risk Register)

| ID | 리스크 | 가능성 | 영향 | 노출도 | 완화책 | 담당 | 조기경보 신호 |
|---|---|:--:|:--:|:--:|---|---|---|
| R1 | **시니어 디지털 진입장벽** (가입·테스트 이탈) | 高 | 高 | ★★★ | 큰 글씨·큰 터치·단순 동선, 카카오 로그인 우선, 첫 스와이프 가이드 크게, "둘러보기"로 가입 전 체험, 시니어 5명 사용성 테스트(S8) | UX·팀장 | 테스트 완료율 <50%, 가입 이탈 급증 |
| R2 | **활동(클래스) 공급 부족** (추천할 게 없음) | 高 | 高 | ★★★ | Phase1 전 30~50개 시드 확보(변준), 지역 거점 공방·문화센터 LOI 선행, 콘텐츠형 활동(영상/전시)로 보충 | 변준 | 베타 시점 활동 <30개 |
| R3 | **1인 개발 병목** (일정 지연) | 高 | 高 | ★★★ | 스코프 분리(7.4), AI 보조, 외주, WIP=1, 방학 집중투입, 스프린트마다 출시가능 상태 유지 | 준형·팀장 | 2스프린트 연속 DoD 미달 |
| R4 | **추천 정확도 부족** (만족도 저하) | 中 | 高 | ★★ | 6유형(방향)+보조성향(분위기)+5축(계산)+카드피드백(보정) 4중 구조, 골든셋 단위테스트, 콜드스타트엔 탐색카드 혼합, Phase4 pgvector | 준형 | 첫추천 만족 <50%, 관심없음 비율 과다 |
| R5 | **결제/정산 복잡성·심사 리스크** | 中 | 中 | ★★ | Phase2까지 "예약링크" 우회 → 외부 PG(토스/포트원) 단계적 도입, 카카오 선물하기 채널 활용, 정산 규칙 변준 사전 합의 | 변준·준형 | PG 심사 지연, 정산 분쟁 |
| R6 | **리텐션 약화** (1회성 사용) | 中 | 高 | ★★ | 게이미피케이션(뱃지/인증마크), 동행모집, 활동기록 피드, 푸시 리마인드(앱), 주간 추천 큐레이션 | 준형·예민 | W4 리텐션 <10% |
| R7 | 카카오 네이티브 SDK/Expo 전환 함정 | 中 | 中 | ★★ | EAS dev build 전제 셋업(7.3), Apple 로그인 동시 구현 | 준형 | dev build 실패, 심사 반려 |
| R8 | 예산 소진(300만원 한계) | 中 | 中 | ★ | 지원사업 응모(7.5-3), 자체개발로 인건비 절감, 광고는 정식 시점 집중 집행 | 변준 | 인프라비 초과, 광고 ROAS 저조 |
| R9 | 개인정보·보안(시니어 민감정보) | 中 | 高 | ★★ | Supabase RLS, 최소수집, 개인정보처리방침, Phase4 보안 강화 예산 | 준형 | RLS 정책 미비 발견 |

```
리스크 히트맵 (가능성 × 영향)
            영향: 低        中           高
 가능성 高              │ R8?      │ R1 R2 R3
 가능성 中    R8        │ R5 R7    │ R4 R6 R9
 가능성 低              │          │
 → 최우선 관리(★★★): R1(시니어 장벽) · R2(공급) · R3(1인 개발)
```

---

#### 핵심 마일스톤 요약 (한눈에)

| 날짜 | 마일스톤 | 게이트 지표 |
|---|---|---|
| 2026.07.15 | Phase 0 완료 | PWA 배포·인증 1건 |
| 2026.09.15 | **웹 베타 오픈** | 퍼널 이벤트 수집·사용성 통과 / 지원사업 데모 준비 |
| 2026.11.15 | **웹 PWA 정식 출시** | 가입 500·테스트완료 60% |
| 2027.02.07 | Phase 2 완료 (예약 E2E) | 결제 1건 성공 |
| 2027.03.15 | **iOS/Android 앱 출시** | 스토어 승인 |
| 2027 Q2~Q3 | 성장 목표 | **누적 가입 3,000명·NSM 800건/월** |

---

# 정합성 검토 메모

7개 섹션을 단일 진실 원천(합의된 기술 결정 + 진단/추천 확정 스펙) 기준으로 교차 검증한 결과다. **블로커 → 경미 순**으로 정리하고 각 항목에 권장 수정안을 붙였다.

## A. 추천 엔진 스케일·중심값 통일성 (가장 중요)

### A-1. [블로커] 6유형 중심값 ×4 정규화 결과가 섹션마다 다르다
- **2장**(2.2.1)은 `vitality=[100,20,20,0,0]`, `stillness=[-100,-60,0,-80,-20]` 등 **정확히 ×4**로 계산.
- **6장**(6.2.1)은 "활력 탐험형 활동리듬 +25 → +100"으로 ×4 명시. 일관.
- **4장**(4.2.3 주석)은 `active_explorer = (100,20,20,0,0)`으로 ×4 일관. 단 **유형 코드 네이밍이 2장과 다르다**: 2장 `vitality/stillness/craft/warmth/upgrade/culture` vs 4장 `active_explorer/calm_immersion/handcraft_achiever/warm_social/life_upgrade/culture_enjoyer` vs 5장 `vital_explorer/calm_immersion/...`(또 다름).
- **권장 수정**: 유형 코드 enum을 **한 곳(4장 DB enum)으로 확정**하고 2·5·6장이 이를 import. 세 가지 표기가 공존하면 `TYPE_CENTROIDS` 키와 DB `main_type` 값이 불일치해 분류 결과를 저장·조회할 수 없다. 4장의 `main_type` enum(`active_explorer` 등)을 정본으로 권장하고, 2장 코드 상수(`vitality` 등)를 enum 값으로 치환.

### A-2. [블로커] 유사도 점수식이 5장과 2/4장에서 다르다 — 결과가 달라짐
- **2장**(2.3.3)·**4장**(4.4.2): **가중 유클리드 거리**, 가중치 `W=[1.2,1.1,1.0,0.9,0.8]`, `D_max=200√5≈447.2`, `100·(1−d/D_max)`.
- **5장**(5.1.5 `match_activities`): **L1(맨해튼) 거리**, `100 − (Σ|차이|)/10`, 가중치 없음.
- 같은 사용자·활동이라도 **두 식의 점수가 다르다**(예: 김영자-트레킹은 2장에서 70.6점, 5장 L1식이면 다른 값). 클라이언트 즉시 미리보기(2장 core)와 서버 RPC(5장 SQL)가 다른 점수를 내면 "왜 추천됐는지"가 흔들린다.
- **권장 수정**: **2장의 가중 유클리드 식을 정본**으로 삼고 5장의 `match_activities` SQL을 2.5.2의 `match_score(u,a,w)` SQL(가중 유클리드·`200√(Σw)` 분모)로 교체. 5.1.5의 L1 함수는 "자리표시(placeholder)"라고 본문에 명시돼 있으므로 정본 식으로 대체하면 됨. 가중치 배열 `[1.2,1.1,1.0,0.9,0.8]`도 양쪽 동일 상수로.

### A-3. [경미] −100~+100 스케일 통일 자체는 일관 — 단 "최종 점수 범위" 표기 보강 필요
- 사용자 5축·활동 태그는 전 섹션 −100~+100 통일 OK. 유형 중심값 ×4 통일도 OK(A-1 네이밍만 별개).
- 다만 2장은 매칭 점수에 보너스(`B_type +8`, `B_sub +5`, `B_tag ±5`)를 더한 뒤 `clamp(0,100)`인데, 4장 응답 예시는 `match_score 92.3` 등 보너스 포함 여부가 불명확. 5장은 보너스 없음.
- **권장 수정**: "base 유사도(0~100) + 보너스 → clamp(0,100) = 최종 match_score"를 4·5장에도 동일 명문화. 보너스 적용 위치(RPC인지 Edge인지)를 2.5.2 파이프라인대로 통일.

### A-4. [경미] 보조성향 임계값이 2장과 4장에서 다르다
- **2장**(2.1.3): `display_threshold=60`, `gap_threshold=8`.
- **4장**(4.4.1): "더 높고 임계(예: ≥40) 넘으면".
- **권장 수정**: 보조성향 표시 임계값을 **60(2장)으로 통일**하고 4장 `≥40` 표기를 수정. 둘 다 `[가정]`이므로 베타 후 튜닝하되 문서 내 단일값 유지.

### A-5. [경미] 피드백 보정 계수가 2장과 4장에서 다르다
- **2장**(2.4.1): EMA `η=η0/(1+λ·count)`, `η0=0.20`, 앵커 `β=0.05`, base 이탈 하드클립 ±40.
- **4장**(4.4.3): `like: +α(act−user)`, `α=0.08`; `dislike: −β(...)`, `β=0.04` (앵커·클립 미언급).
- 두 보정 규칙이 공존하면 `applyFeedback`을 2벌 구현하게 됨. 동일 로직이 클라/서버 양쪽에서 재사용된다는 1·2장 전제(`@feellog/core`)와 충돌.
- **권장 수정**: **2장의 EMA + 앵커 + 클립 공식을 정본**으로, 4장은 이를 참조(중복 수식 삭제 또는 "상세는 2.4 참조"). like/dislike 비대칭(α=0.08 vs β=0.04)을 유지할지(2장은 dir로 대칭 처리)도 한쪽으로 확정.

## B. 화면 ↔ 데이터 ↔ API 정합성

### B-1. [중요] 신체강도(intensity) 척도가 섹션마다 다르다
- **2장**(2.0.3): `intensity 1~5`.
- **4장**(4.2.3): `intensity smallint CHECK (between 0 and 3)` — **0~3**.
- **6장**(6.1.2): `physical_intensity 1~5`.
- 하드 필터(`intensity ≤ maxIntensity`)가 척도 불일치로 깨진다. 4장 DDL(0~3)과 6장(1~5)이 같은 활동을 다르게 저장.
- **권장 수정**: **1~5로 통일**(6장·2장 다수결, 시니어 친화 5단계가 카드 UI 아이콘과도 맞음). 4장 `activities.intensity CHECK (between 1 and 5)`로 수정.

### B-2. [중요] 활동/추천 테이블이 4장과 5장에서 중복 정의되며 구조가 다르다
- **4장**: `activities`(메타) + `activity_tags`(5축 분리 테이블, 컬럼형 `axis_rhythm smallint`).
- **5장**: `activities`에 `axis_tag jsonb`(JSON 통합) — **분리 vs JSON 컬럼 충돌**.
- **6장**: `activities` + `activity_axis_scores`(컬럼형 + 검수 이력) — 4장과 유사하나 또 다른 테이블명.
- 같은 개념의 테이블이 3가지 스키마로 존재. 마이그레이션이 충돌한다.
- **권장 수정**: 활동 5축은 **컬럼형 + 검수 이력 테이블(6장 `activity_axis_scores`)을 정본**으로 통일(추천 SQL이 JSON 파싱보다 컬럼 인덱싱이 빠르고, 검수 워크플로가 6장에만 있음). 5장 `axis_tag jsonb`는 폐기하고 5.1.5 RPC를 컬럼 참조로 수정. 4장 `activity_tags`는 `activity_axis_scores`로 명칭 합치거나 둘 중 하나로 단일화.

### B-3. [경미] 사용자 프로필 테이블이 4장(`taste_profiles`)과 5장(`assessment_results`)으로 이원화
- **4장**: `taste_profiles`(컬럼형 5축 + is_active + 피드백 보정 누적 `v_current` 개념).
- **5장**: `assessment_results`(`axis jsonb` + raw_answers).
- **2장**: `user_profile`(`v_base`/`v_current` 분리, `tag_weights`).
- 세 테이블이 같은 사용자 성향을 표현. `v_base`(고정 기준선)와 `v_current`(피드백 보정)를 분리 보관한다는 2장 설계가 가장 정교한데, 4·5장 스키마엔 그 분리가 없다.
- **권장 수정**: **2장의 `v_base`/`v_current`/`tag_weights`/`feedback_count` 구조를 4장 `taste_profiles`에 흡수**(컬럼형으로). 5장 `assessment_results`는 "테스트 원응답 스냅샷"(raw_answers 보존)으로 역할 축소하거나 4장 `test_responses`와 합치고, 단일 프로필 테이블로 정리.

### B-4. [경미] 반응 테이블명·reaction 값이 4장과 5장에서 다르다
- **4장**: `reactions`, kind `like/dislike/select`.
- **5장**: `card_feedback`, reaction `like/skip/pick`.
- **6장**: `activity_card_events`, reaction `like/skip/select/detail/booking_click`.
- `dislike`(4장) vs `skip`(5·6장)이 "관심없어요"를 다르게 표기.
- **권장 수정**: 테이블 1개(`card_feedback` 또는 `reactions`)로, 값은 `like/skip/select`로 통일. 노출·상세·예약클릭 같은 분석 이벤트는 별도 `analytics_events`(4장)로 분리해 행동 로그와 추천 보정 입력을 구분.

### B-5. [확인] 홈 상태 분기는 일관 — 양호
- 4장(4.3)의 2-플래그(`onboarding_done`, `has_taste_profile`) + `taste_profiles.is_active` 단일 진실, 라우터 가드, 트랜잭션 원자성 설계는 5·7장(S2 홈 상태분기)과 일치. 시안 IA 메모("미테스트→테스트 / 완료→카드추천")도 충족. 수정 불필요.

### B-6. [경미] 12문항 부호·정규화 분모는 일관 — 단 4장 채점 설명이 2장보다 단순
- 2장(2.1.2)은 축별 분모 `2·nₐ`(reward는 3문항→분모6)로 정밀 정규화. 4장(4.4.1)은 "문항 수로 정규화, *50/문항수" 식으로 약식 서술.
- **권장 수정**: 4장 채점 의사코드에 2.1.2의 `100·Σ(sign·r)/(2·nₐ)` 식을 명시 인용(특히 reward 3문항 비대칭 처리). 결과 자체는 동일하나 구현자가 혼동할 여지 제거.

## C. 일정 ↔ 예산 ↔ 팀 현실성

### C-1. [중요·현실성] 1인 개발로 Phase 1(4개월)에 진단+엔진+카드추천+활동상세 = 공격적
- 7장이 이미 "공격적"으로 자인하고 완충책(스코프 분리·AI 보조·외주·WIP=1)을 제시한 점은 적절. 다만 **S3(점수·유형 엔진 2주) + S5(추천 v1 2주) + S7(온라인 보정 2주)**에 2장의 전체 수식(EMA·앵커·MMR·ε탐색·재분류)을 다 넣으면 2주씩으로는 빠듯.
- **권장 수정**: Phase 1은 **2장 엔진의 "Must"만**(5축 점수·6유형 분류·가중 유클리드 매칭·단순 EMA 보정) 구현하고, **MMR 다양성·ε 감쇠·재분류 트리거·앵커 하드클립**은 Phase 4(고도화) 또는 S8 이후 백로그로 명시 분리. 7장 MoSCoW 원칙과 정합.

### C-2. [경미] 인프라 예산 해석이 5장과 7장에서 다르게 읽힐 수 있음
- 5장(5.7): 실 클라우드 요금 4개월 **15~26만원**, "인프라 250만원은 운영비 항목으로 해석, 잔여는 예비비".
- 7장(7.5): 인프라 **105만원(35%)** = "Supabase·Vercel·도메인·EAS 4개월 운영비".
- 두 해석 모두 "실비는 적고 나머지는 버퍼"라는 결론은 같으나 금액 표기(105만 vs 250만)가 독자에게 혼동.
- **권장 수정**: 사업계획서 "MVP 250만원"은 7장 표(인프라 105 + 운영·파트너십 75 + 마케팅 제작비 일부)로 분산 흡수된다는 7.5 매핑을 5.7에도 1줄 교차 참조. 실 클라우드 실비(~30만원)와 예산 항목(105만원)의 차액은 예비비/SaaS 전환분임을 양 섹션에 동일하게 명시.

### C-3. [경미] 활동 시드 50~100개를 1인 개발 + 파트너 1명(변준)이 베타(9월)까지 = 공급 리스크
- 6장(6.3.1) 베타 50~100개 vs 7장 S5 "시드 30~50개"로 **목표 수치 불일치**, 그리고 R2(공급 부족)가 ★★★ 최우선 리스크.
- **권장 수정**: 베타 게이트 활동 수를 **단일 숫자로 확정**(권장: 베타 최소 30개/6유형 각 5개 — 7장 S5 기준). 6장의 50~100개는 "정식(11월) 목표"로 재배치. 6.3.2 소싱 파이프라인 착수를 Phase 0(7월)부터로 당겨 R2 완화(7장도 "07~08 활동시드 선투입"이라 했으므로 정합).

## D. 기타 정합성

### D-1. [경미] 호스팅 표기 불일치 (Cloudflare Pages vs Vercel)
- 1장: **Cloudflare Pages 우선** / Vercel 대안. 합의 결정도 "Vercel/Cloudflare Pages".
- 5장·7장: **Vercel**을 기본으로 서술(7장 CI/CD가 "→Vercel", 5.7 비용표도 Vercel).
- **권장 수정**: 어느 쪽을 1순위로 할지 확정(둘 다 무료 티어로 PWA 배포 가능). 1장이 근거 문서이므로 Cloudflare Pages 우선이면 5·7장을 맞추고, Vercel 우선이면 1장을 수정. 일관성만 맞으면 기술적으로 무방.

### D-2. [경미] 카드 분량 "1/25"는 일관, 단 ε 탐색 비율 노출 위치 미정
- 2장은 25장 중 ε=20%(5장) 탐색 카드. 4장 응답 예시도 `is_explore` 플래그 포함(일관). 양호.

### D-3. [확인] 보안·개인정보·RLS는 5장이 충실, 4장 RLS 패턴과 정합 — 양호
- 4장(4.2.6)·5장(5.6.3) RLS 패턴(본인 소유 R/W, 공개 카탈로그 읽기, 금전/발급은 service_role 단독)이 일치. 수정 불필요.

---

# 지금 당장 시작할 Top 10 액션 아이템

> 우선순위 P0(블로커, 즉시) → P2(2~3주 내). 담당 코드: 준형=서준형, UX=UI/UX, 팀장=기획·테스트, 변준=파트너·예산, 예민=콘텐츠.

| # | 우선 | 액션 | 담당 | 예상 기간 |
|---|:---:|---|---|---|
| 1 | P0 | **도메인 단일화 결정 문서 작성**: 6유형 enum 코드·유사도 점수식(가중 유클리드 정본)·intensity 1~5·반응 값(like/skip/select)·보조성향 임계 60·피드백 계수(2장 정본)를 한 표로 확정 → 전 섹션 반영(검토메모 A·B 블로커 해소) | 준형+팀장 | 2~3일 |
| 2 | P0 | **활동/프로필 스키마 정본 확정**: `activities`+`activity_axis_scores`(컬럼형·검수이력) + `taste_profiles`(v_base/v_current/tag_weights) 단일안으로 마이그레이션 작성, JSON 중복 폐기(B-2·B-3) | 준형 | 3~4일 |
| 3 | P0 | **Phase 0 셋업(S0)**: Monorepo(Expo+RNW), Supabase 3프로젝트(dev/stg/prod), CI/CD→호스팅, 디자인 토큰, **EAS dev client 전제** 부트스트랩. 헬로월드 PWA 배포 | 준형, UX(토큰) | 2주 (~07.15) |
| 4 | P0 | **호스팅: Cloudflare Pages 정본 확정 완료**(2026-07) → Pages 프로젝트 생성·GitHub 연동만 남음. + 도메인 확보(feellog.kr/.app) + 딥링크 association 파일 선배치(D-1) | 준형, 변준(도메인 구매) | 1~2일 |
| 5 | P1 | **활동 시드 소싱 착수**: 서울 1~2개 구 공방·문화센터 콜드 아웃리치, 베타 최소 30개(6유형 각 5개) 목표. 제휴 제안서 + 수수료(10~15%) 안내(R2 완화, C-3) | 변준 | 즉시 착수~지속 |
| 6 | P1 | **12문항 라인 일러스트 자산 제작**(좌/우 대비쌍 24장, 파스텔·손글씨풍 통일, 저작권 0 리스크) + 문항-축-부호 매핑표(2.1.1) 최종 검수 | UX, 예민, 팀장(문항검수) | 2~3주 |
| 7 | P1 | **5축 태깅 루브릭 v1 확정 + 시드 30개 태깅 합의**(평가자 2~3인, 분산≤25 자동평균/초과 회의). 골든셋 12케이스 준비(S3 단위테스트용) | 예민+변준+팀장 | 2주 |
| 8 | P1 | **카카오 로그인 PoC**: 웹 OAuth → Edge Function 토큰 교환 → Supabase 세션 발급 경로 검증(시니어 핵심·전환 함정 선제거). Apple 로그인도 S1에 동시 포함 확정 | 준형 | 1주 |
| 9 | P2 | **`@feellog/core` 도메인 로직 스켈레톤**: 5축 점수(2.1.2)·6유형 분류(2.2.2)·가중 유클리드 매칭(2.3.3)을 순수 TS로, Vitest 단위테스트. 클라/Edge 양쪽 재사용 구조 | 준형 | 1.5주 |
| 10 | P2 | **분석 이벤트 스키마 + 로깅 초기 내장**: 가입→테스트완료→첫추천→카드반응 퍼널(4.5), card_impression/reaction 적재. "데이터부터 확보" 원칙(7장 재설계 원칙 4) | 준형, 팀장 | 1주 |

---

# 팀 SYNC가 결정해야 할 열린 질문

## 기술 (Technical)
1. ~~**호스팅 1순위**: Cloudflare Pages vs Vercel~~ → **[해결됨, 2026-07] Cloudflare Pages 정본 확정** (무료·대역폭 무제한·영리 사용 허용. Vercel 무료는 비영리 전용이라 제외)
2. **유형 코드 네이밍**: `vitality/...`(2장) vs `active_explorer/...`(4장 enum) vs `vital_explorer/...`(5장) 중 DB enum 정본은? (Top 10 #1과 연동, 결정 없이는 분류 결과 저장 불가)
3. **활동 5축 태깅 주체**: 내부 전담(6장 권장, 객관성) vs 파트너 자가입력 허용? 평가자 외부 1인 섭외 가능한가?
4. **피드백 보정 비대칭성**: like(α)와 dislike(β)를 다른 계수로 둘지(4장), dir로 대칭 처리할지(2장)? 앵커·하드클립을 Phase 1에 넣을지 Phase 4로 미룰지?
5. **카카오 로그인 경로**: Supabase가 카카오 기본 OAuth를 (운영 시점) 지원하면 토큰 교환 커스텀을 단순화할지 — 현재는 커스텀 전제. PoC(#8) 결과로 확정.
6. **서준형 실주간 가용시간**: 7장은 주 20~25시간·방학 집중 전제. 실제 학기 부담과 맞는가? 안 맞으면 Phase 1 4개월을 늘릴지 스코프를 더 줄일지.

## 스코프 (Scope)
7. **MVP 추천 엔진 깊이**: Phase 1에 2장 전체(MMR·ε감쇠·재분류·앵커)를 넣을지, Must만(5축·분류·매칭·단순EMA) 넣고 나머지를 백로그로 뺄지(C-1)?
8. **베타 게이트 활동 수**: 30개(7장) vs 50~100개(6장) 중 베타(9월) 기준 단일 확정?
9. **커뮤니티/예약을 Phase 2로 미루는 것 확정?** 사업계획서는 커뮤니티 8월인데 본 로드맵은 11월 이후. 지원사업 심사에 커뮤니티 데모가 필요하면 일부 당길지?
10. **앱 출시 시점**: 웹 정식(11월) 후 앱(2027 Q1)으로 충분한가, 아니면 특정 채널(카카오 선물하기 연동)이 앱을 더 일찍 요구하는가?

## 비즈니스 (Business)
11. **결제 도입 시점·범위**: Phase 2까지 "예약 외부 링크"로 우회 후 PG 도입이 매출/수수료 모델에 충분한가? 자체 결제 내재화(7천만원 고도화)는 어떤 투자 확보 후로?
12. **수수료율 확정**: 10~15% 중 활동 유형·볼륨별 차등 기준을 파트너 계약 표준으로 사전 확정할지?
13. **지원사업 응모 캘린더**: 로컬크리에이터·초기창업패키지·사회적기업가 육성사업의 실제 2026~2027 공고일 확인(변준) — 베타 URL(9월) 역산이 맞는지?
14. **국외이전 동의 범위**: Supabase 서울 리전이어도 운영 주체 국외 가능성 → 보수적 국외이전 고지 포함(법무 검토 필요)할지?
15. **효도 선물(2040 자녀) vs 본인 사용(5060) 유입 비중 가정**: KPI(7.6)의 보수적 전환율 가정이 마케팅 예산(메타 50만원) 규모와 맞는가, 채널별 목표를 분리할지?

---

검토 결론: **블로커 5건(A-1, A-2, B-1, B-2, 그리고 도메인 단일화 미결정)은 코드 작성 전 반드시 1개 표로 확정**해야 한다(Top 10 #1·#2). 이를 제외하면 7개 섹션은 동일한 5축 −100~+100 좌표계·웹우선·Supabase·자체추천이라는 단일 진실 원천 위에서 대체로 정합하며, 홈 상태분기·RLS·인증 흐름·접근성·예산 결론은 섹션 간 일관성이 양호하다.
