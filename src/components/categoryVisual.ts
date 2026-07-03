/**
 * 카테고리 → 시각 표현(MCI 아이콘 + 틴트 배경 + 잉크색) 트리플.
 * 아이콘은 MaterialCommunityIcons 전용 구역(카테고리 칩/밴드/카드 히어로)에서만 사용하고,
 * UI 크롬(탭·액션·메타)은 Ionicons로 분리한다 — 패밀리 혼용 금지.
 * 모든 아이콘명은 설치본 글리프맵(@expo/vector-icons 15.x)에서 존재 검증됨.
 * 실제 이미지가 생기면 imageUrl 우선, 없을 때만 이 비주얼로 폴백한다.
 */
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, palette } from '@/tokens';

export type CategoryIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface CategoryVisual {
  /** MaterialCommunityIcons 글리프명 */
  icon: CategoryIconName;
  /** 틴트 배경(밴드/스쿼클 칩) */
  accent: string;
  /** 아이콘·라벨 잉크색(틴트 위 AA) */
  ink: string;
}

const BLUE = { accent: colors.primaryTint, ink: colors.primaryInk } as const;
const MINT = { accent: palette.mint, ink: colors.mintInk } as const;
const CORAL = { accent: palette.coralTint, ink: colors.coralInk } as const;
const CREAM = { accent: colors.surfaceInset, ink: palette.gray600 } as const;

const MAP: Record<string, CategoryVisual> = {
  등산: { icon: 'hiking', ...BLUE },
  라이딩: { icon: 'bike', ...BLUE },
  공예: { icon: 'scissors-cutting', ...MINT },
  목공: { icon: 'hand-saw', ...CORAL },
  캘리그라피: { icon: 'fountain-pen-tip', ...CREAM },
  음악: { icon: 'music', ...MINT },
  요리: { icon: 'chef-hat', ...CORAL },
  사진: { icon: 'camera-outline', ...BLUE },
  요가: { icon: 'yoga', ...MINT },
  전시: { icon: 'image-frame', ...CREAM },
  클래식: { icon: 'violin', ...CORAL },
  텃밭: { icon: 'sprout', ...MINT },
};

const DEFAULT: CategoryVisual = { icon: 'compass-outline', ...BLUE };

export function categoryVisual(category?: string | null): CategoryVisual {
  if (!category) return DEFAULT;
  return MAP[category] ?? DEFAULT;
}
