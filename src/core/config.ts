/**
 * 6유형 기준 벡터·메타 — docs/planning/activity_type_profiles_ko.csv에서 생성(수정은 CSV에서).
 * 유형 판정 = 사용자/활동 7축 벡터와 기준 벡터의 최근접(classify.ts).
 */
import type { AxisVector, MainType, TypeProfile } from './types';

export interface TypeMeta extends TypeProfile {
  /** 결과 화면 별칭(짧은 부제) */
  subtitle: string;
}

export const TYPE_PROFILES: Record<MainType, TypeMeta> = {
  T01: {
    id: 'T01',
    label: '활기찬 에너지형',
    subtitle: '액티비티형',
    description: '몸을 움직이고 생동감 있는 활동을 즐기는 유형',
    vector: { physical: 25, relation: 10, experience: 15, satisfaction: 0, value: 0, novelty: 5, depth: 0 },
    categories: ['액티비티', '음악', '라이프스타일'],
  },
  T02: {
    id: 'T02',
    label: '차분한 힐링형',
    subtitle: '힐링형',
    description: '조용한 회복과 부담 없는 활동을 선호하는 유형',
    vector: { physical: -25, relation: -5, experience: 0, satisfaction: -20, value: -10, novelty: 0, depth: 5 },
    categories: ['플라워', '미술', '라이프스타일', '요리'],
  },
  T03: {
    id: 'T03',
    label: '만능 손재주형',
    subtitle: '공예형',
    description: '직접 만들고 완성물을 얻을 때 만족하는 유형',
    vector: { physical: -5, relation: 0, experience: 25, satisfaction: 25, value: 5, novelty: 0, depth: 5 },
    categories: ['수공예', '요리', '플라워', '뷰티'],
  },
  T04: {
    id: 'T04',
    label: '함께하는 동행형',
    subtitle: '소셜형',
    description: '다른 사람과 함께할 때 활동을 더 즐기는 유형',
    vector: { physical: 0, relation: 25, experience: 5, satisfaction: -5, value: -5, novelty: 0, depth: -5 },
    categories: ['액티비티', '요리', '음악', '라이프스타일'],
  },
  T05: {
    id: 'T05',
    label: '배움의 즐거움형',
    subtitle: '배움형',
    description: '꾸준히 배우고 실생활에 활용할 수 있는 기술을 즐기는 유형',
    vector: { physical: 0, relation: 0, experience: 10, satisfaction: 10, value: 20, novelty: 0, depth: 25 },
    categories: ['정규', '음악', '라이프스타일', '요리'],
  },
  T06: {
    id: 'T06',
    label: '감성 충만형',
    subtitle: '감성형',
    description: '취향과 분위기와 아름다움과 감성적 자극을 추구하는 유형',
    vector: { physical: -10, relation: 0, experience: -10, satisfaction: -10, value: -25, novelty: 5, depth: 0 },
    categories: ['미술', '플라워', '뷰티', '음악', '라이프스타일'],
  },
};

/** 동점(동일 거리) 시 우선순위 — 시드 정의 순서 고정 */
export const TYPE_ORDER: readonly MainType[] = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06'] as const;

/** 축 라벨(차트·설명용) — 음수 방향 ↔ 양수 방향 */
export const AXIS_META: Record<keyof AxisVector, { label: string; negative: string; positive: string }> = {
  physical: { label: '신체 활동', negative: '차분', positive: '활기' },
  relation: { label: '관계 방식', negative: '혼자', positive: '함께' },
  experience: { label: '경험 방식', negative: '감상', positive: '직접' },
  satisfaction: { label: '만족 방식', negative: '과정', positive: '완성' },
  value: { label: '가치 지향', negative: '감성', positive: '실생활' },
  novelty: { label: '새로움', negative: '익숙', positive: '새로움' },
  depth: { label: '참여 깊이', negative: '가볍게', positive: '깊게' },
};

/** 피드백 학습률(정책 §4.3) */
export const FEEDBACK_RULES = {
  view_detail: { direction: 1, learningRate: 0.02 },
  like: { direction: 1, learningRate: 0.1 },
  complete_satisfied: { direction: 1, learningRate: 0.15 },
  not_interested: { direction: -1, learningRate: 0.05 },
  strong_dislike: { direction: -1, learningRate: 0.1 },
} as const;
