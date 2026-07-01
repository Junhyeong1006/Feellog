/**
 * 표시용 포맷터 — 활동 카드/상세에서 공통 사용.
 */

/** 1234000 → "1,234,000원", 0/null → "무료" */
export function formatPrice(price?: number | null): string {
  if (price == null || price === 0) return '무료';
  return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`;
}

/** 90 → "1시간 30분", 60 → "1시간", 45 → "45분" */
export function formatDuration(min?: number | null): string {
  if (min == null || min <= 0) return '시간 미정';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 시도 + 시군구 결합 */
export function formatRegion(sido?: string | null, sigungu?: string | null): string {
  const parts = [sido, sigungu].filter((s): s is string => Boolean(s && s.trim()));
  return parts.length > 0 ? parts.join(' ') : '지역 미정';
}

const INTENSITY_LABEL: Record<number, string> = {
  1: '매우 가벼움',
  2: '가벼움',
  3: '보통',
  4: '활발함',
  5: '매우 활발함',
};

/** 1~5 → 라벨(+ 점 표시) */
export function formatIntensity(intensity?: number | null): string {
  if (intensity == null) return '강도 미정';
  const clamped = Math.max(1, Math.min(5, intensity));
  return INTENSITY_LABEL[clamped] ?? '보통';
}
