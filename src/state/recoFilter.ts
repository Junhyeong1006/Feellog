/**
 * 추천 하드필터 로컬 저장(S5: 지역/예산 필터).
 * 시니어 UX상 필터는 단순하게 2종만: 지역(시/도) + 참가비 상한.
 * 선택은 기기에 저장돼 다음 방문에도 유지된다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RecoFilter } from '@/core';

const KEY = 'feellog.recoFilter';

/** 참가비 상한 옵션(원). null=전체 */
export const PRICE_OPTIONS = [
  { value: null, label: '전체' },
  { value: 0, label: '무료만' },
  { value: 30000, label: '3만원 이하' },
  { value: 50000, label: '5만원 이하' },
] as const;

export function priceLabelOf(maxPrice: number | null): string {
  return PRICE_OPTIONS.find((o) => o.value === maxPrice)?.label ?? '전체';
}

export interface StoredRecoFilter {
  regionSido: string | null;
  maxPrice: number | null;
}

export const EMPTY_FILTER: StoredRecoFilter = { regionSido: null, maxPrice: null };

export function hasActiveFilter(f: StoredRecoFilter): boolean {
  return f.regionSido != null || f.maxPrice != null;
}

/** 코어 recommend()에 넘길 형태로 변환 */
export function toCoreFilter(f: StoredRecoFilter): RecoFilter | undefined {
  if (!hasActiveFilter(f)) return undefined;
  return {
    ...(f.regionSido != null && { regionSido: f.regionSido }),
    ...(f.maxPrice != null && { maxPrice: f.maxPrice }),
  };
}

export async function getRecoFilter(): Promise<StoredRecoFilter> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_FILTER;
    const p = JSON.parse(raw) as Partial<StoredRecoFilter>;
    return {
      regionSido: typeof p.regionSido === 'string' ? p.regionSido : null,
      maxPrice: typeof p.maxPrice === 'number' ? p.maxPrice : null,
    };
  } catch {
    return EMPTY_FILTER;
  }
}

export async function setRecoFilter(f: StoredRecoFilter): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    // 저장 실패는 무시(세션 내에는 반영됨)
  }
}
