/**
 * 성향 테스트 시작 (v6 블루 — Figma 50:6699).
 * 파랑 풀스크린 + 원형 일러스트(기록하는 여성) + 소요시간 칩 + 흰색 시작 CTA.
 * 저장된 진행분이 있으면 "이어서 하기"로 이어가기(S2 DoD) — 처음부터 다시 시작도 제공.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { figmaAssets } from '@/assets/figmaAssets';
import { QUESTIONS } from '@/core';
import { track } from '@/lib/analytics';
import { answeredCount, clearTestProgress, getTestProgress } from '@/state/testProgress';
import { colors, MIN_TOUCH_SIZE, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, Screen } from '@/ui';

const TOTAL = QUESTIONS.length;

/** 스펙 50-6699: 배경 #3673D4 위 반투명 장식/칩 색 */
const WHITE_A10 = 'rgba(255, 255, 255, 0.1)';
const MINT_GLOW = 'rgba(133, 230, 199, 0.2)'; // #85E6C7 @0.2
const PURPLE_GLOW = 'rgba(169, 128, 239, 0.1)'; // #A980EF @0.1

export default function TestStartScreen() {
  /** 저장된 진행분 응답 수(없으면 null) — 이어하기 노출용 */
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
    track('test_start', { resumed: resumeCount != null });
    router.push('/test/run');
  };

  const onRestart = async () => {
    await clearTestProgress();
    setResumeCount(null);
    track('test_start', { resumed: false });
    router.push('/test/run');
  };

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen scroll background={colors.primaryPressed} contentStyle={styles.content}>
      {/* 배경 장식 블러 원 */}
      <View pointerEvents="none" style={[styles.deco, styles.decoMint]} />
      <View pointerEvents="none" style={[styles.deco, styles.decoPurple]} />

      {/* 헤더: 뒤로가기 + 타이틀 */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressedDim]}
        >
          <Ionicons name="arrow-back" size={24} color={palette.white} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <AppText variant="bodyLg" weight="medium" color={palette.white}>
            스타일 찾기
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* 타이틀 + 서브 */}
      <View style={styles.copy}>
        <AppText variant="h2" weight="medium" center color={palette.white} style={styles.title}>
          나만의 여가 스타일을{'\n'}찾아볼까요?
        </AppText>
        <AppText variant="bodyLg" weight="medium" center color={palette.white} style={styles.subtitle}>
          {TOTAL}가지 질문을 통해 당신에게 꼭 맞는{'\n'}새로운 취미를 추천해 드려요.
        </AppText>
      </View>

      {/* 중앙 원형 일러스트 */}
      <View style={styles.visualWrap}>
        <View pointerEvents="none" style={styles.glow} />
        <View style={styles.circle}>
          <Image
            source={figmaAssets.illustrations.testStart}
            style={styles.illust}
            contentFit="cover"
            accessibilityLabel="취미를 기록하는 사람 일러스트"
          />
        </View>
      </View>

      {/* 소요시간 칩 + CTA */}
      <View style={styles.bottom}>
        <View style={styles.timeChip}>
          <Ionicons name="time-outline" size={16} color={colors.accentYellow} />
          <AppText variant="caption" weight="medium" color={palette.white}>
            소요 시간: 약 3분
          </AppText>
        </View>

        {resumeCount != null ? (
          <>
            <WhiteCta
              label={`이어서 하기 (${resumeCount}/${TOTAL} 완료)`}
              onPress={onStart}
            />
            <Pressable
              onPress={onRestart}
              accessibilityRole="button"
              accessibilityLabel="처음부터 다시 시작"
              style={({ pressed }) => [styles.restartBtn, pressed && styles.pressedDim]}
            >
              <AppText variant="body2" color={palette.white}>
                처음부터 다시 시작
              </AppText>
            </Pressable>
          </>
        ) : (
          <WhiteCta label="테스트 시작하기" onPress={onStart} />
        )}
      </View>
    </Screen>
  );
}

/** 스펙 전용 흰색 필 CTA(파랑 라벨) — 공용 Button cta(파랑 필)와 반전 형태라 로컬로 구성 */
function WhiteCta({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
    >
      <AppText variant="bodyLg" weight="medium" color={colors.primaryPressed}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  deco: {
    position: 'absolute',
    borderRadius: radius.pill,
  },
  decoMint: {
    width: 220,
    height: 220,
    top: 120,
    left: -80,
    backgroundColor: PURPLE_GLOW,
  },
  decoPurple: {
    width: 260,
    height: 260,
    bottom: 100,
    right: -100,
    backgroundColor: MINT_GLOW,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  backBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: MIN_TOUCH_SIZE,
  },
  copy: {
    paddingTop: spacing.xxl,
    gap: spacing.base,
  },
  title: {
    lineHeight: 38,
  },
  subtitle: {
    opacity: 0.9,
    lineHeight: 28,
  },
  visualWrap: {
    flexGrow: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: radius.pill,
    backgroundColor: MINT_GLOW,
  },
  circle: {
    width: 280,
    height: 280,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: palette.white,
    overflow: 'hidden',
    backgroundColor: palette.white,
    ...shadows.raised,
  },
  illust: {
    width: '100%',
    height: '100%',
  },
  bottom: {
    alignItems: 'center',
    gap: spacing.base,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.white,
    backgroundColor: WHITE_A10,
  },
  cta: {
    alignSelf: 'stretch',
    minHeight: 64,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cta,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  restartBtn: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedDim: {
    opacity: 0.7,
  },
});
