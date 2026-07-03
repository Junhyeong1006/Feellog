/**
 * 로그인 — 소셜 전용. 노출 provider는 config(ENABLED_PROVIDERS)로 토글.
 * (현재 구글·애플; 카카오는 비즈앱/OIDC 이슈 해결 후 config에 다시 추가)
 * '둘러보기'로 비로그인 체험도 가능(결과 저장은 로그인 후).
 * 하단 문구로 약관/개인정보 동의를 고지하고 전문 링크를 제공.
 * 데스크탑: [브랜드 패널 | 로그인 카드] 스플릿 레이아웃.
 */
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthCancelledError, signInWithProvider, type OAuthProvider } from '@/api/auth';
import { ENABLED_PROVIDERS } from '@/config/auth';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, palette, radius, spacing } from '@/tokens';
import { AppText, Button, Logo, Screen, type ButtonVariant } from '@/ui';

type Pending = OAuthProvider | 'guest' | null;

const PROVIDER_BUTTON: Record<OAuthProvider, { label: string; variant: ButtonVariant }> = {
  kakao: { label: '카카오로 시작하기', variant: 'kakao' },
  google: { label: '구글로 시작하기', variant: 'google' },
  apple: { label: 'Apple로 시작하기', variant: 'apple' },
};

const FEATURES = [
  { icon: 'compass-outline', tint: palette.blueTint, ink: colors.primaryInk, text: '12개의 장면으로 알아보는 나의 여가 성향' },
  { icon: 'sparkles-outline', tint: palette.mint, ink: colors.mintInk, text: '취향에 꼭 맞는 활동을 한 장씩 추천' },
  { icon: 'chatbubbles-outline', tint: palette.coralTint, ink: colors.coralInk, text: '같은 취향 이웃들과 나누는 취미 이야기' },
] as const;

export default function LoginScreen() {
  const { enterGuest, configured } = useAuth();
  const { isDesktop } = useBreakpoint();
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);

  const onSocial = async (provider: OAuthProvider) => {
    if (pending) return;
    setError(null);
    setPending(provider);
    track('login_click', { provider });
    try {
      await signInWithProvider(provider);
      // 웹은 provider로 리다이렉트되어 여기 이후는 실행되지 않음.
      // 네이티브는 세션 교환 성공 후 디사이더로 이동.
      router.replace('/');
    } catch (e) {
      if (!(e instanceof AuthCancelledError)) setError(messageOf(e));
    } finally {
      setPending(null);
    }
  };

  const onGuest = async () => {
    if (pending) return;
    setPending('guest');
    track('guest_enter');
    await enterGuest();
    router.replace('/');
  };

  const actions = (
    <View style={styles.actions}>
      {!configured && (
        <AppText variant="caption" color={colors.warning} center style={styles.notice}>
          로그인 서버가 아직 연결되지 않았어요. 먼저 둘러보기로 체험할 수 있어요.
        </AppText>
      )}

      {ENABLED_PROVIDERS.map((provider) => {
        const meta = PROVIDER_BUTTON[provider];
        return (
          <Button
            key={provider}
            label={meta.label}
            variant={meta.variant}
            onPress={() => onSocial(provider)}
            loading={pending === provider}
            disabled={!configured || (pending !== null && pending !== provider)}
            accessibilityLabel={meta.label}
          />
        );
      })}

      {error != null && (
        <AppText variant="caption" color={colors.danger} center style={styles.notice}>
          {error}
        </AppText>
      )}

      <Button
        label="먼저 둘러볼게요"
        variant="ghost"
        onPress={onGuest}
        loading={pending === 'guest'}
        disabled={pending !== null && pending !== 'guest'}
      />
    </View>
  );

  const legal = (
    <AppText variant="caption" muted center style={styles.legal}>
      로그인 시{' '}
      <Link href="/legal/terms" style={styles.link}>
        이용약관
      </Link>{' '}
      및{' '}
      <Link href="/legal/privacy" style={styles.link}>
        개인정보처리방침
      </Link>
      에 동의하게 됩니다.
    </AppText>
  );

  if (isDesktop) {
    return (
      <View style={styles.deskRoot}>
        {/* 브랜드 패널 */}
        <View style={styles.brandPane}>
          <View style={styles.brandInner}>
            <Logo size={54} withMark />
            <AppText variant="h2" center style={styles.brandTagline}>
              취미를 찾고, 기록하고,{'\n'}나누는 공간
            </AppText>
            <View style={styles.features}>
              {FEATURES.map((f) => (
                <View key={f.icon} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: f.tint }]}>
                    <Ionicons name={f.icon} size={22} color={f.ink} />
                  </View>
                  <AppText variant="body" muted style={styles.featureText}>
                    {f.text}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 로그인 패널 */}
        <View style={styles.authPane}>
          <View style={styles.authCard}>
            <AppText variant="h2" center>
              시작하기
            </AppText>
            <AppText variant="body" muted center style={styles.authSub}>
              간편하게 로그인하고{'\n'}나에게 맞는 취미를 찾아보세요
            </AppText>
            {actions}
            {legal}
          </View>
        </View>
      </View>
    );
  }

  return (
    <Screen footer={legal}>
      <View style={styles.hero}>
        <Logo size={46} withMark />
        <AppText variant="bodyLg" muted center style={styles.tagline}>
          취미를 찾고, 기록하고,{'\n'}나누는 공간
        </AppText>
      </View>

      {actions}
    </Screen>
  );
}

function messageOf(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return '로그인 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.';
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  tagline: {
    lineHeight: 30,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  notice: {
    paddingHorizontal: spacing.sm,
  },
  legal: {
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  link: {
    color: colors.primaryInk,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // ── 데스크탑 스플릿 ──
  deskRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  brandPane: {
    flex: 1,
    // "파란 배경 = 장식" 안티패턴 회피: 브랜드 블루는 인터랙션 전용(디자인 리서치)
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
  },
  brandInner: {
    maxWidth: 460,
    alignItems: 'center',
    gap: spacing.xl,
  },
  brandTagline: {
    lineHeight: 36,
  },
  features: {
    gap: spacing.base,
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14, // 스쿼클(정원 금지)
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    lineHeight: 26,
  },
  authPane: {
    width: 520,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.lg,
  },
  authSub: {
    lineHeight: 26,
  },
});
