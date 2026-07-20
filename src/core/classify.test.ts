import { describe, expect, it } from 'vitest';

import { classifyType, diagnose, vectorDistance } from './classify';
import { TYPE_ORDER, TYPE_PROFILES } from './config';
import { QUESTIONS } from './questions';
import type { Answer } from './types';

describe('classifyType', () => {
  it('각 유형의 기준 벡터는 자기 자신으로 분류된다', () => {
    for (const t of TYPE_ORDER) {
      expect(classifyType(TYPE_PROFILES[t].vector).mainType).toBe(t);
    }
  });

  it('거리 맵은 6유형 전부 포함하고 자기 거리 0', () => {
    const { distances } = classifyType(TYPE_PROFILES.T03.vector);
    expect(Object.keys(distances)).toHaveLength(6);
    expect(distances.T03).toBe(0);
  });

  it('동일 거리 동점이면 TYPE_ORDER 앞선 유형', () => {
    // 두 유형 기준 벡터의 정확한 중점 → 두 거리 동일 → 앞선 유형 선택
    const a = TYPE_PROFILES.T01.vector;
    const b = TYPE_PROFILES.T02.vector;
    const mid = Object.fromEntries(
      Object.keys(a).map((k) => [k, (a[k as keyof typeof a] + b[k as keyof typeof b]) / 2]),
    ) as typeof a;
    const da = vectorDistance(mid, a);
    const db = vectorDistance(mid, b);
    expect(da).toBeCloseTo(db, 10);
    const others = TYPE_ORDER.filter((t) => t !== 'T01' && t !== 'T02');
    const midIsNearestPair = others.every((t) => vectorDistance(mid, TYPE_PROFILES[t].vector) >= da);
    if (midIsNearestPair) {
      expect(classifyType(mid).mainType).toBe('T01');
    }
  });
});

describe('diagnose', () => {
  it('활동적(B) 응답 위주는 T01(활기찬 에너지형) 쪽으로 분류된다', () => {
    // 신체활동·관계는 강한 B, 나머지 중립 → T01 벡터(25,10,...)에 가장 근접해야 자연스러움
    const answers: Answer[] = QUESTIONS.map((q) => ({
      q: q.id,
      value: q.axis === 'physical' || q.axis === 'relation' ? 25 : 0,
    }));
    const r = diagnose(answers);
    expect(r.mainType).toBe('T01');
    expect(r.vector.physical).toBe(25);
    expect(r.vector.relation).toBe(25);
  });

  it('감상·과정·감성(A) 위주는 T02 또는 T06 계열로 분류된다', () => {
    const answers: Answer[] = QUESTIONS.map((q) => ({
      q: q.id,
      value: q.axis === 'novelty' || q.axis === 'depth' ? 0 : -25,
    }));
    const r = diagnose(answers);
    expect(['T02', 'T06']).toContain(r.mainType);
  });
});
