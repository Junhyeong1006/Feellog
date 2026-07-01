/**
 * 성향 테스트 인트로 — 무엇을, 얼마나, 어떻게 하는지 안내 후 [시작하기].
 * 게스트도 체험 가능(결과 저장은 로그인 후).
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { QUESTIONS } from '@/core';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Button, Card, Screen } from '@/ui';

const POINTS = [
  { emoji: '🖼️', title: '두 장면 중 끌리는 쪽', body: `${QUESTIONS.length}개의 장면을 비교하며 골라요` },
  { emoji: '⏱️', title: '약 2분이면 충분해요', body: '천천히 편하게 고르셔도 괜찮아요' },
  { emoji: '🎯', title: '나의 여가 유형', body: '유형과 어울리는 활동을 추천해드려요' },
];

export default function TestIntroScreen() {
  const { session, guest } = useAuth();

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={<Button label="시작하기" onPress={() => router.push('/test/run')} />}
    >
      <View style={styles.hero}>
        <View style={styles.badge}>
          <AppText style={styles.badgeEmoji}>🧭</AppText>
        </View>
        <AppText variant="h1" center style={styles.title}>
          나의 여가 성향{'\n'}알아보기
        </AppText>
        <AppText variant="bodyLg" muted center style={styles.subtitle}>
          더 끌리는 쪽을 고르다 보면{'\n'}나에게 맞는 취미가 보여요
        </AppText>
      </View>

      <View style={styles.points}>
        {POINTS.map((p) => (
          <Card key={p.title} padding="lg" elevation="soft" style={styles.pointCard}>
            <AppText style={styles.pointEmoji}>{p.emoji}</AppText>
            <View style={styles.pointText}>
              <AppText variant="title">{p.title}</AppText>
              <AppText variant="body" muted style={styles.pointBody}>
                {p.body}
              </AppText>
            </View>
          </Card>
        ))}
      </View>

      {!session && guest && (
        <AppText variant="caption" muted center style={styles.guestNote}>
          지금은 둘러보기 상태예요. 로그인하면 결과가 저장돼요.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.base,
    paddingTop: spacing.lg,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 52,
    lineHeight: 60,
  },
  title: {
    lineHeight: 42,
  },
  subtitle: {
    lineHeight: 28,
  },
  points: {
    gap: spacing.md,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  pointEmoji: {
    fontSize: 34,
    lineHeight: 40,
  },
  pointText: {
    flex: 1,
    gap: 2,
  },
  pointBody: {
    lineHeight: 26,
  },
  guestNote: {
    paddingHorizontal: spacing.lg,
  },
});
