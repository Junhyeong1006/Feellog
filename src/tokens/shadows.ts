/**
 * Feellog 디자인 토큰 — 그림자 (부드러운 블루그레이, "따뜻한 종이" 톤)
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
  shadowColor: '#323C54', // rgba(50,60,84)
  shadowOffset: { width: 0, height: yOffset },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const shadows = {
  none: Platform.select({ default: {} }) as object,
  card: make(8, 13, 0.14, 3), // 일반 카드
  raised: make(14, 24, 0.22, 8), // 떠 있는 카드(추천 카드)
  soft: make(4, 8, 0.06, 2), // 아주 옅은
} as const;

export type ShadowToken = keyof typeof shadows;
