/**
 * 피드백 온라인 보정 — 카드 좋아요/관심없어요로 사용자 현재벡터(cur)를 EMA 이동.
 * 좋아요: 활동 벡터 방향으로, 관심없어요: 반대로. base 기준선에서 ±clamp 이탈 제한.
 * (개발계획서 2.4 참조) 순수 TS.
 */
import { AXES, FEEDBACK } from './config';
import { clamp, clampAxis, zeroVector } from './scoring';
import type { AxisVector } from './types';

/**
 * @param base  테스트로 정한 기준 벡터(고정)
 * @param current 현재 벡터(이전까지 보정된)
 * @param activityVector 반응한 활동의 5축 태그
 * @param liked true=좋아요, false=관심없어요
 * @param feedbackCount 지금까지 누적 반응 수(학습률 감쇠에 사용)
 * @returns 갱신된 현재 벡터
 */
export function applyFeedback(
  base: AxisVector,
  current: AxisVector,
  activityVector: AxisVector,
  liked: boolean,
  feedbackCount: number,
): AxisVector {
  const eta = FEEDBACK.eta0 / (1 + FEEDBACK.lambda * Math.max(0, feedbackCount));
  const dir = liked ? 1 : -1;
  const drift = FEEDBACK.baseDriftClamp;
  const next = zeroVector();
  for (const axis of AXES) {
    const delta = eta * dir * (activityVector[axis] - current[axis]);
    let v = current[axis] + delta;
    v = clamp(v, base[axis] - drift, base[axis] + drift); // base에서 과이탈 방지
    // 0.1 단위 유지: 정수 반올림은 |delta|<0.5에서 EMA가 영구 정지하는 문제가 있어
    // 소수 1자리로만 양자화(저장 시 DB smallint 변환은 persistTaste에서 반올림).
    next[axis] = clampAxis(Math.round(v * 10) / 10);
  }
  return next;
}
