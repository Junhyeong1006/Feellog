/**
 * 부팅 디사이더 (v6) — 세션/게스트/온보딩/동의 상태를 보고 첫 화면으로 보낸다.
 *
 * 흐름:  splash → (로그인/게스트 아니면) 로그인 → (인트로 미열람) 온보딩 3장
 *        → (로그인+미동의) 동의 게이트 → 홈(메인)
 * v6 변경: 성향 테스트는 강제 관문이 아니다 — 홈이 '나의 스타일 찾기' 상태를 보여주고
 * 사용자가 원할 때 테스트로 진입한다(디자인 334-989). 프로필 설정도 온보딩 CTA에서 선택 진입.
 */
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { getOnboardingSeen } from '@/state/appFlags';
import { colors, spacing } from '@/tokens';
import { AppText, Button } from '@/ui';
import { FeellogLogo } from '@/components/FeellogLogo';

export default function BootDecider() {
  const { loading, session, guest, profile, profileLoading, profileError, refreshProfile } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    getOnboardingSeen().then((seen) => {
      if (mounted) setOnboardingSeen(seen);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const booting = loading || onboardingSeen === null || (Boolean(session) && profileLoading);
  if (booting) return <Splash />;

  // 로그인도 게스트도 아니면 → 로그인
  if (!session && !guest) return <Redirect href="/login" />;

  // 인트로 3장(기기당 1회)
  if (!onboardingSeen) return <Redirect href="/onboarding" />;

  // 로그인 사용자: 동의 게이트 → 홈
  if (session) {
    // 프로필을 "못 불러온" 것(일시 장애)과 "없는" 것을 구분 —
    // 장애를 미동의로 착각해 기존 사용자를 동의 화면으로 돌려보내지 않는다.
    if (profileError) {
      return (
        <View style={styles.splash}>
          <AppText variant="h3" center>
            연결이 원활하지 않아요
          </AppText>
          <AppText variant="body" color={colors.textSecondary} center>
            일시적인 문제예요. 잠시 후 다시 시도해 주세요.
          </AppText>
          <Button
            label="다시 시도"
            fullWidth={false}
            style={styles.retryBtn}
            onPress={() => void refreshProfile()}
          />
        </View>
      );
    }
    if (!profile?.consented_at) return <Redirect href="/consent" />;
  }

  return <Redirect href="/home" />;
}

function Splash() {
  return (
    <View style={styles.splash}>
      <FeellogLogo width={180} />
      <AppText variant="bodyLg" color={colors.textSecondary} style={styles.tagline}>
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
  retryBtn: {
    marginTop: spacing.md,
    minWidth: 220,
  },
});
