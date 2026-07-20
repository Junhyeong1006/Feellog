/**
 * Feellog 코어 타입 (엔진 v2 — 기획 시드 SSOT).
 * 근거: docs/planning/personality_questions_seed_ko.csv (7축 12문항),
 *       activity_type_profiles_ko.csv (6유형 기준벡터),
 *       activity_card_scoring_policy_ko.md (점수 체계 -25~+25, 학습률 피드백).
 * RN/DOM 비의존 순수 타입 — Vitest로 검증한다.
 */

/**
 * 성향 7축. 모든 축은 -25 ~ +25 (5점 단위 권장, 피드백 갱신은 소수 허용).
 * 음수 방향 ↔ 양수 방향:
 *  physical      신체 활동   차분 ↔ 활기
 *  relation      관계 방식   혼자 ↔ 함께
 *  experience    경험 방식   감상 ↔ 직접
 *  satisfaction  만족 방식   과정 ↔ 완성
 *  value         가치 지향   감성 ↔ 실생활
 *  novelty       새로움     익숙 ↔ 새로움
 *  depth         참여 깊이   가볍게 ↔ 꾸준히 깊게
 */
export type Axis =
  | 'physical'
  | 'relation'
  | 'experience'
  | 'satisfaction'
  | 'value'
  | 'novelty'
  | 'depth';

export const AXES: readonly Axis[] = [
  'physical',
  'relation',
  'experience',
  'satisfaction',
  'value',
  'novelty',
  'depth',
] as const;

/** 축 점수 하한/상한 (기획 정책 §1) */
export const AXIS_MIN = -25;
export const AXIS_MAX = 25;

export type AxisVector = Record<Axis, number>;

/** 6유형 ID (activity_type_profiles_ko.csv) */
export type MainType = 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06';

/**
 * 문항 응답값 — UI는 2지선다(A=-25, B=+25).
 * 시드에는 약한 선택(±12.5)·중립(0)도 정의되어 있어 엔진은 5단계를 모두 허용한다.
 */
export type AnswerValue = -25 | -12.5 | 0 | 12.5 | 25;

export interface Question {
  /** 문항_ID (Q001~Q012) */
  id: string;
  /** 순서 1~12 */
  order: number;
  /** 측정 축 */
  axis: Axis;
  /** 화면 질문 */
  prompt: string;
  /** 선택지 A(음수 방향) */
  choiceA: string;
  /** 선택지 B(양수 방향) */
  choiceB: string;
  /** 가중치(시드 전부 1) */
  weight: number;
}

export interface Answer {
  /** Question.id */
  q: string;
  value: AnswerValue;
}

/** 유형 메타(라벨·설명·추천 카테고리·기준 벡터) */
export interface TypeProfile {
  id: MainType;
  label: string;
  description: string;
  /** 유형 기준 벡터(7축) */
  vector: AxisVector;
  /** 추천_카테고리(원본 카테고리명) */
  categories: string[];
}

/** 활동 카드(activity_cards_seed_ko.csv 1행) */
export interface Activity {
  /** 활동_ID (A001~A070) */
  id: string;
  /** 활동명 */
  name: string;
  /** 카드_제목 */
  title: string;
  /** 카드_설명 */
  summary: string;
  /** 유형_라벨(시드 표기 그대로) */
  typeLabel: string;
  /** 원본_카테고리 (요리/수공예/미술/플라워/뷰티/액티비티/음악/라이프스타일/정규) */
  category: string;
  /** 7축 성향 점수 */
  vector: AxisVector;
  /** 신체 부담 1~5 (성향 축과 분리 — 필터용) */
  physicalBurden: number;
}

export interface DiagnosisResult {
  /** 축별 원점수(-25~+25) */
  vector: AxisVector;
  /** 기준 벡터 최근접 유형 */
  mainType: MainType;
  /** 유형별 거리(작을수록 근접 — 디버그/보조 표시용) */
  distances: Record<MainType, number>;
}

/**
 * 사용자 선호 상태(정책 §4.5) — initial과 current를 분리 저장.
 */
export interface PreferenceState {
  /** 최초 테스트 결과(고정) */
  initial: AxisVector;
  /** 피드백 반영 후 현재 값 */
  current: AxisVector;
  /** 피드백 누적 횟수 */
  feedbackCount: number;
}

/** 피드백 행동 유형(정책 §4.3) */
export type FeedbackAction =
  | 'view_detail' // 상세 보기 (+1, lr 0.02)
  | 'like' // 저장·좋아요 (+1, lr 0.10)
  | 'complete_satisfied' // 체험 완료 후 만족 (+1, lr 0.15)
  | 'not_interested' // 관심 없음 (-1, lr 0.05)
  | 'strong_dislike'; // 명시적 매우 싫어요 (-1, lr 0.10)
