/**
 * 로그인 — 소셜 전용(카카오/구글/Apple). 이메일·비밀번호 없음.
 * '둘러보기'로 비로그인 체험도 가능(결과 저장은 로그인 후).
 * 하단 문구로 약관/개인정보 동의를 고지하고 전문 링크를 제공.
 */
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthCancelledError, signInWithProvider, type OAuthProvider } from '@/api/auth';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/tokens';
import { AppText, Button, Logo, Screen } from '@/ui';

type Pending = OAuthProvider | 'guest' | null;

export default function LoginScreen() {
  const { enterGuest, configured } = useAuth();
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);

  const onSocial = async (provider: OAuthProvider) => {
    if (pending) return;
    setError(null);
    setPending(provider);
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
    await enterGuest();
    router.replace('/');
  };

  return (
    <Screen
      footer={
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
      }
    >
      <View style={styles.hero}>
        <Logo size={46} withMark />
        <AppText variant="bodyLg" muted center style={styles.tagline}>
          취미를 찾고, 기록하고,{'\n'}나누는 공간
        </AppText>
      </View>

      <View style={styles.actions}>
        {!configured && (
          <AppText variant="caption" color={colors.warning} center style={styles.notice}>
            로그인 서버가 아직 연결되지 않았어요. 먼저 둘러보기로 체험할 수 있어요.
          </AppText>
        )}

        <Button
          label="카카오로 시작하기"
          variant="kakao"
          onPress={() => onSocial('kakao')}
          loading={pending === 'kakao'}
          disabled={!configured || (pending !== null && pending !== 'kakao')}
          accessibilityLabel="카카오 계정으로 시작하기"
        />
        <Button
          label="구글로 시작하기"
          variant="google"
          onPress={() => onSocial('google')}
          loading={pending === 'google'}
          disabled={!configured || (pending !== null && pending !== 'google')}
          accessibilityLabel="구글 계정으로 시작하기"
        />
        <Button
          label="Apple로 시작하기"
          variant="apple"
          onPress={() => onSocial('apple')}
          loading={pending === 'apple'}
          disabled={!configured || (pending !== null && pending !== 'apple')}
          accessibilityLabel="Apple 계정으로 시작하기"
        />

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
    color: colors.primary,
    fontWeight: '600',
  },
});
