/**
 * Feellog 디자인 토큰 — 그림자 (v6 Figma DS).
 * 부드러운 뉴트럴 드롭섀도 — CTA·플로팅 탭바·카드에 옅게.
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
  shadowColor: '#1C1C1A',
  shadowOffset: { width: 0, height: yOffset },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const shadows = {
  none: Platform.select({ default: {} }) as object,
  /** 카드 기본(아주 옅게) */
  card: make(2, 8, 0.06, 2),
  /** CTA·강조 카드 */
  cta: make(4, 12, 0.12, 4),
  /** 플로팅 탭바·시트 */
  floating: make(-2, 16, 0.08, 8),
  raised: make(8, 24, 0.14, 8),
} as const;

export type ShadowToken = keyof typeof shadows;
