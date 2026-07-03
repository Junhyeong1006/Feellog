/**
 * Feellog 디자인 토큰 — 그림자 (v5)
 *
 * 실서비스 실측: 콘텐츠 카드에 그림자를 주는 곳 0곳 — 그림자는 바텀시트·드롭다운·
 * 고정 CTA·사진 히어로 카드 전용. 카드의 경계는 헤어라인 보더가 담당한다.
 * RN/웹 모두 동작하도록 elevation(안드)도 함께 둔다.
 */
import { Platform } from 'react-native';

type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

const make = (yOffset: number, radius: number, opacity: number, elevation: number): Shadow => ({
  shadowColor: '#1A1D1F',
  shadowOffset: { width: 0, height: yOffset },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const shadows = {
  none: Platform.select({ default: {} }) as object,
  /** 아주 옅은 1레이어(hover·구분 보조) */
  soft: make(1, 3, 0.06, 1),
  /** 일반(사진 히어로 카드 등 꼭 필요한 곳만) */
  card: make(2, 8, 0.08, 2),
  /** 떠 있는 요소(바텀시트·드롭다운·hover 리프트) */
  raised: make(8, 24, 0.12, 8),
} as const;

export type ShadowToken = keyof typeof shadows;
