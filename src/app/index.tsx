import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured } from '@/api/supabase';
import { colors, MAX_CONTENT_WIDTH, MIN_TOUCH_SIZE, radius, spacing, typography } from '@/tokens';

/**
 * Phase 0 환영(Hello World) 화면.
 * 디자인 토큰이 실제로 적용되는지 확인하고, Supabase 환경변수 연결 여부를 표시한다.
 * Phase 1에서 이 자리에 온보딩 → 성향테스트 진입이 들어간다.
 */
export default function WelcomeScreen() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoCircle} />
          <Text style={styles.logo}>Feellog</Text>
          <Text style={styles.tagline}>취미를 찾고, 기록하고, 나누는 공간</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phase 0 · 셋업 완료</Text>
          <Text style={styles.cardBody}>
            웹·앱 공용 코드베이스(Expo + react-native-web)와 디자인 토큰이 동작합니다.
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: supabaseReady ? colors.success : colors.warning },
              ]}
            />
            <Text style={styles.statusText}>
              Supabase 연결: {supabaseReady ? '설정됨' : '미설정 (.env 입력 필요)'}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="둘러보기"
        >
          <Text style={styles.primaryButtonText}>둘러보기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.accentPeri,
    marginBottom: spacing.sm,
  },
  logo: {
    ...typography.display,
    color: colors.primary,
  },
  tagline: {
    ...typography.bodyLg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  primaryButton: {
    minHeight: MIN_TOUCH_SIZE,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryButtonText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
