/**
 * 비밀번호 찾기 (v6 블루 DS — 로그인 220-4609 디자인 언어 준수).
 * 가입 이메일 입력 → requestPasswordReset(재설정 메일 발송) → 발송 안내.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { requestPasswordReset } from '@/api/auth';
import { FeellogLogo } from '@/components/FeellogLogo';
import { colors, spacing } from '@/tokens';
import { AppText, Button, Input, Screen, ScreenHeader } from '@/ui';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function PasswordResetScreen() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async () => {
    if (pending) return;
    if (email.trim().length === 0) {
      setError('*이메일을 입력해주세요*');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('*이메일 주소를 다시 확인해주세요*');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : '메일 발송에 실패했어요';
      setError(`*${message}*`);
    } finally {
      setPending(false);
    }
  };

  // ── 발송 완료 안내 ──
  if (sentTo != null) {
    return (
      <Screen>
        <ScreenHeader hideBack />
        <View style={styles.doneWrap}>
          <FeellogLogo width={120} accessibilityLabel="필로그" />
          <AppText variant="h3" center style={styles.doneTitle}>
            재설정 메일을 보냈어요
          </AppText>
          <AppText variant="body" muted center style={styles.doneBody}>
            {sentTo} 주소로{'\n'}비밀번호 재설정 메일을 보내드렸어요.{'\n'}
            메일함을 확인해주세요.
          </AppText>
          <Button
            label="로그인으로 돌아가기"
            onPress={() => router.replace('/login')}
            style={styles.doneCta}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <Button label="재설정 메일 보내기" onPress={() => void onSubmit()} loading={pending} />
      }
    >
      <ScreenHeader title="비밀번호 찾기" />

      <View style={styles.logoWrap}>
        <FeellogLogo width={120} accessibilityLabel="필로그" />
      </View>

      <View style={styles.form}>
        <AppText variant="body" muted center style={styles.guide}>
          가입하신 이메일 주소를 입력하시면{'\n'}비밀번호 재설정 메일을 보내드려요.
        </AppText>

        <Input
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
          placeholder="이메일을 입력해주세요"
          error={error != null}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={() => void onSubmit()}
          accessibilityLabel="이메일 입력"
          editable={!pending}
        />

        <View style={styles.errorZone} accessibilityLiveRegion="polite">
          {error != null && (
            <AppText variant="small" color={colors.danger} center accessibilityRole="alert">
              {error}
            </AppText>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  guide: {
    marginBottom: spacing.sm,
  },
  errorZone: {
    minHeight: 24,
    justifyContent: 'center',
  },
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.huge,
  },
  doneTitle: {
    marginTop: spacing.xl,
  },
  doneBody: {
    marginTop: spacing.md,
  },
  doneCta: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
