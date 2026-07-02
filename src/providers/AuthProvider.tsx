/**
 * AuthProvider — 세션 + 내 프로필 + 게스트('둘러보기') 상태를 앱 전역에 제공.
 * 부팅 디사이더(app/index)와 화면들이 useAuth()로 로그인/동의/테스트완료 상태를 읽는다.
 *
 * 세션은 onAuthStateChange로 실시간 반영되고, 로그인되면 profiles를 한 번 로드한다.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { signOut as apiSignOut } from '@/api/auth';
import { fetchMyProfile, type Profile } from '@/api/profiles';
import { getSupabase, isSupabaseConfigured } from '@/api/supabase';
import { identify } from '@/lib/analytics';
import { useFontScale } from '@/providers/FontScaleProvider';
import { getGuest, setGuest as persistGuest } from '@/state/appFlags';
import { setRecoFilter, EMPTY_FILTER } from '@/state/recoFilter';
import { clearLocalTaste } from '@/state/tasteCache';
import { clearTestProgress } from '@/state/testProgress';

interface AuthContextValue {
  /** 세션·게스트 초기 로딩 여부 */
  loading: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** 로그인 세션이 있는데 프로필을 아직 불러오는 중 */
  profileLoading: boolean;
  /** 프로필 로드가 "실패"(네트워크 등) — 없음(null)과 구분해 오리다이렉트 방지 */
  profileError: boolean;
  /** '둘러보기'(비로그인) 진입 상태 */
  guest: boolean;
  /** 로그인 or 게스트로 앱을 쓸 수 있는 상태인지 */
  isAuthedOrGuest: boolean;
  enterGuest: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [guest, setGuestState] = useState(false);
  const { adoptServerScale } = useFontScale();

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const next = await fetchMyProfile();
      setProfile(next);
      setProfileError(false);
      // 다른 기기에서 설정한 글씨 크기를 이어받는다(기본값 1은 로컬 설정 유지)
      adoptServerScale(next?.font_scale);
    } catch {
      // 일시 장애를 '프로필 없음'으로 착각하면 기존 사용자가 동의/테스트로 오리다이렉트된다
      setProfile(null);
      setProfileError(true);
    } finally {
      setProfileLoading(false);
    }
  }, [adoptServerScale]);

  // 최초: 세션 + 게스트 플래그 로드
  useEffect(() => {
    let mounted = true;
    const sb = getSupabase();

    (async () => {
      const [initialSession, guestFlag] = await Promise.all([
        sb ? sb.auth.getSession().then((r) => r.data.session) : Promise.resolve(null),
        getGuest(),
      ]);
      if (!mounted) return;
      setSession(initialSession);
      identify(initialSession?.user.id ?? null);
      setGuestState(guestFlag);
      if (initialSession) await loadProfile();
      if (mounted) setLoading(false);
    })();

    const sub = sb?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      identify(nextSession?.user.id ?? null);
      if (nextSession) {
        // 로그인되면 게스트 상태 해제 + 프로필 로드
        setGuestState(false);
        void persistGuest(false);
        void loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub?.data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const enterGuest = useCallback(async () => {
    setGuestState(true);
    await persistGuest(true);
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setSession(null);
    setProfile(null);
    setGuestState(false);
    // 공용 기기 대비: 이전 사용자의 취향/테스트 진행/필터가 다음 사용자에게 노출되지 않게 정리
    await Promise.all([
      persistGuest(false),
      clearLocalTaste(),
      clearTestProgress(),
      setRecoFilter(EMPTY_FILTER),
    ]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      configured,
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      profileError,
      guest,
      isAuthedOrGuest: Boolean(session) || guest,
      enterGuest,
      refreshProfile: loadProfile,
      signOut,
    }),
    [
      loading,
      configured,
      session,
      profile,
      profileLoading,
      profileError,
      guest,
      enterGuest,
      loadProfile,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
