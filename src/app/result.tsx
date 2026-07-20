/**
 * 성향 테스트 결과 (v6 — Figma 334:1260 블루 리스킨).
 * 파랑 배경 + 흰 라운드 카드: 유형 이미지 → TYPE 0N 배지 → 유형명/부제/설명 → 공유 → 재테스트 CTA.
 * usePrefs 기반(로컬 1차) — 딥링크로 진입했는데 결과가 없으면 /test로 리다이렉트.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { figmaAssets } from '@/assets/figmaAssets';
import { TYPE_PROFILES, type MainType } from '@/core';
import { usePrefs } from '@/hooks/usePrefs';
import { track } from '@/lib/analytics';
import { clearTestProgress } from '@/state/testProgress';
import { colors, MIN_TOUCH_SIZE, palette, radius, shadows, spacing } from '@/tokens';
import { absoluteUrl, shareContent } from '@/utils/share';
import { AppText, Screen } from '@/ui';

/** 유형별 결과 대표 이미지 */
const TYPE_IMAGES: Record<MainType, number> = {
  T01: require('../../assets/photos/category-hiking.jpg'),
  T02: require('../../assets/photos/category-garden.jpg'),
  T03: require('../../assets/photos/community-pottery.jpg'),
  T04: require('../../assets/photos/category-exhibition.jpg'),
  T05: require('../../assets/photos/category-cooking.jpg'),
  T06: figmaAssets.photos.resultCalligraphy,
};

export default function ResultScreen() {
  const { prefs, loading } = usePrefs();
  const [shareNote, setShareNote] = useState<string | null>(null);

  if (loading) {
    return (
      <Screen background={colors.primary}>
        <View style={styles.loading}>
          <ActivityIndicator color={palette.white} />
        </View>
      </Screen>
    );
  }

  if (!prefs) return <Redirect href="/test" />;

  const type = TYPE_PROFILES[prefs.mainType];
  const typeNo = prefs.mainType.replace('T', ''); // 'T04' → '04'

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const onShare = async () => {
    track('result_share');
    const outcome = await shareContent({
      title: `나는 ${type.label}!`,
      message: `필로그 여가 스타일 테스트 결과, 나는 "${type.label}(${type.subtitle})"이에요. 당신의 여가 스타일도 알아보세요!`,
      url: absoluteUrl('/test'),
    });
    if (outcome === 'copied') setShareNote('링크를 복사했어요. 원하는 곳에 붙여넣어 보세요.');
    else if (outcome === 'failed') setShareNote('이 환경에서는 공유하기가 지원되지 않아요.');
    else setShareNote(null); // shared/dismissed는 안내 불필요
  };

  const onRetest = async () => {
    await clearTestProgress();
    router.replace('/test/run');
  };

  return (
    <Screen scroll background={colors.primary} contentStyle={styles.content}>
      {/* 상단 바 */}
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
          <AppText variant="body2" color={palette.white}>
            나의 여가 스타일 결과
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* 메인 카드 */}
      <View style={styles.card}>
        {/* 유형 대표 이미지 */}
        <View style={styles.illustCard}>
          <Image
            source={TYPE_IMAGES[prefs.mainType]}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            accessibilityLabel={`${type.label} 대표 이미지`}
          />
        </View>

        {/* TYPE 배지 */}
        <View style={styles.badge}>
          <AppText variant="caption" weight="medium" color={colors.textSecondary}>
            TYPE {typeNo}
          </AppText>
        </View>

        {/* 유형명 + 부제 */}
        <View style={styles.titleBlock}>
          <AppText variant="h3" weight="bold" center>
            {type.label}
          </AppText>
          <AppText variant="h3" weight="medium" center color={colors.primaryPressed}>
            {type.subtitle}
          </AppText>
        </View>

        {/* 설명 */}
        <AppText variant="bodyLg" weight="regular" center color={colors.textSecondary} style={styles.desc}>
          {type.description}이에요. 좋아하실 만한 활동을 골라 추천해 드릴게요.
        </AppText>

        {/* 공유 */}
        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="결과 공유하기"
          style={({ pressed }) => [styles.shareBtn, pressed && styles.pressedDim]}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        {shareNote != null && (
          <AppText variant="caption" center muted style={styles.shareNote}>
            {shareNote}
          </AppText>
        )}

        {/* 재테스트 CTA */}
        <Pressable
          onPress={onRetest}
          accessibilityRole="button"
          accessibilityLabel="테스트 다시하기"
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <AppText variant="bodyLg" weight="medium" color={palette.white}>
            테스트 다시하기
          </AppText>
          <Ionicons name="arrow-forward" size={18} color={palette.white} />
        </Pressable>
      </View>

      {/* 추천 보러 가기 — 결과가 실제 추천으로 이어지도록(기능 완결) */}
      <Pressable
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        accessibilityLabel="추천 활동 보러 가기"
        style={({ pressed }) => [styles.homeLink, pressed && styles.pressedDim]}
      >
        <AppText variant="body2" color={palette.white}>
          추천 활동 보러 가기
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  pressedDim: {
    opacity: 0.7,
  },
  card: {
    marginTop: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: 40, // 스펙 334-1260: r40
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.raised,
  },
  illustCard: {
    alignSelf: 'stretch',
    height: 144,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInset,
  },
  badge: {
    marginTop: spacing.xl,
    minHeight: 29,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    marginTop: spacing.base,
    gap: spacing.sm,
    alignItems: 'center',
  },
  desc: {
    marginTop: spacing.base,
    lineHeight: 29,
  },
  shareBtn: {
    marginTop: spacing.xl,
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareNote: {
    marginTop: spacing.sm,
  },
  cta: {
    marginTop: spacing.base,
    alignSelf: 'stretch',
    minHeight: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryPressed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.cta,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  homeLink: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
