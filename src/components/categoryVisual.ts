/**
 * 카테고리 → 시각 표현(이모지 + 배경 강조색). 활동 이미지가 없을 때 카드/상세 상단 밴드에 사용.
 * 실제 이미지가 생기면 imageUrl 우선, 없을 때만 이 밴드로 폴백한다.
 */
import { colors, palette } from '@/tokens';

export interface CategoryVisual {
  emoji: string;
  accent: string;
}

const ACCENT = {
  blue: colors.primaryTint,
  mint: palette.mint,
  coral: palette.coralTint,
  cream: colors.surfaceInset,
} as const;

const MAP: Record<string, CategoryVisual> = {
  등산: { emoji: '🥾', accent: ACCENT.blue },
  라이딩: { emoji: '🚲', accent: ACCENT.blue },
  공예: { emoji: '🫖', accent: ACCENT.mint },
  목공: { emoji: '🪵', accent: ACCENT.coral },
  캘리그라피: { emoji: '✍️', accent: ACCENT.cream },
  음악: { emoji: '🎶', accent: ACCENT.mint },
  요리: { emoji: '🍳', accent: ACCENT.coral },
  사진: { emoji: '📷', accent: ACCENT.blue },
  요가: { emoji: '🧘', accent: ACCENT.mint },
  전시: { emoji: '🖼️', accent: ACCENT.cream },
  클래식: { emoji: '🎻', accent: ACCENT.coral },
  텃밭: { emoji: '🌱', accent: ACCENT.mint },
};

const DEFAULT: CategoryVisual = { emoji: '🎨', accent: ACCENT.blue };

export function categoryVisual(category?: string | null): CategoryVisual {
  if (!category) return DEFAULT;
  return MAP[category] ?? DEFAULT;
}
