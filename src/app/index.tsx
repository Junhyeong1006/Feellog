/**
 * 부팅 디사이더 — 세션/게스트/동의/테스트완료 상태를 보고 첫 화면으로 보낸다.
 *
 * 흐름:  splash → (로그인/게스트 아니면) 로그인 → (인트로 미열람) 온보딩
 *        → (로그인+미동의) 동의 게이트 → (로그인+테스트 전) 성향테스트 → 홈
 *        게스트는 동의/저장 없이 성향테스트로 바로 진입(결과는 로그인 후 저장 유도).
 */
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { getOnboardingSeen } from '@/state/appFlags';
import { getLocalTaste } from '@/state/tasteCache';
import { colors, spacing } from '@/tokens';
import { AppText, Logo } from '@/ui';

export default function BootDecider() {
  const { loading, session, guest, profile, profileLoading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [hasLocalTaste, setHasLocalTaste] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getOnboardingSeen(), getLocalTaste()]).then(([seen, taste]) => {
      if (!mounted) return;
      setOnboardingSeen(seen);
      setHasLocalTaste(taste != null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const booting =
    loading ||
    onboardingSeen === null ||
    hasLocalTaste === null ||
    (Boolean(session) && profileLoading);
  if (booting) return <Splash />;

  // 로그인도 게스트도 아니면 → 로그인
  if (!session && !guest) return <Redirect href="/login" />;

  // 인트로 3장(기기당 1회)
  if (!onboardingSeen) return <Redirect href="/onboarding" />;

  // 로그인 사용자: 동의 게이트 → 성향테스트 → 홈
  if (session) {
    if (!profile?.consented_at) return <Redirect href="/consent" />;
    if (!profile?.onboarded) return <Redirect href="/test" />;
    return <Redirect href="/home" />;
  }

  // 게스트: 이미 성향테스트를 했으면 홈, 아니면 테스트로
  return <Redirect href={hasLocalTaste ? '/home' : '/test'} />;
}

function Splash() {
  return (
    <View style={styles.splash}>
      <Logo size={44} withMark />
      <AppText variant="bodyLg" muted style={styles.tagline}>
        취미를 찾고, 기록하고, 나누는 공간
      </AppText>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.base,
    padding: spacing.xl,
  },
  tagline: {
    textAlign: 'center',
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
