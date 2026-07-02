/**
 * Feellog 디자인 토큰 — 그림자 ("따뜻한 종이" 톤의 웜 브라운 그림자)
 * 크림 캔버스에는 쿨 블랙 그림자가 차갑게 떠 보여서 웜 톤으로 통일(디자인 리서치).
 * 그림자는 옅게 — 카드의 실제 경계는 헤어라인 보더(colors.borderOnWhite)가 담당한다(노안 대비).
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
  shadowColor: '#3C3220', // 웜 브라운(크림 캔버스와 동계열)
  shadowOffset: { width: 0, height: yOffset },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const shadows = {
  none: Platform.select({ default: {} }) as object,
  card: make(4, 10, 0.08, 3), // 일반 카드
  raised: make(8, 18, 0.14, 8), // 떠 있는 카드(추천 카드·시트)
  soft: make(2, 6, 0.05, 2), // 아주 옅은
} as const;

export type ShadowToken = keyof typeof shadows;
