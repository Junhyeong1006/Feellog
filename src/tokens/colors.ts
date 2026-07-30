/**
 * Feellog 디자인 토큰 — 컬러 (v6 "Figma DS" — 파일 KCfzH4RlNQn5MhYLhVAA74 디자인 시스템 정본).
 *
 * Figma named styles 실측(2026-07 추출):
 *  · Primitive 6색: Blue(주 브랜드)·Yellow·Calot(코랄)·Purple·Mint·Brown + 각 Subtle 틴트
 *  · Neutral 8단계 웜그레이(#FEFEFE~#1C1C1A)
 *  · Function: cta=blue, warning=yellow, danger=coral, success=mint
 * 배경은 neutral50(#F8F8F8 — 26.07 온보딩작업 페이지에서 #FAFAF8→#F8F8F8 변경), 카드 표면은 neutral0(#FEFEFE).
 */

export const palette = {
  // Primitive (브랜드 6색)
  blue: '#5793F4',
  yellow: '#FAC342',
  coral: '#EE7864', // Figma 명칭 'Calot'
  purple: '#A980EF',
  mint: '#85E6C7',
  brown: '#9A6A4B',

  // Primitive Pastel (장식 도형용 — Figma 원색 60% 불투명을 흰 배경 기준 사전 블렌딩)
  bluePastel: '#9ABEF8',
  coralPastel: '#F5AEA2',
  mintPastel: '#B6F0DD',

  // Primitive Deep (WCAG AA 보정용 — 브랜드 색을 대비 기준까지 어둡게. 시니어 접근성 사수)
  yellowDeep: '#C77F00', // 흰 배경 위 3.22:1 — 대형 텍스트(20/700)·아이콘 전용
  coralDeep: '#DC6450', // 흰 텍스트 3.51:1 — 컬러 카드/버튼 배경용
  mintDeep: '#147A58', // 민트(#85E6C7) 위 3.58:1 — 민트 원 안 아이콘용

  // Primitive Subtle (연한 배경 틴트)
  blueSubtle: '#DBEAFE',
  yellowSubtle: '#FEF3D7',
  coralSubtle: '#FDEAE7',
  purpleSubtle: '#F0E8FD',
  mintSubtle: '#E0FAF2',
  brownSubtle: '#F5EDE6',

  // Neutral 8단계 (웜그레이)
  neutral0: '#FEFEFE', // 카드/표면
  neutral50: '#F8F8F8', // 앱 배경
  neutral100: '#F4F3F0', // 비활성 배경/서치바
  neutral200: '#E8E7E3', // 구분선/비활성 도트
  neutral300: '#C8C7C3', // 보더
  neutral400: '#A8A7A3', // 플레이스홀더
  neutral600: '#6B6A67', // 보조 텍스트
  neutral900: '#1C1C1A', // 본문 텍스트

  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * 소셜 로그인 브랜드 색 — 외부 브랜드 가이드 고정값(우리 디자인 시스템 밖).
 */
export const brand = {
  kakao: '#FAC342', // Figma 시안 값(옐로 계열)
  kakaoText: '#000000',
  google: '#E8E7E3',
  googleText: '#1F1F1F',
  apple: '#1C1C1A',
  appleText: '#FCF9F8',
  naver: '#03C75A',
  naverText: '#FFFFFF',
} as const;

export type BrandToken = keyof typeof brand;

/** 의미 기반 컬러(컴포넌트는 이걸 참조. 하드코딩 금지) */
export const colors = {
  /** 주 브랜드 블루 — CTA·활성 탭·링크 */
  primary: palette.blue,
  primaryPressed: '#3673D4', // 눌림(구 DS 다크블루 — 인터랙션 전용)
  primaryTint: palette.blueSubtle,
  /** 밝은 배경 위 블루 "텍스트" 전용 — #F8F8F8 위 5.07:1 AA (브랜드 블루 #5793F4는 2.87:1이라 텍스트 금지) */
  primaryText: '#2F68C4',

  accentYellow: palette.yellow,
  accentCoral: palette.coral,
  accentPurple: palette.purple,
  accentMint: palette.mint,

  background: palette.neutral50,
  surface: palette.neutral0,
  surfaceInset: palette.neutral100,
  border: palette.neutral300,
  divider: palette.neutral200,

  textPrimary: palette.neutral900,
  textSecondary: palette.neutral600,
  textMuted: palette.neutral400,
  onPrimary: palette.neutral0,

  danger: palette.coral,
  /** 위험 액션 "배경"(흰 라벨) — 흰 텍스트 3.51:1 (coral 원색은 2.80:1) */
  dangerStrong: palette.coralDeep,
  /** 밝은 배경 위 위험 "텍스트" — 흰 카드 위 5.39:1 AA */
  dangerText: '#C0392B',
  warning: palette.yellow,
  success: palette.mint,

  /** 모달/시트 딤 */
  scrim: 'rgba(28, 28, 26, 0.5)',
} as const;

/** 카테고리 → 색 매핑 (DS Expressive Semantic) */
export const categoryColors: Record<string, { main: string; subtle: string }> = {
  액티비티: { main: palette.blue, subtle: palette.blueSubtle },
  요리: { main: palette.yellow, subtle: palette.yellowSubtle },
  수공예: { main: palette.coral, subtle: palette.coralSubtle },
  미술: { main: palette.purple, subtle: palette.purpleSubtle },
  음악: { main: palette.purple, subtle: palette.purpleSubtle },
  플라워: { main: palette.mint, subtle: palette.mintSubtle },
  뷰티: { main: palette.purple, subtle: palette.purpleSubtle },
  라이프스타일: { main: palette.brown, subtle: palette.brownSubtle },
  정규: { main: palette.brown, subtle: palette.brownSubtle },
};

export type ColorToken = keyof typeof colors;
