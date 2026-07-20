/**
 * 로그인 (v6 블루 DS — Figma 220-4609 정본, 에러 상태 220-4657).
 * 구성: 배경 기하 장식(파랑 원·민트 사각·코랄 사각) 위에 손글씨 로고,
 * 아이디(=이메일)/비밀번호 입력, 3링크(아이디 찾기·비밀번호 찾기·회원가입),
 * 입장하기(파랑 CTA)·둘러보기(스킵), 간편 로그인(구글 1개), 법적 문구.
 * 실패 시 인풋 코랄 보더 + CTA 아래 코랄 에러 문구(디자인 에러 상태).
 */
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AuthCancelledError, signInWithPassword, signInWithProvider } from '@/api/auth';
// NOTE: '@/assets/*'가 tsconfig에서 루트 ./assets로 매핑돼 '@/assets/figmaAssets'가 깨짐(전 화면 공통 이슈).
// tsconfig 수정 전까지 상대 경로로 참조한다(런타임 동일 파일).
import { figmaAssets } from '../assets/figmaAssets';
import { FeellogLogo } from '@/components/FeellogLogo';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, palette, radius, spacing } from '@/tokens';
import { AppText, Button, Input, Screen } from '@/ui';

type Pending = 'password' | 'google' | 'guest' | null;

