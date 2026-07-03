/**
 * 카테고리/유형 → 번들 실사진 매핑 (v5 사진 우선 원칙의 SSOT).
 *
 * "사진이 곧 상품"(취미 서비스 실측 문법) — DB image_url이 없어도 카테고리 사진으로
 * 항상 실사를 보여준다. 우선순위: 원격 imageUrl > 번들 카테고리 사진 > 글리프 폴백.
 *
 * 출처: Pexels/Unsplash 무료 상업 라이선스(고지 의무 없음), 2026-07 확보.
 * 톤 기준: 따뜻한 자연광·손/뒷모습 위주(얼굴 클로즈업 지양)·워터마크 없음 — 전수 육안 검증.
 */
import type { ImageSourcePropType } from 'react-native';

import type { MainType } from '@/core';

const PHOTOS: Record<string, ImageSourcePropType> = {
  등산: require('../../assets/photos/category-hiking.jpg'),
  라이딩: require('../../assets/photos/category-cycling.jpg'),
  공예: require('../../assets/photos/category-pottery.jpg'),
  목공: require('../../assets/photos/category-woodwork.jpg'),
  캘리그라피: require('../../assets/photos/category-calligraphy.jpg'),
  음악: require('../../assets/photos/category-music.jpg'),
  요리: require('../../assets/photos/category-cooking.jpg'),
  사진: require('../../assets/photos/category-photography.jpg'),
  요가: require('../../assets/photos/category-yoga.jpg'),
  전시: require('../../assets/photos/category-exhibition.jpg'),
  클래식: require('../../assets/photos/category-classic.jpg'),
  텃밭: require('../../assets/photos/category-garden.jpg'),
};

/** 카테고리 사진(없는 카테고리는 null — 호출부에서 글리프 폴백) */
export function categoryPhoto(category?: string | null): ImageSourcePropType | null {
  if (!category) return null;
  return PHOTOS[category] ?? null;
}

/** 히어로 사진(로그인·온보딩·테스트 인트로) */
export const HERO_PHOTOS = {
  walk: require('../../assets/photos/hero-1.jpg') as ImageSourcePropType, // 단풍길 걷는 부부
  test: require('../../assets/photos/hero-test.jpg') as ImageSourcePropType, // 창가에서 책 고르는 중장년(사색·선택)
} as const;

/**
 * 샘플 커뮤니티 포스트 전용 컷 — 카탈로그 사진과 같은 컷이 '유저가 올린 사진'으로
 * 재등장하면 가짜 데이터 티가 난다(적대적 리뷰). 실제 DB 글은 image_url을 쓴다.
 */
const SAMPLE_POST_PHOTOS: Record<string, ImageSourcePropType> = {
  'post-1': require('../../assets/photos/community-pottery.jpg'), // 완성된 수제 컵 정물
  'post-2': require('../../assets/photos/community-hiking.jpg'), // 능선 전망(완주 인증샷)
};

export function samplePostPhoto(postId: string): ImageSourcePropType | null {
  return SAMPLE_POST_PHOTOS[postId] ?? null;
}

/** 6유형 대표 사진(결과 히어로·홈 유형 배너) — 유형 서사와 직결되는 장면 */
const TYPE_PHOTOS: Record<MainType, ImageSourcePropType> = {
  active_explorer: PHOTOS['등산'],
  warm_social: PHOTOS['요가'], // 함께 몸을 푸는 두 사람(온기·동행)
  handcraft_achiever: PHOTOS['공예'], // 물레 위의 손
  life_upgrade: PHOTOS['요리'],
  culture_enjoyer: PHOTOS['전시'],
  calm_immersion: PHOTOS['캘리그라피'], // 고요한 손끝
};

export function typePhoto(mainType: MainType): ImageSourcePropType {
  return TYPE_PHOTOS[mainType];
}
