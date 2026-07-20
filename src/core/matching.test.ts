import { describe, expect, it } from 'vitest';

import { ACTIVITY_SEED } from '../data/activitySeed';
import { matchScore, passesFilter, rankActivities } from './matching';
import { emptyVector } from './scoring';
import type { AxisVector } from './types';

const V = (partial: Partial<AxisVector> = {}): AxisVector => ({ ...emptyVector(), ...partial });

describe('activity seed 무결성', () => {
  it('70종, 7축 점수 전부 -25~+25', () => {
    expect(ACTIVITY_SEED).toHaveLength(70);
    for (const a of ACTIVITY_SEED) {
      for (const v of Object.values(a.vector)) {
        expect(v).toBeGreaterThanOrEqual(-25);
        expect(v).toBeLessThanOrEqual(25);
      }
      expect(a.physicalBurden).toBeGreaterThanOrEqual(1);
      expect(a.physicalBurden).toBeLessThanOrEqual(5);
    }
  });
});

describe('matchScore', () => {
  it('동일 벡터 = 100', () => {
    const v = V({ physical: 10, value: -15 });
    expect(matchScore(v, v)).toBe(100);
  });

  it('완전 반대(-25 vs +25, 전 축) = 0', () => {
    const a = V({ physical: -25, relation: -25, experience: -25, satisfaction: -25, value: -25, novelty: -25, depth: -25 });
    const b = V({ physical: 25, relation: 25, experience: 25, satisfaction: 25, value: 25, novelty: 25, depth: 25 });
    expect(matchScore(a, b)).toBe(0);
  });

  it('한 축만 최대 차이(50)면 100 - 100×50/350 ≈ 86', () => {
    const a = V({ physical: -25 });
    const b = V({ physical: 25 });
    expect(matchScore(a, b)).toBe(Math.round(100 * (1 - 50 / 350)));
  });
});

describe('rankActivities', () => {
  it('점수 내림차순, 동점은 id 오름차순(결정적)', () => {
    const ranked = rankActivities(emptyVector(), ACTIVITY_SEED);
    for (let i = 1; i < ranked.length; i++) {
      const prev = ranked[i - 1];
      const cur = ranked[i];
      expect(prev.score >= cur.score).toBe(true);
      if (prev.score === cur.score) {
        expect(prev.activity.id < cur.activity.id).toBe(true);
      }
    }
  });

  it('카테고리 필터가 적용된다', () => {
    const ranked = rankActivities(emptyVector(), ACTIVITY_SEED, { categories: ['요리'] });
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((r) => r.activity.category === '요리')).toBe(true);
  });

  it('신체 부담 상한 필터', () => {
    const soft = rankActivities(emptyVector(), ACTIVITY_SEED, { maxPhysicalBurden: 2 });
    expect(soft.every((r) => r.activity.physicalBurden <= 2)).toBe(true);
  });

  it('passesFilter: 빈 필터는 전체 통과', () => {
    expect(passesFilter(ACTIVITY_SEED[0], null)).toBe(true);
    expect(passesFilter(ACTIVITY_SEED[0], { categories: [] })).toBe(true);
  });
});
