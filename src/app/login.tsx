/**
 * 로그인 (v5: 사진 히어로) — 소셜 전용. 노출 provider는 config(ENABLED_PROVIDERS)로 토글.
 * 모바일: 풀블리드 실사진 히어로(하단 딤 + 흰 헤드라인) + 흰 시트(버튼).
 * 데스크탑: [사진 패널 | 로그인 컬럼] 스플릿.
 * '둘러보기'로 비로그인 체험도 가능(결과 저장은 로그인 후).
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthCancelledError, signInWithProvider, type OAuthProvider } from '@/api/auth';
import { HERO_PHOTOS } from '@/components/categoryPhoto';
import { ENABLED_PROVIDERS } from '@/config/auth';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, MAX_CONTENT_WIDTH, photoOverlay, spacing } from '@/tokens';
import { AppText, Button, Logo, type ButtonVariant } from '@/ui';

type Pending = OAuthProvider | 'guest' | null;

const PROVIDER_BUTTON: Record<OAuthProvider, { label: string; variant: ButtonVariant }> = {
  kakao: { label: '카카오로 시작하기', variant: 'kakao' },
  google: { label: '구글로 시작하기', variant: 'google' },
  apple: { label: 'Apple로 시작하기', variant: 'apple' },
};

const HEADLINE = '취미가 생기면,\n하루가 달라져요';
const SUBLINE = '나에게 맞는 취미를 2분 만에 찾아보세요';

export default function LoginScreen() {
  const { enterGuest, configured } = useAuth();
  const { isDesktop } = useBreakpoint();
  const insets = useSafeAreaInsets();
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
        {/* 사진 패널 */}
        <View style={styles.photoPane}>
          <Image source={HERO_PHOTOS.walk} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={photoOverlay.bottom} locations={[0.35, 0.62, 1]} style={StyleSheet.absoluteFill} />
          {/* 상단 스크림 — 밝은 사진 위 흰 워드마크 대비 확보(접근성 리뷰) */}
          <LinearGradient colors={photoOverlay.top} style={styles.topScrim} />
          <View style={styles.photoLogoDesk}>
            <Logo lockup size={26} color={colors.onPhoto} />
          </View>
          <View style={styles.photoCopyDesk}>
            <AppText variant="display" color={colors.onPhoto} style={styles.headlineDesk}>
              {HEADLINE}
            </AppText>
            <AppText variant="bodyLg" color={colors.onPhotoSoft}>
              {SUBLINE}
            </AppText>
          </View>
        </View>

        {/* 로그인 컬럼 */}
        <View style={styles.authPane}>
          <View style={styles.authCard}>
            <AppText variant="h1">시작하기</AppText>
            <AppText variant="body" muted style={styles.authSub}>
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
    <View style={styles.mobileRoot}>
      <ScrollView contentContainerStyle={styles.mobileScroll} bounces={false} showsVerticalScrollIndicator={false}>
        {/* 사진 히어로 */}
        <View style={styles.hero}>
          <Image source={HERO_PHOTOS.walk} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={photoOverlay.bottom} locations={[0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
          {/* 상단 스크림 — 밝은 사진 위 흰 워드마크 대비 확보(접근성 리뷰) */}
          <LinearGradient colors={photoOverlay.top} style={styles.topScrim} />
          <View style={[styles.heroLogo, { top: insets.top + spacing.lg }]}>
            <Logo lockup size={24} color={colors.onPhoto} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="h1" color={colors.onPhoto}>
              {HEADLINE}
            </AppText>
            <AppText variant="body" color={colors.onPhotoSoft} style={styles.subline}>
              {SUBLINE}
            </AppText>
          </View>
        </View>

        {/* 액션 시트 — 768~1023px 창에서 버튼이 전체 폭으로 늘어지지 않게 폰 컬럼 유지 */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sheetInner}>
            {actions}
            {legal}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function messageOf(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return '로그인 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.';
}

const styles = StyleSheet.create({
  mobileRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobileScroll: {
    flexGrow: 1,
  },
  hero: {
    height: 420,
    justifyContent: 'flex-end',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  heroLogo: {
    position: 'absolute',
    left: spacing.xl,
  },
  heroCopy: {
    padding: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  subline: {
    lineHeight: 26,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  sheetInner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.md,
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
  photoPane: {
    flex: 11,
    justifyContent: 'flex-end',
  },
  photoLogoDesk: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.xxl,
  },
  photoCopyDesk: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    maxWidth: 560,
  },
  headlineDesk: {
    lineHeight: 48,
  },
  authPane: {
    flex: 9,
    maxWidth: 560,
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
    lineHeight: 27,
  },
});
