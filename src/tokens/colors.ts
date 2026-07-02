/**
 * Feellog 디자인 토큰 — 컬러 ("따뜻한 종이" 팔레트)
 *
 * 출처: 기획 프로토타입(docs/필로그 프로토타입). 크림/베이지 배경 + 콘플라워 블루 +
 * 코랄/민트 포인트. 웹·앱 공통. 다크모드는 Phase 2(라이트 + 고대비만 먼저).
 *
 * 시니어 접근성 규칙(토스 TDS·당근 Seed·NULI 벤치마킹, 2026-07 디자인 리서치):
 *  · 브랜드 원색(blue500/coral/mintStrong)은 "채움"(버튼 배경·차트·일러스트) 전용.
 *    텍스트/아이콘에는 반드시 잉크 변형(*Ink)을 쓴다 — 원색은 크림/흰 배경 대비 AA 미달.
 *  · 그레이는 크림 배경 기준으로 대비를 검증한 웜 톤(쿨 그레이는 크림 위에서 탁해 보임).
 *  · 상태색(danger/warning/success)도 텍스트로 쓰이므로 4.5:1 이상으로 유지.
 */

export const palette = {
  // 브랜드 블루
  blue500: '#5B8DEF', // primary(채움 전용 — 텍스트 금지)
  blue600: '#3F6FD6', // pressed(버튼 눌림 채움)
  blue700: '#3563C9', // ink — 파란 텍스트/링크/활성 라벨(크림·흰 배경 AA)
  blueTint: '#EEF3FF',

  // 포인트
  coral: '#F4A088', // 채움 전용
  coralTint: '#FBE4DB', // 연한 코랄(배지/밴드 배경)
  coralDeep: '#A04A2A', // ink — 코랄 계열 텍스트(코랄 틴트 위 4.9:1)
  mint: '#DCF1E7',
  mintStrong: '#3FB37F', // 채움 전용
  mintDeep: '#20794F', // ink — 민트 계열 텍스트(성공/매칭 배지)

  // 종이(크림/베이지)
  paper: '#FAF8F3', // 앱 배경
  cream: '#F3F1EA', // 크림 인셋 표면
  cream2: '#F0EEE6',
  beige: '#EDE7DC',
  border: '#E7E1D6', // 크림 위 헤어라인
  borderOnWhite: '#F0EBE0', // 흰 카드의 가장자리(그림자 보조 — 노안 대비감 보완)

  // 잉크/그레이(웜 램프 — 크림 #FAF8F3 기준 대비 검증)
  ink: '#33302A', // ≈12.5:1
  gray600: '#5C574B', // ≈6.9:1 — 본문 보조
  gray500: '#6E6759', // ≈5.4:1
  gray400: '#7D766A', // ≈4.5:1 — 캡션 하한
  gray300: '#948D80', // 장식 전용(텍스트 금지)
  gray200: '#B5AFA3', // 장식 전용
  white: '#FFFFFF',

  // 상태(텍스트로도 쓰이므로 AA 확보)
  red500: '#BE3E3C', // 크림 위 5.0:1
  amber600: '#8F6217', // 크림 위 5.0:1
} as const;

/**
 * 소셜 로그인 브랜드 색 — 외부 브랜드 가이드 고정값(우리 디자인 시스템 밖).
 * 컴포넌트에서 직접 하드코딩하지 않도록 여기 토큰으로 둔다.
 */
export const brand = {
  kakao: '#FEE500',
  kakaoText: '#191600',
  google: '#FFFFFF',
  googleBorder: '#DADCE0',
  googleText: '#1F1F1F',
  apple: '#000000',
  appleText: '#FFFFFF',
} as const;

export type BrandToken = keyof typeof brand;

/** 의미 기반 컬러(컴포넌트는 이걸 참조. 하드코딩 금지) */
export const colors = {
  primary: palette.blue500,
  primaryPressed: palette.blue600,
  /** 파란 "텍스트/아이콘"은 항상 이것 — primary 원색 텍스트는 AA 미달 */
  primaryInk: palette.blue700,
  primaryTint: palette.blueTint,
  accentCoral: palette.coral,
  accentMint: palette.mint,
  mint: palette.mintStrong,
  /** 코랄 계열 텍스트(좋아요 활성 등) */
  coralInk: palette.coralDeep,
  /** 민트 계열 텍스트(성공/매칭) */
  mintInk: palette.mintDeep,

  background: palette.paper, // 크림 "종이" 배경
  surface: palette.white, // 흰 카드(헤어라인 + 부드러운 그림자)
  surfaceInset: palette.cream, // 크림 인셋(입력/구획)
  surfaceAlt: palette.cream2,
  border: palette.border,
  /** 흰 카드 가장자리 헤어라인 */
  borderOnWhite: palette.borderOnWhite,

  textPrimary: palette.ink,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  onPrimary: palette.white,

  danger: palette.red500,
  success: palette.mintDeep,
  warning: palette.amber600,

  // 보조 버튼('둘러보기')
  secondaryBg: palette.cream2,
  secondaryText: palette.ink,
} as const;

export type ColorToken = keyof typeof colors;
