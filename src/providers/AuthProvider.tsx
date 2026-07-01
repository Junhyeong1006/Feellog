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
import { getGuest, setGuest as persistGuest } from '@/state/appFlags';

interface AuthContextValue {
  /** 세션·게스트 초기 로딩 여부 */
  loading: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** 로그인 세션이 있는데 프로필을 아직 불러오는 중 */
  profileLoading: boolean;
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
  const [guest, setGuestState] = useState(false);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      setProfile(await fetchMyProfile());
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

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
      setGuestState(guestFlag);
      if (initialSession) await loadProfile();
      if (mounted) setLoading(false);
    })();

    const sub = sb?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
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
    await persistGuest(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      configured,
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      guest,
      isAuthedOrGuest: Boolean(session) || guest,
      enterGuest,
      refreshProfile: loadProfile,
      signOut,
    }),
    [loading, configured, session, profile, profileLoading, guest, enterGuest, loadProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