export default function LoginScreen() {
  const { enterGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [idHelpOpen, setIdHelpOpen] = useState(false);

  const clearError = () => {
    if (error != null) setError(null);
  };

  const onEnter = async () => {
    if (pending) return;
    if (email.trim().length === 0) {
      setError('*아이디를 입력해주세요*');
      return;
    }
    if (password.length === 0) {
      setError('*비밀번호를 입력해주세요*');
      return;
    }
    setError(null);
    setPending('password');
    track('login_click', { provider: 'password' });
    try {
      await signInWithPassword(email, password);
      router.replace('/');
    } catch {
      setError('*아이디 또는 비밀번호를 확인해주세요*');
    } finally {
      setPending(null);
    }
  };

  const onGoogle = async () => {
    if (pending) return;
    setError(null);
    setPending('google');
    track('login_click', { provider: 'google' });
    try {
      await signInWithProvider('google');
      // 웹은 리다이렉트되어 이후가 실행되지 않음. 네이티브는 세션 교환 후 이동.
      router.replace('/');
    } catch (e) {
      if (!(e instanceof AuthCancelledError)) setError('*구글 로그인에 실패했어요. 다시 시도해주세요*');
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

  return (
    <Screen noPadding>
      <View style={styles.fill}>
        {/* 배경 기하 장식 — 콘텐츠 뒤(220-4609 좌표, 우측 도형은 right 앵커로 컬럼폭 대응) */}
        <View pointerEvents="none" style={styles.decoLayer}>
          <View style={styles.decoCircleBlue} />
          <View style={styles.decoSquareMint} />
          <View style={styles.decoSquareCoral} />
        </View>

        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* [1] 로고 */}
          <View style={styles.logoWrap}>
            <FeellogLogo width={150} accessibilityLabel="필로그" />
          </View>

          {/* [2][3] 아이디(이메일)/비밀번호 */}
          <View style={styles.inputs}>
            <Input
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                clearError();
              }}
              placeholder="이메일을 입력해주세요"
              error={error != null}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => void onEnter()}
              accessibilityLabel="아이디(이메일) 입력"
              editable={pending == null}
            />
            <Input
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                clearError();
              }}
              placeholder="비밀번호를 입력해주세요"
              error={error != null}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={() => void onEnter()}
              accessibilityLabel="비밀번호 입력"
              editable={pending == null}
            />
          </View>

          {/* [4] 링크 3개 */}
          <View style={styles.linkRow}>
            <TextLink label="아이디 찾기" onPress={() => setIdHelpOpen(true)} />
            <TextLink label="비밀번호 찾기" onPress={() => router.push('/password-reset')} />
            <TextLink label="회원가입" onPress={() => router.push('/signup')} />
          </View>

          {/* [5] 입장하기 */}
          <Button
            label="입장하기"
            onPress={() => void onEnter()}
            loading={pending === 'password'}
            disabled={pending != null && pending !== 'password'}
            style={styles.cta}
          />

          {/* 에러 문구 영역 — 에러 유무와 무관하게 높이를 유지해 아래 버튼 위치 고정(220-4657) */}
          <View style={styles.errorZone} accessibilityLiveRegion="polite">
            {error != null && (
              <AppText variant="small" color={colors.danger} center accessibilityRole="alert">
                {error}
              </AppText>
            )}
          </View>

          {/* [6] 둘러보기 */}
          <Button
            label="둘러보기"
            variant="secondary"
            onPress={() => void onGuest()}
            loading={pending === 'guest'}
            disabled={pending != null && pending !== 'guest'}
          />

          {/* [7] 간편 로그인 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" color={colors.textSecondary}>
              간편 로그인하기
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          {/* [8] 소셜 — 구글 1개(60px 원형) */}
          <View style={styles.socialRow}>
            <Button
              label="구글로 로그인"
              variant="social"
              social="google"
              onPress={() => void onGoogle()}
              loading={pending === 'google'}
              disabled={pending != null && pending !== 'google'}
              leftSlot={
                <Image
                  source={figmaAssets.socialIcons.google}
                  style={styles.socialIcon}
                  contentFit="contain"
                />
              }
            />
          </View>

          {/* [9] 법적 문구 */}
          <AppText variant="small" color={colors.textMuted} center style={styles.legal}>
            로그인 시{' '}
            <Link href="/legal/terms" style={styles.legalLink}>
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/legal/privacy" style={styles.legalLink}>
              개인정보처리 방침
            </Link>
            에 동의하게 됩니다.
          </AppText>
        </ScrollView>
      </View>

      {/* 아이디 찾기 안내 시트 */}
      <Modal
        visible={idHelpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIdHelpOpen(false)}
      >
        <Pressable
          style={styles.modalScrim}
          onPress={() => setIdHelpOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="안내 닫기"
        >
          <Pressable style={styles.modalCard} onPress={() => {}} accessibilityViewIsModal>
            <AppText variant="title" center>
              아이디 찾기
            </AppText>
            <AppText variant="body" muted center style={styles.modalBody}>
              가입하신 이메일이 아이디예요.{'\n'}
              아이디 칸에 이메일 주소를 입력해{'\n'}
              로그인해주세요.
            </AppText>
            <Button label="확인" size="md" onPress={() => setIdHelpOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

/** 링크 텍스트(SUIT 400/14 neutral600) — 시각은 그대로, 터치 48 확보 */
function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.textLink, pressed && styles.textLinkPressed]}
    >
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** 배경 장식 원본 좌표(디자인 폭 360) → 우측 도형은 right 앵커 환산값 */
const DECO = {
  circle: { size: 256, top: -79, right: -71 }, // x175 → right -(175+256-360)
  mint: { size: 228, top: 446, right: -60 }, // x192 → right -(192+228-360)
  coral: { size: 317, top: 271, left: -180 },
} as const;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  decoLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decoCircleBlue: {
    position: 'absolute',
    top: DECO.circle.top,
    right: DECO.circle.right,
    width: DECO.circle.size,
    height: DECO.circle.size,
    borderRadius: DECO.circle.size / 2,
    backgroundColor: palette.bluePastel,
  },
  decoSquareMint: {
    position: 'absolute',
    top: DECO.mint.top,
    right: DECO.mint.right,
    width: DECO.mint.size,
    height: DECO.mint.size,
    backgroundColor: palette.mintPastel,
    transform: [{ rotate: '45deg' }],
  },
  decoSquareCoral: {
    position: 'absolute',
    top: DECO.coral.top,
    left: DECO.coral.left,
    width: DECO.coral.size,
    height: DECO.coral.size,
    borderRadius: radius.md,
    backgroundColor: palette.coralPastel,
    transform: [{ rotate: '45deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxxl, // 디자인 좌우 마진 41 근사
    paddingBottom: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 120, // 디자인 y200(상태바 포함) 근사
  },
  inputs: {
    marginTop: spacing.huge, // 로고 → 입력 54 근사
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // 음수 마진은 위 힌트 텍스트와 겹침(스크린샷 검증) — 제거
    marginBottom: -spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  textLink: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  textLinkPressed: {
    opacity: 0.6,
  },
  cta: {
    marginTop: spacing.xs,
  },
  errorZone: {
    height: 66, // CTA(y515)↔둘러보기(y581) 사이 — 에러 토스트 y529 자리 고정
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1, // Figma gap 5
    marginTop: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  legal: {
    marginTop: spacing.lg,
  },
  legalLink: {
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalBody: {
    lineHeight: 26,
  },
});
