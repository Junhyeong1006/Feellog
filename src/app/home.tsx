/**
 * 홈 — 로그인/게스트가 성향테스트를 마친 뒤 도착하는 화면.
 * (다음 단계) 여기에 '오늘의 추천' 카드 피드가 들어간다. 지금은 진입점/안내.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Button, Card, Logo, Screen } from '@/ui';

export default function HomeScreen() {
  const { profile, session, guest } = useAuth();
  const name = session ? displayNameOf(profile) : '회원님';

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Logo size={28} />
        <AppText variant="body" muted>
          안녕하세요, {name}님
        </AppText>
      </View>

      <Card padding="xl" style={styles.hero}>
        <View style={styles.heroIcon}>
          <AppText style={styles.heroEmoji}>🌤️</AppText>
        </View>
        <AppText variant="h2" center style={styles.heroTitle}>
          오늘의 추천을{'\n'}준비하고 있어요
        </AppText>
        <AppText variant="bodyLg" muted center style={styles.heroBody}>
          성향에 맞춘 활동 카드가 곧 열립니다.{'\n'}조금만 기다려 주세요.
        </AppText>
      </Card>

      <View style={styles.actions}>
        <Button label="성향 다시 검사하기" variant="secondary" onPress={() => router.replace('/test/run')} />
        {guest && !session && (
          <Button label="로그인하고 저장하기" variant="ghost" onPress={() => router.replace('/login')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.base,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 46,
    lineHeight: 54,
  },
  heroTitle: {
    lineHeight: 34,
  },
  heroBody: {
    lineHeight: 28,
  },
  actions: {
    gap: spacing.sm,
  },
});
