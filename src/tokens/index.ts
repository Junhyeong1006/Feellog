/**
 * Feellog 디자인 토큰 — 단일 진입점(SSOT)
 * 웹·앱 컴포넌트는 모두 여기서 토큰을 가져온다. 색상 하드코딩 금지.
 */
export { colors, palette, type ColorToken } from './colors';
export { typography, fontWeight, type TypographyToken } from './typography';
export { spacing, MIN_TOUCH_SIZE, MAX_CONTENT_WIDTH, type SpacingToken } from './spacing';
export { radius, type RadiusToken } from './radius';

import { colors } from './colors';
import { typography, fontWeight } from './typography';
import { spacing, MIN_TOUCH_SIZE, MAX_CONTENT_WIDTH } from './spacing';
import { radius } from './radius';

export const tokens = {
  colors,
  typography,
  fontWeight,
  spacing,
  radius,
  MIN_TOUCH_SIZE,
  MAX_CONTENT_WIDTH,
} as const;
