import { describe, expect, it } from 'vitest';

import { applyFeedback } from './feedback';
import { emptyVector } from './scoring';
import type { AxisVector } from './types';

const V = (partial: Partial<AxisVector> = {}): AxisVector => ({ ...emptyVector(), ...partial });

describe('applyFeedback — 정책 §4.4 계산 예시 재현', () => {
  it('좋아요: -5 + 0.10×(+1)×(15-(-5)) = -3', () => {
    const user = V({ physical: -5 });
    const act = V({ physical: 15 });
    expect(applyFeedback(user, act, 'like').physical).toBe(-3);
  });

  it('관심 없음: -5 + 0.05×(-1)×(15-(-5)) = -6', () => {
    const user = V({ physical: -5 });
    const act = V({ physical: 15 });
    expect(applyFeedback(user, act, 'not_interested').physical).toBe(-6);
  });

  it('체험 완료 만족(lr 0.15)은 좋아요보다 강하게 이동', () => {
    const user = V({ physical: 0 });
    const act = V({ physical: 20 });
    const like = applyFeedback(user, act, 'like').physical;
    const done = applyFeedback(user, act, 'complete_satisfied').physical;
    expect(done).toBeGreaterThan(like);
  });

  it('결과는 -25~+25로 clamp', () => {
    const user = V({ physical: 24 });
    const act = V({ physical: 25 });
    const next = applyFeedback(user, act, 'complete_satisfied');
    expect(next.physical).toBeLessThanOrEqual(25);
    const user2 = V({ physical: -24.9 });
    const act2 = V({ physical: -25 });
    expect(applyFeedback(user2, act2, 'strong_dislike').physical).toBeGreaterThanOrEqual(-25);
  });

  it('원본 벡터는 불변', () => {
    const user = V({ physical: -5 });
    applyFeedback(user, V({ physical: 15 }), 'like');
    expect(user.physical).toBe(-5);
  });

  it('축별 독립 계산 — 다른 축은 활동 값에 이끌리지 않음(같으면 유지)', () => {
    const user = V({ physical: -5, value: 10 });
    const act = V({ physical: 15, value: 10 });
    const next = applyFeedback(user, act, 'like');
    expect(next.value).toBe(10);
  });
});
