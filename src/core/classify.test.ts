import { describe, expect, it } from 'vitest';

import { TYPE_CENTROIDS } from './config';
import { classifyType, diagnose, pickSubTrait, weightedDistance } from './classify';
import { QUESTIONS } from './questions';
import type { AxisVector, MainType } from './types';

describe('weightedDistance', () => {
  it('같은 벡터는 거리 0', () => {
    const v: AxisVector = { rhythm: 10, relation: 20, experience: 30, participation: 40, reward: 50 };
    expect(weightedDistance(v, v)).toBe(0);
  });
});

describe('classifyType', () => {
  it('각 유형의 중심 벡터는 자기 자신으로 분류된다', () => {
    for (const type of Object.keys(TYPE_CENTROIDS) as MainType[]) {
      expect(classifyType(TYPE_CENTROIDS[type])).toBe(type);
    }
  });

  it('활동적·새로움 강한 벡터는 활력 탐험형', () => {
    const v: AxisVector = { rhythm: 90, relation: 20, experience: 40, participation: 0, reward: 0 };
    expect(classifyType(v)).toBe('active_explorer');
  });
});

describe('pickSubTrait', () => {
  it('둘 다 임계 미만이면 null', () => expect(pickSubTrait(50, 55)).toBeNull());
  it('트렌드가 높고 임계 이상이면 trend_seeker', () => expect(pickSubTrait(80, 40)).toBe('trend_seeker'));
  it('회복이 높고 임계 이상이면 recovery_charger', () => expect(pickSubTrait(30, 75)).toBe('recovery_charger'));
});

describe('diagnose', () => {
  it('전체 답변으로 유형·보조성향·벡터를 반환', () => {
    const answers = QUESTIONS.map((q) => ({ q: q.id, value: -2 as const }));
    const r = diagnose(answers);
    expect(r.mainType).toBeTruthy();
    expect(r.vector.rhythm).toBe(100);
    expect(typeof r.trendScore).toBe('number');
  });
});
