import { describe, expect, it } from 'vitest';

import { matchScore, passesFilter, recommend } from './matching';
import type { Activity, AxisVector } from './types';

const vec = (r: number, rel: number, e: number, p: number, rw: number): AxisVector => ({
  rhythm: r, relation: rel, experience: e, participation: p, reward: rw,
});

const trekking: Activity = { id: 'trek', title: '트레킹', vector: vec(80, 20, 70, 20, 10), regionSido: '서울', price: 20000, durationMin: 120, intensity: 4 };
const pottery: Activity = { id: 'pot', title: '도자기', vector: vec(-60, -40, -20, 80, -20), regionSido: '경기', price: 40000, durationMin: 90, intensity: 2 };

describe('matchScore', () => {
  it('완전히 같은 벡터는 100', () => {
    expect(matchScore(trekking.vector, trekking.vector)).toBe(100);
  });
  it('가까운 벡터가 먼 벡터보다 높은 점수', () => {
    const user = vec(80, 20, 70, 20, 10); // 트레킹과 동일
    expect(matchScore(user, trekking.vector)).toBeGreaterThan(matchScore(user, pottery.vector));
  });
});

describe('passesFilter', () => {
  it('지역 불일치는 탈락', () => {
    expect(passesFilter(trekking, { regionSido: '경기' })).toBe(false);
    expect(passesFilter(trekking, { regionSido: '서울' })).toBe(true);
  });
  it('예산 초과는 탈락', () => {
    expect(passesFilter(pottery, { maxPrice: 30000 })).toBe(false);
  });
  it('강도 초과는 탈락', () => {
    expect(passesFilter(trekking, { maxIntensity: 3 })).toBe(false);
  });
});

describe('passesFilter — null 엄격성', () => {
  const base = { id: 'a', title: '테스트 활동', vector: { rhythm: 0, relation: 0, experience: 0, participation: 0, reward: 0 } };
  it("[회귀] 가격 미입력 활동은 '무료만'(maxPrice 0) 필터에서 제외", () => {
    expect(passesFilter({ ...base, price: null }, { maxPrice: 0 })).toBe(false);
    expect(passesFilter({ ...base, price: 0 }, { maxPrice: 0 })).toBe(true);
  });
  it('[회귀] 지역 미입력 활동은 지역 필터에서 제외', () => {
    expect(passesFilter({ ...base, regionSido: null }, { regionSido: '서울' })).toBe(false);
  });
  it('필터가 없으면 null 값도 통과', () => {
    expect(passesFilter({ ...base, price: null })).toBe(true);
  });
});

describe('recommend', () => {
  it('점수 내림차순 정렬 + limit', () => {
    const user = vec(80, 20, 70, 20, 10);
    const res = recommend(user, [pottery, trekking], { limit: 1 });
    expect(res).toHaveLength(1);
    expect(res[0].activity.id).toBe('trek');
  });
  it('필터가 후보를 걸러냄', () => {
    const user = vec(0, 0, 0, 0, 0);
    const res = recommend(user, [pottery, trekking], { filter: { regionSido: '경기' } });
    expect(res.map((r) => r.activity.id)).toEqual(['pot']);
  });
});
