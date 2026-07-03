/**
 * 카테고리 → 폴백 글리프(MCI 아이콘) 매핑 (v5).
 * 사진(categoryPhoto)이 1순위이고, 이 글리프는 사진이 없는 미지 카테고리의 최후 폴백 +
 * 소형 아이콘 슬롯(필터 등) 전용. 파스텔 틴트 배정은 폐기 — 중립 면 + 보조 잉크 단색.
 * 모든 아이콘명은 설치본 글리프맵(@expo/vector-icons 15.x)에서 존재 검증됨.
 */
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@/tokens';

export type CategoryIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface CategoryVisual {
  /** MaterialCommunityIcons 글리프명 */
  icon: CategoryIconName;
  /** 폴백 면(중립) */
  accent: string;
  /** 아이콘·라벨 잉크색 */
  ink: string;
}

const ICONS: Record<string, CategoryIconName> = {
  등산: 'hiking',
  라이딩: 'bike',
  공예: 'scissors-cutting',
  목공: 'hand-saw',
  캘리그라피: 'fountain-pen-tip',
  음악: 'music',
  요리: 'chef-hat',
  사진: 'camera-outline',
  요가: 'yoga',
  전시: 'image-frame',
  클래식: 'violin',
  텃밭: 'sprout',
};

export function categoryVisual(category?: string | null): CategoryVisual {
  const icon = (category && ICONS[category]) || 'compass-outline';
  return { icon, accent: colors.surfaceAlt, ink: colors.textSecondary };
}
