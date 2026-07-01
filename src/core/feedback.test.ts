import { describe, expect, it } from 'vitest';

import { applyFeedback } from './feedback';
import type { AxisVector } from './types';

const vec = (r: number, rel: number, e: number, p: number, rw: number): AxisVector => ({
  rhythm: r, relation: rel, experience: e, participation: p, reward: rw,
});

describe('applyFeedback', () => {
  const base = vec(0, 0, 0, 0, 0);
  const activity = vec(100, 100, 100, 100, 100);

  it('좋아요는 현재벡터를 활동 방향으로 이동', () => {
    const next = applyFeedback(base, base, activity, true, 0);
    expect(next.rhythm).toBeGreaterThan(0);
    expect(next.rhythm).toBeLessThan(100);
  });

  it('관심없어요는 활동 반대 방향으로 이동', () => {
    const next = applyFeedback(base, base, activity, false, 0);
    expect(next.rhythm).toBeLessThan(0);
  });

  it('base 기준선에서 과이탈하지 않음(±clamp)', () => {
    let cur = base;
    for (let i = 0; i < 100; i++) cur = applyFeedback(base, cur, activity, true, i);
    // baseDriftClamp=40 이므로 base(0)+40을 넘지 않음
    expect(cur.rhythm).toBeLessThanOrEqual(40);
  });

  it('반응이 쌓일수록 학습률 감쇠(초기 이동폭 > 후기 이동폭)', () => {
    const early = applyFeedback(base, base, activity, true, 0).rhythm;
    const lateStart = vec(0, 0, 0, 0, 0);
    const late = applyFeedback(base, lateStart, activity, true, 50).rhythm;
    expect(early).toBeGreaterThan(late);
  });
});
