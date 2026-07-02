/**
 * FontScaleProvider — 시니어 접근성: 앱 내 글씨 크기 단계(보통/크게/아주 크게).
 * AppText가 이 배율을 fontSize/lineHeight에 곱해 전 화면에 일괄 적용된다.
 * 저장: 로컬 AsyncStorage(게스트 포함) + 로그인 시 profiles.font_scale 동기화.
 * OS 글자 확대(allowFontScaling)와는 별개로 "앱 안 토글"을 제공한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { updateMyProfile } from '@/api/profiles';

const STORAGE_KEY = 'feellog.fontScale';

/** 지원 단계 — 마이 탭 설정 UI와 공유 */
export const FONT_SCALE_STEPS = [
  { value: 1, label: '보통' },
  { value: 1.15, label: '크게' },
  { value: 1.3, label: '아주 크게' },
] as const;

function sanitize(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  if (!Number.isFinite(n)) return 1;
  // 단계 외 임의 값(서버 수동 변경 등)은 가장 가까운 단계로 스냅
  let best = FONT_SCALE_STEPS[0].value as number;
  for (const s of FONT_SCALE_STEPS) {
    if (Math.abs(s.value - n) < Math.abs(best - n)) best = s.value;
  }
  return best;
}

interface FontScaleContextValue {
  /** 텍스트 배율(1 = 기본 18px 본문) */
  scale: number;
  /** 단계 변경(로컬 즉시 반영, 로그인 시 서버 동기화는 베스트 에포트) */
  setScale: (scale: number) => void;
  /** 서버 프로필 값 수신(AuthProvider 프로필 로드 시 호출) */
  adoptServerScale: (scale: number | null | undefined) => void;
}

const FontScaleContext = createContext<FontScaleContextValue | null>(null);

export function FontScaleProvider({ children }: PropsWithChildren) {
  const [scale, setScaleState] = useState(1);
  // 이 기기에서 사용자가 직접 고른 적 있는지 — 로컬 명시 선택은 서버 값이 덮지 않는다.
  // (로컬 저장값 존재 = 명시 선택. adoptServerScale은 로컬 저장을 하지 않아 이 규칙이 유지됨)
  const localExplicit = useRef(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || raw == null) return;
        localExplicit.current = true;
        setScaleState(sanitize(raw));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setScale = useCallback((next: number) => {
    const v = sanitize(next);
    localExplicit.current = true;
    setScaleState(v);
    AsyncStorage.setItem(STORAGE_KEY, String(v)).catch(() => {});
    // 비로그인/오프라인이면 조용히 스킵(로컬 값이 항상 우선 적용됨)
    updateMyProfile({ font_scale: v }).catch(() => {});
  }, []);

  const adoptServerScale = useCallback((server: number | null | undefined) => {
    if (server == null) return;
    if (localExplicit.current) return; // 이 기기에서 고른 값이 항상 우선(오프라인 변경 되돌림 방지)
    const v = sanitize(server);
    if (v === 1) return; // DB 기본값(1.0)은 "미설정"과 구분 불가 — 새 기기에만 비기본값을 이어받는다
    setScaleState(v);
  }, []);

  return (
    <FontScaleContext.Provider value={{ scale, setScale, adoptServerScale }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale(): FontScaleContextValue {
  const ctx = useContext(FontScaleContext);
  // Provider 밖(테스트 등)에서는 기본 배율로 동작
  return ctx ?? { scale: 1, setScale: () => {}, adoptServerScale: () => {} };
}
