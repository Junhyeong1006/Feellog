import { describe, expect, it } from 'vitest';

import { AXES, clampAxis, normalizeAxisScore, zeroVector } from './scoring';

describe('clampAxis', () => {
  it('범위 안의 값은 그대로 둔다', () => {
    expect(clampAxis(50)).toBe(50);
  });
  it('범위를 벗어난 값은 -100~100으로 자른다', () => {
    expect(clampAxis(250)).toBe(100);
    expect(clampAxis(-250)).toBe(-100);
  });
});

describe('normalizeAxisScore', () => {
  it('문항 2개가 모두 +2면 +100으로 정규화된다', () => {
    expect(normalizeAxisScore(4, 2)).toBe(100);
  });
  it('문항 3개가 모두 -2면 -100으로 정규화된다', () => {
    expect(normalizeAxisScore(-6, 3)).toBe(-100);
  });
  it('중립(합 0)은 0이다', () => {
    expect(normalizeAxisScore(0, 2)).toBe(0);
  });
  it('문항 수가 0이면 0을 반환한다(0으로 나누기 방지)', () => {
    expect(normalizeAxisScore(4, 0)).toBe(0);
  });
});

describe('zeroVector', () => {
  it('5개 축을 모두 0으로 가진다', () => {
    const v = zeroVector();
    expect(Object.keys(v).sort()).toEqual([...AXES].sort());
    expect(Object.values(v).every((n) => n === 0)).toBe(true);
  });
});
