/**
 * 온보딩 인트로 3장 (프로토타입 카피). 좌우로 넘기거나 [다음]으로 진행.
 * 마지막 장에서 [시작하기] → onboardingSeen 저장 후 디사이더로 복귀.
 * 일러스트는 소프트 패널 + 이모지 placeholder(추후 실제 에셋으로 교체 쉬움).
 * 데스크탑: 캐러셀 대신 3장을 카드 한 줄로 펼쳐 보여준다(리사이즈 흔들림 없음).
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { SpotIllustration, type SpotKind } from '@/components/EmptyState';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { setOnboardingSeen } from '@/state/appFlags';
import { CONTENT_WIDTH, MAX_CONTENT_WIDTH, spacing } from '@/tokens';
import { AppText, Button, Card, Dots, Screen } from '@/ui';

interface Slide {
  spot: SpotKind;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    spot: 'compass',
    title: '나에게 맞는 취미,\n찾아드릴게요',
    body: '12개의 장면으로 성향을 알아보고 딱 맞는 활동을 추천해요',
  },
  {
    spot: 'chat',
    title: '함께 나누는 즐거움,\n취향 공동체',
    body: '같은 취향의 이웃들과 이야기를 나눠보세요',
  },
  {
    spot: 'heart',
    title: '좋아요 할수록\n더 잘 맞는 추천',
    body: '마음에 드는 활동에 좋아요를 남기면 추천이 똑똑해져요',
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const { isDesktop } = useBreakpoint();
  const [pageWidth, setPageWidth] = useState(MAX_CONTENT_WIDTH);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setPageWidth(w);
  };

  // 창 크기 변경/데스크탑↔모바일 전환 후에도 스크롤 오프셋을 현재 인덱스에 재동기화
  // (ScrollView가 리마운트되면 x=0으로 돌아가 Dots와 어긋나는 것 방지)
  useEffect(() => {
    if (!isDesktop) {
      scrollRef.current?.scrollTo({ x: index * pageWidth, animated: false });
    }
    // index는 의도적으로 제외 — 사용자가 직접 넘길 때는 goNext/onScroll이 처리한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth, isDesktop]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next >= 0 && next < SLIDES.length && next !== index) setIndex(next);
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

  if (isDesktop) {
    return (
      <Screen scroll maxWidth={CONTENT_WIDTH.dashboard} contentStyle={styles.deskContent}>
        <View style={styles.deskHero}>
          <AppText variant="h1" center>
            Feellog에 오신 것을 환영해요
          </AppText>
          <AppText variant="bodyLg" muted center style={styles.body}>
            취미를 찾고, 기록하고, 나누는 공간이에요
          </AppText>
        </View>

        <View style={styles.deskRow}>
          {SLIDES.map((slide, i) => (
            <Card key={i} padding="xl" elevation="soft" style={styles.deskCard}>
              <SpotIllustration kind={slide.spot} size={120} />
              <AppText variant="title" center style={styles.title}>
                {slide.title}
              </AppText>
              <AppText variant="body" muted center style={styles.body}>
                {slide.body}
              </AppText>
            </Card>
          ))}
        </View>

        <Button
          label="시작하기"
          fullWidth={false}
          style={styles.deskStart}
          onPress={() => void finish()}
        />
      </Screen>
    );
  }

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
          // 웹(react-native-web)은 onMomentumScrollEnd가 발화하지 않아 onScroll로도 갱신
          onScroll={onScroll}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.slide, { width: pageWidth }]}>
              <SpotIllustration kind={slide.spot} size={180} />
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
    height: 52,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  skip: {
    // 웹은 hitSlop이 무시되므로 실제 높이로 48dp 확보
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
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
  // ── 데스크탑: 3장 펼침 ──
  deskContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  deskHero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  deskRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'stretch',
  },
  deskCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.base,
  },
  deskStart: {
    alignSelf: 'center',
    minWidth: 280,
  },
});
