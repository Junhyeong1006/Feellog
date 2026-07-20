/**
 * 선호 피드백 갱신 (엔진 v2, 정책 §4).
 * 새 점수 = clamp(기존 + 학습률 × 방향 × (활동 점수 - 기존), -25, +25) — 축별 독립.
 * 카드 점수는 고정, 사용자 current만 이동. initial은 별도 보존(호출부 책임).
 */
import { FEEDBACK_RULES } from './config';
import { clampAxis } from './scoring';
import { AXES, type AxisVector, type FeedbackAction } from './types';

/** 한 번의 행동으로 사용자 현재 벡터를 갱신한 새 벡터를 반환(원본 불변). */
export function applyFeedback(
  current: AxisVector,
  activity: AxisVector,
  action: FeedbackAction,
): AxisVector {
  const rule = FEEDBACK_RULES[action];
  const next = { ...current };
  for (const axis of AXES) {
    const delta = rule.learningRate * rule.direction * (activity[axis] - current[axis]);
    // 0.1 단위로 반올림(부동소수 누적 오차 방지, 표시 안정)
    next[axis] = clampAxis(Math.round((current[axis] + delta) * 10) / 10);
  }
  return next;
}
