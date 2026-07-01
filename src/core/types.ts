/** 추천 엔진 공용 타입 (순수 TS) */

export type Axis = 'rhythm' | 'relation' | 'experience' | 'participation' | 'reward';

/** 축 점수 벡터: 각 축 -100 ~ +100 */
export type AxisVector = Record<Axis, number>;

export type MainType =
  | 'active_explorer'
  | 'calm_immersion'
  | 'handcraft_achiever'
  | 'warm_social'
  | 'life_upgrade'
  | 'culture_enjoyer';

export type SubTrait = 'trend_seeker' | 'recovery_charger';

/** 문항이 기여하는 대상: 핵심 축 또는 보조 성향 축(new=trend, calm=recovery) */
export type QuestionTarget = Axis;

/** 성향테스트 문항 (이미지 2장 비교 + 5단계) */
export interface Question {
  /** 1~12 */
  id: number;
  /** 이 문항이 측정하는 핵심 축 (보조성향 전용 문항은 없음) */
  axis?: Axis;
  /**
   * 부호: 답변(-2~+2, 왼쪽=-2 ~ 오른쪽=+2)에 이 값을 곱해 축 기여도로 만든다.
   * 예) dir=-1 이면 "오른쪽 선택(+)"이 축의 음(-) 방향에 기여. (axis 있을 때만)
   */
  dir?: 1 | -1;
  /** 한 줄 질문(상단) */
  prompt: string;
  /** 왼쪽/오른쪽 카드 */
  left: QuestionSide;
  right: QuestionSide;
  /** 양끝 라벨(축 의미 한 단어) */
  leftAxisLabel: string;
  rightAxisLabel: string;
  /** 보조 성향 기여(선택). 답변 부호를 어느 성향에 얼마로 넣을지. */
  trendDir?: 1 | -1;
  recoveryDir?: 1 | -1;
  /** 이미지 자산 키(자산 교체가 쉽도록 파일명 대신 키로 참조) */
  leftImageKey?: string;
  rightImageKey?: string;
}

export interface QuestionSide {
  /** 카드 제목(키워드) */
  title: string;
  /** 1줄 설명 */
  desc: string;
}

/** 5단계 답변값 */
export type AnswerValue = -2 | -1 | 0 | 1 | 2;

/** 한 문항 답변 */
export interface Answer {
  q: number;
  value: AnswerValue;
}

/** 진단 결과 */
export interface DiagnosisResult {
  /** 5축 점수(-100~100) */
  vector: AxisVector;
  /** 보조 성향 점수(0~100) */
  trendScore: number;
  recoveryScore: number;
  /** 결정된 메인 유형 */
  mainType: MainType;
  /** 표시할 보조 성향(0~1개, 임계 미만이면 null) */
  subTrait: SubTrait | null;
}

/** 활동(클래스) — 매칭 입력 */
export interface Activity {
  id: string;
  title: string;
  vector: AxisVector; // 활동 5축 태그(-100~100)
  regionSido?: string | null;
  price?: number | null;
  durationMin?: number | null;
  intensity?: number | null; // 1~5
}

/** 추천 필터(하드 조건) */
export interface RecoFilter {
  regionSido?: string;
  maxPrice?: number;
  maxDurationMin?: number;
  maxIntensity?: number;
}

/** 매칭 결과 */
export interface MatchResult {
  activity: Activity;
  score: number; // 0~100 (높을수록 잘 맞음)
}
