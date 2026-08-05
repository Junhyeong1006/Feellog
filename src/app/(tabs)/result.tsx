/**
 * 성향 테스트 결과 (26.08 온보딩작업 v3 — Figma 675:689 Screen/Result).
 * 파랑 배경 + 뒤로가기(흰 원) + 흰 카드[유형 일러스트 → 유형명(32) → 장문 설명 → 다시 테스트하기]
 * + 하단 탭바(탭 그룹 내 숨김 라우트 — 시안에 탭바가 함께 그려짐).
 * usePrefs 기반(로컬 1차) — 딥링크로 진입했는데 결과가 없으면 /test로 리다이렉트.
 * 일러스트는 에너지형만 전용, 나머지 5유형은 공용 임시(시안 미완 — 일러 나오면 교체).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { figmaAssets } from '../../assets/figmaAssets';
import { TYPE_PROFILES, type MainType } from '@/core';
import { usePrefs } from '@/hooks/usePrefs';
import { clearTestProgress } from '@/state/testProgress';
import { colors, MIN_TOUCH_SIZE, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, Screen } from '@/ui';

/** 유형별 일러스트 — 시안 675:689(에너지형 전용) / 나머지는 공용 임시 이미지 */
const TYPE_IMAGES: Record<MainType, number> = {
  T01: figmaAssets.photos.resultTypeEnergy,
  T02: figmaAssets.photos.resultTypeGeneric,
  T03: figmaAssets.photos.resultTypeGeneric,
  T04: figmaAssets.photos.resultTypeGeneric,
  T05: figmaAssets.photos.resultTypeGeneric,
  T06: figmaAssets.photos.resultTypeGeneric,
};

export default function ResultScreen() {
  const { prefs, loading } = usePrefs();

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

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/my');
  };

  const onRetest = async () => {
    await clearTestProgress();
    router.replace('/test/run');
  };

  return (
    <Screen scroll background={colors.primary} contentStyle={styles.content}>
      {/* 뒤로가기 — 흰 원 + 파랑 화살표 (시안 Icon/Back 40px) */}
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        style={({ pressed }) => [styles.backHit, pressed && styles.pressedDim]}
      >
        <View style={styles.backCircle}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </View>
      </Pressable>

      {/* 결과 카드 */}
      <View style={styles.card}>
        <Image
          source={TYPE_IMAGES[prefs.mainType]}
          style={styles.illust}
          contentFit="contain"
          transition={150}
          accessibilityLabel={`${type.label} 일러스트`}
        />

        <AppText variant="h1" center style={styles.title}>
          {type.label}
        </AppText>

        <AppText variant="bodyLg" weight="regular" style={styles.desc}>
          {type.description}
        </AppText>

        {/* CTA를 카드 하단으로 앵커(시안: 설명↔CTA 사이 여유, 카드가 탭바 위까지 참) */}
        <View style={styles.spacer} />

        <Pressable
          onPress={() => void onRetest()}
          accessibilityRole="button"
          accessibilityLabel="다시 테스트하기"
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <AppText variant="titleW" color={palette.white}>
            다시 테스트하기
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  backHit: {
    // 시각 40px 원 + 실터치 48(웹은 hitSlop 미적용)
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'flex-start',
    justifyContent: 'center',
    margin: -spacing.xs,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedDim: {
    opacity: 0.85,
  },
  card: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.base,
    ...shadows.card,
  },
  illust: {
    width: '100%',
    height: 206,
  },
  title: {
    // 시안 Result/Title: SUIT 700 32
    marginTop: spacing.xs,
  },
  desc: {},
  spacer: {
    flexGrow: 1,
  },
  cta: {
    marginTop: spacing.sm,
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadows.cta,
  },
  ctaPressed: {
    backgroundColor: colors.primaryPressed,
  },
});
