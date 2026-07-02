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

  it('[회귀] 분류는 균등 가중(§2.2.2) — 전축 -100은 문화 향유형(매칭 가중치를 쓰면 고요 몰입형으로 플립)', () => {
    const v: AxisVector = { rhythm: -100, relation: -100, experience: -100, participation: -100, reward: -100 };
    expect(classifyType(v)).toBe('culture_enjoyer');
  });
});

describe('pickSubTrait', () => {
  it('둘 다 임계 미만이면 null', () => expect(pickSubTrait(50, 55)).toBeNull());
  it('트렌드가 높고 임계 이상이면 trend_seeker', () => expect(pickSubTrait(80, 40)).toBe('trend_seeker'));
  it('회복이 높고 임계 이상이면 recovery_charger', () => expect(pickSubTrait(30, 75)).toBe('recovery_charger'));
  it('[회귀] 박빙(차이 < 8)이면 표시하지 않음(§2.1.3 애매성 회피)', () => {
    expect(pickSubTrait(67, 67)).toBeNull();
    expect(pickSubTrait(92, 87)).toBeNull();
    expect(pickSubTrait(68, 60)).toBe('trend_seeker'); // 차이 딱 8은 표시
  });
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
