/**
 * useBreakpoint — 반응형 레이아웃 판단의 단일 진입점.
 * 데스크탑 셸(사이드바·와이드 레이아웃)은 "웹 + 폭 1024 이상"에서만 켠다.
 * 네이티브 앱은 항상 모바일 레이아웃(하단 탭)을 유지한다.
 *
 * SSR(정적 export) 주의: 서버 HTML은 폭을 모른 채 모바일 레이아웃으로 렌더되므로,
 * 첫 클라이언트 렌더도 동일하게 compact로 맞추고(하이드레이션 불일치 방지)
 * 마운트 직후 실제 폭으로 전환한다(2-pass). 이후 마운트되는 컴포넌트는 바로 실폭 사용.
 */
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { BREAKPOINTS } from '@/tokens';

export interface Breakpoint {
  /** 현재 창 너비(px) */
  width: number;
  /** 웹 && 폭 ≥ 1024 — 사이드바 셸/와이드 레이아웃 */
  isDesktop: boolean;
  /** 웹 && 폭 ≥ 768 — 폭 완화(2컬럼 시도 등) */
  isMedium: boolean;
}

/** 최초 하이드레이션 완료 여부(모듈 레벨) — 이후 마운트는 compact 1프레임을 건너뛴다 */
let hydratedOnce = Platform.OS !== 'web';

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(hydratedOnce);

  useEffect(() => {
    if (!hydrated) {
      hydratedOnce = true;
      setHydrated(true);
    }
  }, [hydrated]);

  const web = Platform.OS === 'web' && hydrated;
  return {
    width,
    isDesktop: web && width >= BREAKPOINTS.desktop,
    isMedium: web && width >= BREAKPOINTS.medium,
  };
}
