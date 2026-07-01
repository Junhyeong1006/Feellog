/**
 * 추천 엔진 튜닝값 (SSOT) — 이 파일만 바꾸면 로직 건드리지 않고 조정 가능.
 * 값 출처: 개발계획서 2장 + 기획 스크린샷(6유형 중심값 ×4로 -100~100 통일).
 * 향후 A/B·데이터 누적 시 여기 숫자만 교체한다.
 */
import type { Axis, AxisVector, MainType, SubTrait } from './types';

/** 5개 핵심 축 순서 (모든 벡터가 이 순서를 따른다) */
export const AXES = ['rhythm', 'relation', 'experience', 'participation', 'reward'] as const;

/**
 * 축 표시 메타 — 결과 차트/설명용. label=축 이름, posLabel=+100 극, negLabel=-100 극.
 * 부호는 scoring 규칙과 일치(positive=활동적/교류/새로움/만들기/실용·성취).
 */
export const AXIS_META: Record<Axis, { label: string; posLabel: string; negLabel: string }> = {
  rhythm: { label: '활동 리듬', posLabel: '활동적', negLabel: '차분함' },
  relation: { label: '관계 방식', posLabel: '함께', negLabel: '혼자' },
  experience: { label: '경험 선호', posLabel: '새로움', negLabel: '익숙함' },
  participation: { label: '참여 방식', posLabel: '만들기', negLabel: '감상' },
  reward: { label: '기대 보상', posLabel: '실용·성취', negLabel: '정서·회복' },
};

/** 축 가중치 (매칭·분류 거리 계산 시) — 개발계획서 2.3.3 */
export const AXIS_WEIGHTS: AxisVector = {
  rhythm: 1.2,
  relation: 1.1,
  experience: 1.0,
  participation: 0.9,
  reward: 0.8,
};

/**
 * 6 메인 유형 중심 벡터 (-100~100). 스크린샷 "활동 유형 6가지"(-25~25) ×4.
 * 컬럼 매핑: 활동리듬=rhythm, 관계방식=relation, 경험방식=experience, 만족방식=participation, 추구가치=reward.
 */
export const TYPE_CENTROIDS: Record<MainType, AxisVector> = {
  active_explorer:    { rhythm: 100, relation: 20,  experience: 20,   participation: 0,   reward: 0 },
  calm_immersion:     { rhythm: -100, relation: -60, experience: 0,    participation: -80, reward: -20 },
  handcraft_achiever: { rhythm: -20, relation: -20, experience: 100,  participation: 100, reward: 0 },
  warm_social:        { rhythm: 0,   relation: 100, experience: 20,   participation: -20, reward: -20 },
  life_upgrade:       { rhythm: 0,   relation: 0,   experience: 40,   participation: 40,  reward: 100 },
  culture_enjoyer:    { rhythm: -40, relation: 0,   experience: -100, participation: -40, reward: -100 },
};

/** 유형 한국어 라벨 + 한 줄 설명 */
export const TYPE_META: Record<MainType, { label: string; tagline: string }> = {
  active_explorer:    { label: '활력 탐험형',     tagline: '움직이며 새로운 경험을 찾아가는 것을 즐겨요' },
  calm_immersion:     { label: '고요 몰입형',     tagline: '조용히 집중하며 과정 자체를 음미하는 편이에요' },
  handcraft_achiever: { label: '손끝 성취형',     tagline: '직접 만들어 완성하고 성취감을 느끼는 것을 좋아해요' },
  warm_social:        { label: '따뜻한 교류형',   tagline: '사람들과 함께하는 시간을 소중하게 여겨요' },
  life_upgrade:       { label: '생활 업그레이드형', tagline: '배운 것을 실생활에 활용하는 실용파예요' },
  culture_enjoyer:    { label: '문화 향유형',     tagline: '공연·전시·음악을 감상하고 음미하는 것을 즐겨요' },
};

/** 보조 성향 라벨 */
export const SUB_TRAIT_META: Record<SubTrait, { label: string; tagline: string }> = {
  trend_seeker:     { label: '트렌드 발견 성향', tagline: '새롭고 감각적인 경험을 선호해요' },
  recovery_charger: { label: '회복 충전 성향',   tagline: '편안하고 몸과 마음이 회복되는 시간을 원해요' },
};

/** 보조 성향 표시 임계값 (0~100). 이 값 이상일 때만 배지로 노출(0~1개). */
export const SUB_TRAIT_THRESHOLD = 60;

/** 카드 피드백 온라인 보정 파라미터 — 개발계획서 2.4 */
export const FEEDBACK = {
  eta0: 0.2, // 초기 학습률
  lambda: 0.05, // 반응 누적에 따른 학습률 감쇠
  baseDriftClamp: 40, // cur 벡터가 base에서 이탈 가능한 최대 폭(축당)
};
