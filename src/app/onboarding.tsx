/**
 * 온보딩 인트로 3장 (프로토타입 카피). 좌우로 넘기거나 [다음]으로 진행.
 * 마지막 장에서 [시작하기] → onboardingSeen 저장 후 디사이더로 복귀.
 * 일러스트는 소프트 패널 + 이모지 placeholder(추후 실제 에셋으로 교체 쉬움).
 */
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { setOnboardingSeen } from '@/state/appFlags';
import { colors, MAX_CONTENT_WIDTH, palette, radius, spacing } from '@/tokens';
import { AppText, Button, Dots, Screen } from '@/ui';

interface Slide {
  emoji: string;
  accent: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🌱',
    accent: colors.primaryTint,
    title: '새로운 즐거움,\nFeellog와 함께',
    body: '취미를 찾고, 기록하고, 나누는 공간이에요',
  },
  {
    emoji: '🤝',
    accent: palette.mint,
    title: '함께 나누는 즐거움,\n취향 공동체',
    body: '정성스럽게 만든 결과물을 함께 소통하며 공유해보세요',
  },
  {
    emoji: '📖',
    accent: palette.coralTint,
    title: '나만의 속도로\n즐기는 기록',
    body: '차곡차곡 나만의 추억을 만들어요',
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(MAX_CONTENT_WIDTH);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setPageWidth(w);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== index) setIndex(next);
  };

  const finish = async () => {
    await setOnboardingSeen(true);
    router.replace('/');
  };

  const goNext = () => {
    if (isLast) {
      void finish();
      return;
    }
    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
    setIndex(next);
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      noPadding
      footer={
        <View style={styles.footer}>
          <Dots count={SLIDES.length} activeIndex={index} />
          <Button label={isLast ? '시작하기' : '다음'} onPress={goNext} />
        </View>
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel="건너뛰기"
          hitSlop={12}
          style={styles.skip}
        >
          <AppText variant="body" muted>
            건너뛰기
          </AppText>
        </Pressable>
      </View>

      <View style={styles.pager} onLayout={onLayout}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.slide, { width: pageWidth }]}>
              <View style={[styles.illust, { backgroundColor: slide.accent }]}>
                <AppText style={styles.emoji}>{slide.emoji}</AppText>
              </View>
              <View style={styles.copy}>
                <AppText variant="h2" center style={styles.title}>
                  {slide.title}
                </AppText>
                <AppText variant="bodyLg" muted center style={styles.body}>
                  {slide.body}
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  skip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  illust: {
    width: 220,
    height: 220,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 96,
    lineHeight: 108,
  },
  copy: {
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    lineHeight: 36,
  },
  body: {
    lineHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
});
