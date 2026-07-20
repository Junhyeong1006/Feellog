/**
 * 회원가입 (v6 블루 DS — 로그인 220-4609 디자인 언어 준수).
 * 로고 + 이메일/비밀번호/비밀번호 확인/닉네임 + 가입 CTA.
 * signUpWithPassword → needsEmailConfirm이면 '메일함에서 인증을 완료해주세요' 안내 후 로그인으로,
 * 세션이 바로 생기면 홈으로 이동한다.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { signUpWithPassword } from '@/api/auth';
import { FeellogLogo } from '@/components/FeellogLogo';
import { colors, spacing } from '@/tokens';
import { AppText, Button, Input, Screen, ScreenHeader } from '@/ui';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 6;

type Field = 'email' | 'password' | 'confirm' | 'nickname';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nickname, setNickname] = useState('');

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ field: Field | null; message: string } | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null); // 가입 완료(메일 인증 대기)

  const validate = (): { field: Field; message: string } | null => {
    if (email.trim().length === 0) return { field: 'email', message: '*이메일을 입력해주세요*' };
    if (!EMAIL_RE.test(email.trim()))
      return { field: 'email', message: '*이메일 주소를 다시 확인해주세요*' };
    if (password.length === 0) return { field: 'password', message: '*비밀번호를 입력해주세요*' };
    if (password.length < MIN_PASSWORD)
      return { field: 'password', message: `*비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요*` };
    if (confirm !== password)
      return { field: 'confirm', message: '*비밀번호가 서로 달라요. 다시 확인해주세요*' };
    if (nickname.trim().length === 0)
      return { field: 'nickname', message: '*사용하실 닉네임을 입력해주세요*' };
    return null;
  };

  const onSubmit = async () => {
    if (pending) return;
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { needsEmailConfirm } = await signUpWithPassword(email, password, nickname.trim());
      if (needsEmailConfirm) {
        setConfirmEmail(email.trim());
      } else {
        router.replace('/');
      }
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : '가입에 실패했어요';
      setError({ field: null, message: `*${message}*` });
    } finally {
      setPending(false);
    }
  };

  // ── 가입 완료: 메일 인증 안내 ──
  if (confirmEmail != null) {
    return (
      <Screen>
        <ScreenHeader hideBack />
        <View style={styles.confirmWrap}>
          <FeellogLogo width={120} accessibilityLabel="필로그" />
          <AppText variant="h3" center style={styles.confirmTitle}>
            인증 메일을 보냈어요
          </AppText>
          <AppText variant="body" muted center style={styles.confirmBody}>
            {confirmEmail} 주소로{'\n'}인증 메일을 보내드렸어요.{'\n'}
            메일함에서 인증을 완료해주세요.
          </AppText>
          <Button
            label="로그인으로 돌아가기"
            onPress={() => router.replace('/login')}
            style={styles.confirmCta}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <Button label="가입하기" onPress={() => void onSubmit()} loading={pending} />
      }
    >
      <ScreenHeader title="회원가입" />

      <View style={styles.logoWrap}>
        <FeellogLogo width={120} accessibilityLabel="필로그" />
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <AppText variant="caption" color={colors.textSecondary}>
            이메일 (아이디로 사용해요)
          </AppText>
          <Input
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            placeholder="이메일을 입력해주세요"
            error={error?.field === 'email'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="이메일 입력"
            editable={!pending}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" color={colors.textSecondary}>
            비밀번호
          </AppText>
          <Input
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
            placeholder={`비밀번호를 입력해주세요 (${MIN_PASSWORD}자 이상)`}
            error={error?.field === 'password'}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="비밀번호 입력"
            editable={!pending}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" color={colors.textSecondary}>
            비밀번호 확인
          </AppText>
          <Input
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              setError(null);
            }}
            placeholder="비밀번호를 한 번 더 입력해주세요"
            error={error?.field === 'confirm'}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="비밀번호 확인 입력"
            editable={!pending}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" color={colors.textSecondary}>
            닉네임
          </AppText>
          <Input
            value={nickname}
            onChangeText={(t) => {
              setNickname(t);
              setError(null);
            }}
            placeholder="닉네임을 입력해주세요"
            error={error?.field === 'nickname'}
            maxLength={20}
            accessibilityLabel="닉네임 입력"
            editable={!pending}
          />
        </View>

        <View style={styles.errorZone} accessibilityLiveRegion="polite">
          {error != null && (
            <AppText variant="small" color={colors.danger} center accessibilityRole="alert">
              {error.message}
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
    gap: spacing.base,
    paddingBottom: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  errorZone: {
    minHeight: 24,
    justifyContent: 'center',
  },
  confirmWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.huge,
  },
  confirmTitle: {
    marginTop: spacing.xl,
  },
  confirmBody: {
    marginTop: spacing.md,
  },
  confirmCta: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
