/**
 * 성향 테스트 인트로 (v5) — 사진 히어로 + 흰 시트 안내 + [시작하기].
 * 게스트도 체험 가능(결과 저장은 로그인 후).
 * 데스크탑: [안내 컬럼 | 사진] 2컬럼.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HERO_PHOTOS } from '@/components/categoryPhoto';
import { QUESTIONS } from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { answeredCount, clearTestProgress, getTestProgress } from '@/state/testProgress';
import { colors, CONTENT_WIDTH, photoOverlay, radius, spacing } from '@/tokens';
import { AppText, Badge, Button, Screen } from '@/ui';

// 실제 문항은 텍스트 2택 — '장면 비교'처럼 이미지를 약속하는 카피 금지(적대적 리뷰)
const POINTS = [
  { icon: 'checkmark-circle-outline', title: '둘 중 더 끌리는 쪽', body: `${QUESTIONS.length}개의 질문에 답하며 알아가요` },
  { icon: 'time-outline', title: '약 2분이면 충분해요', body: '천천히 편하게 고르셔도 괜찮아요' },
  { icon: 'flag-outline', title: '나의 여가 유형', body: '유형과 어울리는 활동을 추천해드려요' },
] as const;

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

  const guide = (
    <View style={styles.points}>
      {POINTS.map((p) => (
        <View key={p.title} style={styles.pointRow}>
          <View style={styles.pointIcon}>
            <Ionicons name={p.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.pointText}>
            <AppText variant="title">{p.title}</AppText>
            <AppText variant="body" muted style={styles.pointBody}>
              {p.body}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );

  if (isDesktop) {
    return (
      <Screen scroll maxWidth={CONTENT_WIDTH.wide} contentStyle={styles.deskContent}>
        <View style={styles.deskColumns}>
          <View style={styles.deskLeft}>
            <Badge label={`약 2분 · ${QUESTIONS.length}문항`} tone="primary" />
            <AppText variant="display" style={styles.deskTitle}>
              나의 여가 성향{'\n'}알아보기
            </AppText>
            <AppText variant="bodyLg" muted style={styles.deskLead}>
              더 끌리는 쪽을 고르다 보면 나에게 맞는 취미가 보여요
            </AppText>
            {guide}
            <View style={styles.deskStartCol}>{startButtons}</View>
            {!session && guest && (
              <AppText variant="caption" muted>
                지금은 둘러보기 상태예요. 로그인하면 결과가 저장돼요.
              </AppText>
            )}
          </View>
          <View style={styles.deskPhoto}>
            <Image source={HERO_PHOTOS.test} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['bottom']}
      noPadding
      scroll
      footer={<View style={styles.footerCol}>{startButtons}</View>}
    >
      {/* 사진 히어로 */}
      <View style={styles.hero}>
        <Image source={HERO_PHOTOS.test} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={photoOverlay.bottom} locations={[0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.heroCopy}>
          <View style={styles.heroChip}>
            <AppText variant="caption" weight="bold" color={colors.onPhoto}>
              약 2분 · {QUESTIONS.length}문항
            </AppText>
          </View>
          <AppText variant="h1" color={colors.onPhoto}>
            나의 여가 성향 알아보기
          </AppText>
        </View>
      </View>

      {/* 안내 시트 */}
      <View style={styles.sheet}>
        <AppText variant="body" muted style={styles.lead}>
          더 끌리는 쪽을 고르다 보면 나에게 맞는 취미가 보여요
        </AppText>
        {guide}
        {!session && guest && (
          <AppText variant="caption" muted style={styles.guestNote}>
            지금은 둘러보기 상태예요. 로그인하면 결과가 저장돼요.
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 300,
    justifyContent: 'flex-end',
  },
  heroCopy: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  heroChip: {
    alignSelf: 'flex-start',
    minHeight: 34,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    // 흰 반투명 칩은 밝은 사진에서 AA 미달 — 다크 글래스 + 흰 텍스트(접근성 리뷰)
    backgroundColor: colors.photoChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  lead: {
    lineHeight: 28,
  },
  points: {
    gap: spacing.lg,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  pointIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: {
    flex: 1,
    gap: 2,
  },
  pointBody: {
    lineHeight: 26,
  },
  guestNote: {
    lineHeight: 22,
  },
  footerCol: {
    gap: spacing.xs,
  },
  // ── 데스크탑 ──
  deskContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  deskColumns: {
    flexDirection: 'row',
    gap: spacing.xxl,
    alignItems: 'stretch',
  },
  deskLeft: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  deskTitle: {
    lineHeight: 44,
  },
  deskLead: {
    lineHeight: 30,
  },
  deskStartCol: {
    gap: spacing.xs,
    maxWidth: 360,
  },
  deskPhoto: {
    flex: 1,
    minHeight: 460,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});
