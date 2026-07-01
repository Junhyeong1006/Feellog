/** 로그인 취소(사용자가 창을 닫음). auth.ts / kakaoAuth.ts 공용(순환참조 방지용 분리). */
export class AuthCancelledError extends Error {
  constructor() {
    super('로그인이 취소되었습니다.');
    this.name = 'AuthCancelledError';
  }
}
