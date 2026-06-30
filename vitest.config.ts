import { defineConfig } from 'vitest/config';

/**
 * 추천 엔진 코어(src/core)는 순수 TS라 노드 환경에서 빠르게 테스트한다.
 * RN/웹 컴포넌트는 vitest 대상에서 제외한다(여기 include로 한정).
 */
export default defineConfig({
  test: {
    include: ['src/core/**/*.test.ts'],
    environment: 'node',
  },
});
