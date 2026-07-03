/**
 * Feellog 디자인 토큰 — 모서리 둥글기 (v5)
 *
 * 실서비스 실측: 썸네일 4~12px, 카드 8~16px, 대라운드는 바텀시트·필 칩 전용.
 * '큰 라운드 + 파스텔 + 두꺼운 그림자'의 합성이 유아성의 근원(시니어 리서치) — 라운드를 한 단계씩 줄임.
 */

export const radius = {
  sm: 6, // 키워드 태그·작은 칩
  md: 10, // 썸네일·인풋
  lg: 12, // 버튼·미디엄 카드
  xl: 16, // 카드·사진 블록
  xxl: 24, // 바텀시트·모달 상단
  pill: 999, // 필 칩·배지 전용(버튼 금지)
} as const;

export type RadiusToken = keyof typeof radius;
