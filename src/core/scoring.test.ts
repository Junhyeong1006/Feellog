import { describe, expect, it } from 'vitest';

import { AXES } from './config';
import { QUESTIONS } from './questions';
import { clampAxis, normalizeAxisScore, normalizeAuxScore, scoreAux, scoreAxes, zeroVector } from './scoring';
import type { Answer } from './types';

describe('clampAxis', () => {
  it('범위 안의 값은 그대로', () => expect(clampAxis(50)).toBe(50));
  it('범위 밖은 -100~100으로 자름', () => {
    expect(clampAxis(250)).toBe(100);
    expect(clampAxis(-250)).toBe(-100);
  });
});

describe('normalizeAxisScore', () => {
  it('문항 2개 모두 +2 → +100', () => expect(normalizeAxisScore(4, 2)).toBe(100));
  it('문항 3개 모두 -2 → -100', () => expect(normalizeAxisScore(-6, 3)).toBe(-100));
  it('중립(합 0) → 0', () => expect(normalizeAxisScore(0, 2)).toBe(0));
  it('문항 수 0 → 0(0나누기 방지)', () => expect(normalizeAxisScore(4, 0)).toBe(0));
});

describe('normalizeAuxScore', () => {
  it('전부 최대(+2×3) → 100', () => expect(normalizeAuxScore(6, 3)).toBe(100));
  it('전부 최소(-2×3) → 0', () => expect(normalizeAuxScore(-6, 3)).toBe(0));
  it('중립 → 50', () => expect(normalizeAuxScore(0, 3)).toBe(50));
});

describe('zeroVector', () => {
  it('5개 축 모두 0', () => {
    const v = zeroVector();
    expect(Object.keys(v).sort()).toEqual([...AXES].sort());
    expect(Object.values(v).every((n) => n === 0)).toBe(true);
  });
});

describe('scoreAxes', () => {
  const all = (value: -2 | -1 | 0 | 1 | 2): Answer[] => QUESTIONS.map((q) => ({ q: q.id, value }));

  it('모두 왼쪽(-2)이면 모든 축이 +100(left=positive, dir=-1)', () => {
    const v = scoreAxes(all(-2));
    expect(v.rhythm).toBe(100);
    expect(v.relation).toBe(100);
    expect(v.experience).toBe(100);
    expect(v.participation).toBe(100);
    expect(v.reward).toBe(100);
  });

  it('모두 오른쪽(+2)이면 모든 축이 -100', () => {
    const v = scoreAxes(all(2));
    expect(Object.values(v).every((n) => n === -100)).toBe(true);
  });

  it('무응답(빈 배열)은 중립 0 벡터', () => {
    expect(scoreAxes([])).toEqual(zeroVector());
  });
});

describe('scoreAux', () => {
  it('Q1/Q6/Q11 왼쪽 → 트렌드 높음, Q5/Q9/Q11 오른쪽 → 회복 높음(상충 시 각각 계산)', () => {
    // 왼쪽(-2)이면 trendDir=-1 → +기여(트렌드↑), recoveryDir=1 → -기여(회복↓)
    const left = scoreAux([
      { q: 1, value: -2 },
      { q: 6, value: -2 },
      { q: 11, value: -2 },
    ]);
    expect(left.trendScore).toBeGreaterThan(80);
    const right = scoreAux([
      { q: 5, value: 2 },
      { q: 9, value: 2 },
      { q: 11, value: 2 },
    ]);
    expect(right.recoveryScore).toBeGreaterThan(80);
  });
});
