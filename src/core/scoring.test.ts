import { describe, expect, it } from 'vitest';

import { QUESTIONS } from './questions';
import { emptyVector, scoreAnswers } from './scoring';
import { AXES, type Answer } from './types';

describe('시드 무결성', () => {
  it('12문항, 순서 1~12, 가중치 1', () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(QUESTIONS.map((q) => q.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(QUESTIONS.every((q) => q.weight === 1)).toBe(true);
  });

  it('축 분포: 5축×2문항 + novelty·depth×1문항', () => {
    const count = emptyVector();
    for (const q of QUESTIONS) count[q.axis] += 1;
    expect(count).toEqual({
      physical: 2, relation: 2, experience: 2, satisfaction: 2, value: 2, novelty: 1, depth: 1,
    });
  });
});

describe('scoreAnswers', () => {
  it('전부 B 강한 선택(+25) → 모든 축 +25', () => {
    const answers: Answer[] = QUESTIONS.map((q) => ({ q: q.id, value: 25 }));
    const v = scoreAnswers(answers);
    for (const axis of AXES) expect(v[axis]).toBe(25);
  });

  it('전부 A 강한 선택(-25) → 모든 축 -25', () => {
    const answers: Answer[] = QUESTIONS.map((q) => ({ q: q.id, value: -25 }));
    const v = scoreAnswers(answers);
    for (const axis of AXES) expect(v[axis]).toBe(-25);
  });

  it('2문항 축에서 +25와 -25가 상쇄되어 0', () => {
    const phys = QUESTIONS.filter((q) => q.axis === 'physical');
    const answers: Answer[] = [
      { q: phys[0].id, value: 25 },
      { q: phys[1].id, value: -25 },
    ];
    expect(scoreAnswers(answers).physical).toBe(0);
  });

  it('미응답은 중립(0)으로 평균에 포함', () => {
    const phys = QUESTIONS.filter((q) => q.axis === 'physical');
    const answers: Answer[] = [{ q: phys[0].id, value: 25 }]; // 나머지 1문항 미응답
    expect(scoreAnswers(answers).physical).toBe(12.5);
  });

  it('약한 선택(±12.5)도 정확히 반영', () => {
    const val = QUESTIONS.filter((q) => q.axis === 'value');
    const answers: Answer[] = [
      { q: val[0].id, value: 12.5 },
      { q: val[1].id, value: 12.5 },
    ];
    expect(scoreAnswers(answers).value).toBe(12.5);
  });
});
