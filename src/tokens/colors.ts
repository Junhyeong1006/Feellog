/**
 * Feellog 디자인 토큰 — 컬러 (v5 "딥 포레스트" 팔레트)
 *
 * 2026-07 실서비스 8사 실측 리서치(클래스101·프립·오늘의집·문토·남의집·아이디어스·솜씨당·트레바리) 결론:
 *  · 배경은 순백 #FFFFFF, 구분면만 근백 그레이 — 크림/파스텔 전면 배경은 실서비스 0곳.
 *  · 브랜드색은 고채도 1색을 CTA·활성상태에만(화면 면적 5% 미만). 파스텔 다색 병용 폐기.
 *  · 텍스트는 무채(웜뉴트럴) 3단 램프, 색이 아니라 굵기로 위계.
 *
 * 브랜드 = 딥 포레스트 그린 #1E6B4F: 등산·텃밭·산책 등 5060 상위 취미와 직결,
 * 한국 취미·여가 앱 중 점유자 없음. 흰 배경 위 6.42:1 — 채움과 텍스트 겸용 가능(AA).
 * 액센트 = 테라코타 #C2410C 1색만(좋아요·온기 포인트, 흰 배경 5.2:1).
 *
 * 시니어 접근성: 모든 텍스트 조합 WCAG AA 4.5:1 이상 계산 검증(2026-07 컬러 리서치).
 */

export const palette = {
  // 브랜드 그린(채움·텍스트 겸용 — 흰 배경 6.42:1)
  green600: '#1E6B4F',
  green700: '#15503A', // pressed(눌림 채움 — 흰 글자 9.4:1)
  greenTint: '#E6F2EC', // 선택 칩·활성 배지 배경(green600 텍스트와 5.6:1)

  // 액센트 테라코타(좋아요·포인트 — 흰 배경 5.2:1)
  terracotta: '#C2410C',
  terracottaTint: '#FBEDE6',

  // 종이(순백 + 근백 구분면)
  white: '#FFFFFF',
  mist: '#F5F7F4', // 섹션 밴드·입력 배경(그린 힌트 근백)
  inset: '#F1F4F1', // 메타 카드·인셋 면
  border: '#E3E8E2', // 헤어라인 보더·디바이더
  borderSoft: '#EEF1EE', // 흰 카드 가장자리(더 옅은 헤어라인)

  // 잉크 램프(흰 배경 기준 대비 검증)
  ink: '#1B2420', // 15.9:1 — 제목·본문
  gray600: '#49564E', // 7.7:1 — 보조 본문
  gray500: '#5F6E65', // 5.4:1 — 캡션 하한(mist 위에서도 5.0:1)
  gray400: '#8A958E', // 장식·플레이스홀더 전용(텍스트 정보 전달 금지)
  gray300: '#B6BEB9', // 장식 전용

  // 상태(텍스트로도 쓰이므로 AA 확보)
  red600: '#C62828', // 5.6:1 — 그린과 보색이라 색각이상에서도 구분 명확
  amber700: '#96590D', // 5.6:1
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
  /** 브랜드 그린 — 채움(CTA·활성)과 텍스트(링크·강조) 겸용(6.42:1) */
  primary: palette.green600,
  primaryPressed: palette.green700,
  /** 그린 텍스트/아이콘 별칭(채움과 동일 — v4의 잉크 분리가 필요 없어짐) */
  primaryInk: palette.green600,
  primaryTint: palette.greenTint,
  /** 테라코타 액센트 — 좋아요·별점·온기 포인트 1색만 */
  accent: palette.terracotta,
  accentTint: palette.terracottaTint,

  background: palette.white, // 전 화면 기본 배경(순백)
  surface: palette.white, // 카드 면(구분은 헤어라인 보더)
  surfaceAlt: palette.mist, // 섹션 밴드·피드 배경·입력
  surfaceInset: palette.inset, // 메타 카드·인셋 면
  border: palette.border,
  /** 흰 카드 가장자리(더 옅은 헤어라인) */
  borderOnWhite: palette.borderSoft,

  textPrimary: palette.ink,
  textSecondary: palette.gray600,
  textMuted: palette.gray500,
  onPrimary: palette.white,
  /** 사진(딤 오버레이) 위 텍스트 — 흰색 계열은 반드시 이 두 토큰만 사용 */
  onPhoto: palette.white,
  onPhotoSoft: 'rgba(255,255,255,0.92)',
  /** 사진 위 글래스 칩 배경(흰 텍스트와 조합 — 어두운 딤이라 AA 확보) */
  photoChip: 'rgba(18, 22, 20, 0.55)',

  danger: palette.red600,
  success: palette.green600,
  warning: palette.amber700,

  // 보조 버튼(둘러보기·취소)
  secondaryBg: palette.inset,
  secondaryText: palette.ink,

  /** 모달 배경 딤(시트/다이얼로그 공용) */
  scrim: 'rgba(18, 22, 20, 0.5)',
  /** 사진 위 오버레이 버튼 배경(라벨 대비 확보용 진한 딤) */
  scrimStrong: 'rgba(18, 22, 20, 0.78)',
} as const;

/**
 * 사진 오버레이 그라데이션(expo-linear-gradient colors 배열).
 * 실서비스 문법: 텍스트온포토는 히어로·배너에서만, 하단 딤 42%→0.74가 표준.
 */
export const photoOverlay = {
  /** 하단 텍스트용(히어로·추천 카드): 투명 → 진한 딤. 캡션(0.92 흰색)까지 AA 확보 위해
   *  텍스트 구간(하단 ~40%)은 0.45 이상을 유지한다(2026-07 접근성 리뷰). */
  bottom: ['rgba(18,22,20,0)', 'rgba(18,22,20,0.45)', 'rgba(18,22,20,0.85)'] as const,
  /** 상단 스크림(사진 위 로고·뒤로가기 대비 보조) */
  top: ['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)'] as const,
  /** 좌→우 배너(홈 유형 배너: 좌측 텍스트 대비) */
  banner: ['rgba(15,20,18,0.84)', 'rgba(15,20,18,0.55)', 'rgba(15,20,18,0.12)'] as const,
} as const;

export type ColorToken = keyof typeof colors;
