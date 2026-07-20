/**
 * 활동 카드 표시용 파생 데이터(데모 기본값).
 * 시드 CSV에 가격·시간·난이도가 미정이라(전부 공란), 화면(디자인: 가격/소요시간/난이도/태그)을
 * 채우기 위해 활동 id 기반으로 "결정적" 데모 값을 파생한다.
 * 실데이터가 DB(activities 테이블)에 채워지면 그 값이 우선한다.
 */
import type { Activity } from '@/core';

/** id → 안정적 해시(데모 값 파생용) */
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 카테고리별 가격대(원) — 데모 기본값 */
const PRICE_BAND: Record<string, [number, number]> = {
  요리: [35000, 65000],
  수공예: [30000, 60000],
  미술: [25000, 50000],
  플라워: [30000, 55000],
  뷰티: [40000, 80000],
  액티비티: [15000, 45000],
  음악: [30000, 60000],
  라이프스타일: [20000, 45000],
  정규: [80000, 160000],
};

export function demoPrice(a: Activity): number {
  const [lo, hi] = PRICE_BAND[a.category] ?? [30000, 60000];
  const step = 5000;
  const range = Math.floor((hi - lo) / step) + 1;
  return lo + (hashOf(a.id) % range) * step;
}

/** 소요 시간(분) — 정규는 회당 90분, 그 외 90~150분 */
export function demoDurationMin(a: Activity): number {
  if (a.category === '정규') return 90;
  return [90, 120, 120, 150][hashOf(a.id) % 4];
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 난이도(하/중/상) — 신체 부담 기반 */
export function demoDifficulty(a: Activity): '하' | '중' | '상' {
  if (a.physicalBurden <= 2) return '하';
  if (a.physicalBurden <= 3) return '중';
  return '상';
}

/** 태그 3개 — 벡터에서 파생(디자인: #실내 #초급 #정적인) */
export function demoTags(a: Activity): string[] {
  const indoor = a.category === '액티비티' && a.vector.physical >= 10 ? '야외' : '실내';
  const level = a.physicalBurden <= 2 ? '초급' : a.physicalBurden <= 3 ? '중급' : '도전';
  const mood = a.vector.physical <= 0 ? '정적인' : '활동적인';
  return [indoor, level, mood];
}

/** 후기 평점/개수 — 데모 기본값(실 후기 생기면 DB 집계 우선) */
export function demoRating(a: Activity): { rating: number; count: number } {
  const h = hashOf(a.id);
  return { rating: Math.round((4.2 + (h % 8) / 10) * 10) / 10, count: 8 + (h % 40) };
}

/** 카테고리 → 대표 사진(기존 번들 실사진 재사용) */
const CATEGORY_PHOTOS: Record<string, number> = {
  요리: require('../../assets/photos/category-cooking.jpg'),
  수공예: require('../../assets/photos/category-pottery.jpg'),
  미술: require('../../assets/photos/category-calligraphy.jpg'),
  플라워: require('../../assets/photos/category-garden.jpg'),
  뷰티: require('../../assets/photos/category-photography.jpg'),
  액티비티: require('../../assets/photos/category-hiking.jpg'),
  음악: require('../../assets/photos/category-music.jpg'),
  라이프스타일: require('../../assets/photos/category-photography.jpg'),
  정규: require('../../assets/photos/category-exhibition.jpg'),
};

/** 카테고리 내 변화를 위해 일부 활동은 보조 사진으로 순환 */
const ALT_PHOTOS: number[] = [
  require('../../assets/photos/category-woodwork.jpg'),
  require('../../assets/photos/category-yoga.jpg'),
  require('../../assets/photos/category-cycling.jpg'),
  require('../../assets/photos/category-classic.jpg'),
  require('../../assets/photos/community-pottery.jpg'),
];

export function demoPhoto(a: Activity): number {
  const base = CATEGORY_PHOTOS[a.category];
  if (base == null) return ALT_PHOTOS[0];
  // 같은 카테고리 안에서도 1/3은 보조 사진으로 섞어 단조로움 완화(결정적)
  const h = hashOf(a.id);
  if (a.category === '액티비티' && h % 3 === 1) return ALT_PHOTOS[1];
  if (a.category === '액티비티' && h % 3 === 2) return ALT_PHOTOS[2];
  if (a.category === '음악' && h % 2 === 1) return ALT_PHOTOS[3];
  if (a.category === '수공예' && h % 3 === 1) return ALT_PHOTOS[0];
  if (a.category === '수공예' && h % 3 === 2) return ALT_PHOTOS[4];
  return base;
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

/** 지역(데모) — 검색 필터·상세 위치용 */
const REGIONS = ['서울 성동구', '서울 마포구', '서울 종로구', '경기 고양시', '경기 성남시', '인천 연수구', '서울 송파구', '서울 강서구'];
export function demoRegion(a: Activity): string {
  return REGIONS[hashOf(a.id) % REGIONS.length];
}
