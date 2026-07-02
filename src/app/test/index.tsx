/**
 * 성향 테스트 인트로 — 무엇을, 얼마나, 어떻게 하는지 안내 후 [시작하기].
 * 게스트도 체험 가능(결과 저장은 로그인 후).
 * 데스크탑: 안내 카드 3장을 한 줄로, 시작 버튼은 중앙 인라인.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { QUESTIONS } from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { answeredCount, clearTestProgress, getTestProgress } from '@/state/testProgress';
import { colors, CONTENT_WIDTH, radius, spacing } from '@/tokens';
import { AppText, Button, Card, Screen } from '@/ui';

const POINTS = [
  { emoji: '🖼️', title: '두 장면 중 끌리는 쪽', body: `${QUESTIONS.length}개의 장면을 비교하며 골라요` },
  { emoji: '⏱️', title: '약 2분이면 충분해요', body: '천천히 편하게 고르셔도 괜찮아요' },
  { emoji: '🎯', title: '나의 여가 유형', body: '유형과 어울리는 활동을 추천해드려요' },
];

export default function TestIntroScreen() {
  const { session, guest } = useAuth();
  const { isDesktop } = useBreakpoint();
  /** 저장된 진행분(있으면 "이어서 하기" 노출). null=없음 */
  const [resumeCount, setResumeCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getTestProgress().then((p) => {
        if (alive) setResumeCount(p ? answeredCount(p) : null);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const onStart = () => {
    // 재개/신규를 구분해 시작 수 중복 집계 방지
    track('test_start', { resumed: resumeCount != null });
    router.push('/test/run');
  };

  const onRestart = async () => {
    await clearTestProgress();
    setResumeCount(null);
    onStart();
  };

  const startButtons =
    resumeCount != null ? (
      <>
        <Button label={`이어서 하기 (${resumeCount}/${QUESTIONS.length} 완료)`} onPress={onStart} />
        <Button label="처음부터 다시 시작" variant="ghost" onPress={onRestart} />
      </>
    ) : (
      <Button label="시작하기" onPress={onStart} />
    );

  return (
    <Screen
      scroll
      maxWidth={isDesktop ? CONTENT_WIDTH.wide : undefined}
      contentStyle={styles.content}
      footer={isDesktop ? undefined : <View style={styles.footerCol}>{startButtons}</View>}
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

      <View style={[styles.points, isDesktop && styles.pointsRow]}>
        {POINTS.map((p) => (
          <Card
            key={p.title}
            padding="lg"
            elevation="soft"
            style={isDesktop ? styles.pointCardDesk : styles.pointCard}
          >
            <AppText style={styles.pointEmoji}>{p.emoji}</AppText>
            <View style={isDesktop ? styles.pointTextDesk : styles.pointText}>
              <AppText variant="title" center={isDesktop}>
                {p.title}
              </AppText>
              <AppText variant="body" muted center={isDesktop} style={styles.pointBody}>
                {p.body}
              </AppText>
            </View>
          </Card>
        ))}
      </View>

      {isDesktop && <View style={styles.deskStartCol}>{startButtons}</View>}

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
  pointsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'stretch',
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  pointCardDesk: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  pointTextDesk: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  deskStartCol: {
    alignSelf: 'center',
    minWidth: 320,
    gap: spacing.xs,
  },
  footerCol: {
    gap: spacing.xs,
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
