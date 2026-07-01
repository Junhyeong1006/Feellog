/**
 * 약관/개인정보 문서 버전 + 동의 항목 정의 (SSOT).
 * 문서를 개정하면 버전 문자열만 올리면 된다(user_consents.doc_version에 기록되어 이력 추적).
 */
export const LEGAL_DOC_VERSIONS = {
  terms: 'terms-2026-07-01',
  privacy: 'privacy-2026-07-01',
  marketing: 'marketing-2026-07-01',
} as const;

export type ConsentKind =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'marketing'
  | 'third_party_provision'
  | 'overseas_transfer';

export interface ConsentItemDef {
  kind: ConsentKind;
  /** 체크박스 라벨 */
  title: string;
  /** 필수 여부(필수는 미동의 시 진행 불가) */
  required: boolean;
  /** 기록할 문서 버전 */
  docVersion: string;
  /** 전문 보기 링크(라우트) */
  href?: string;
}

/** 가입 게이트에서 노출하는 동의 항목(순서 = 표시 순서) */
export const CONSENT_ITEMS: ConsentItemDef[] = [
  {
    kind: 'terms_of_service',
    title: '이용약관 동의',
    required: true,
    docVersion: LEGAL_DOC_VERSIONS.terms,
    href: '/legal/terms',
  },
  {
    kind: 'privacy_policy',
    title: '개인정보 수집·이용 동의',
    required: true,
    docVersion: LEGAL_DOC_VERSIONS.privacy,
    href: '/legal/privacy',
  },
  {
    kind: 'marketing',
    title: '마케팅 정보 수신 동의 (선택)',
    required: false,
    docVersion: LEGAL_DOC_VERSIONS.marketing,
  },
];
