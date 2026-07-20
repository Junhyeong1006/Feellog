/**
 * 온보딩 인트로 3장 (v6 블루 DS — Figma 220-4713 / 220-4741 / 220-4906).
 * 좌우 스와이프 또는 [다음으로]로 진행. 장마다 인디케이터 활성 색이 다르다(파랑/코랄/민트).
 * 배경 도형(원·카드·메모지)은 View로 그리고 그 위에 Figma 추출 일러스트 SVG를 겹친다.
 * 3장 CTA [프로필 만들기] → 프로필 설정으로, 모든 장 [건너뛰기] → 홈으로.
 */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

// NOTE: '@/assets/*'는 tsconfig에서 루트 assets/로 매핑되어 src/assets는 상대경로로 가져온다
import { figmaAssets } from '../assets/figmaAssets';
import { FeellogLogo } from '@/components/FeellogLogo';
import { setOnboardingSeen } from '@/state/appFlags';
import { palette, colors, MAX_CONTENT_WIDTH, radius, spacing } from '@/tokens';
import { AppText, Button, Dots, Screen } from '@/ui';

interface Slide {
  title: string;
  sub: string;
  /** 장별 인디케이터 활성 색 */
  dotColor: string;
  art: React.ReactNode;
}

/** 1장 — 파란 원 238 + 가위 일러스트(원 좌하단에 겹침) */
function ScissorsArt() {
  return (
    <View style={artStyles.scissorsBox}>
      <View style={artStyles.blueCircle} />
      <Image
        source={figmaAssets.illustrations.onboardingScissors}
        style={artStyles.scissors}
        contentFit="contain"
      />
    </View>
  );
}

/** 2장 — 코랄 라운드 카드 320x128 + 세 사람 일러스트(카드 위아래로 삐져나옴) */
function PeopleArt() {
  return (
    <View style={artStyles.peopleBox}>
      <View style={artStyles.coralCard} />
      <Image
        source={figmaAssets.illustrations.onboardingPeople}
        style={artStyles.people}
        contentFit="contain"
      />
    </View>
  );
}

/** 3장 — 회전된 민트 메모지 228 + 흰 줄무늬 + 연필 일러스트 */
function PencilArt() {
  return (
    <View style={artStyles.pencilBox}>
      <View style={artStyles.memo}>
        <View style={artStyles.memoLine} />
        <View style={artStyles.memoLine} />
        <View style={artStyles.memoLine} />
        <View style={artStyles.memoLine} />
        <View style={[artStyles.memoLine, artStyles.memoLineShort]} />
      </View>
      <Image
        source={figmaAssets.illustrations.onboardingPencil}
        style={artStyles.pencil}
        contentFit="contain"
      />
    </View>
  );
}

const SLIDES: Slide[] = [
  {
    title: '새로운 즐거움\nFeellog와 함께',
    sub: '취미를 찾고, 기록하고, 나누는 공간',
    dotColor: colors.primary,
    art: <ScissorsArt />,
  },
  {
    title: '함께 나누는 즐거움,\n취향 공동체',
    sub: '정성스럽게 만든 결과물을 함께\n소통하며 공유해보세요.',
    dotColor: colors.accentCoral,
    art: <PeopleArt />,
  },
  {
    title: '나만의 속도로 즐기는 기록',
    sub: '차곡차곡 나만의 추억을 만듭니다.',
    dotColor: colors.accentMint,
    art: <PencilArt />,
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(MAX_CONTENT_WIDTH);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== pageWidth) setPageWidth(w);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next >= 0 && next < SLIDES.length && next !== index) setIndex(next);
  };

  /** 프로필 만들기 — 인트로 완료 표시 후 프로필 설정으로 */
  const toProfileSetup = async () => {
    await setOnboardingSeen(true);
    router.replace('/profile-setup');
  };

  /** 건너뛰기 — 인트로 완료 표시 후 홈(디사이더)으로 */
  const skip = async () => {
    await setOnboardingSeen(true);
    router.replace('/');
  };

  const goNext = () => {
    if (isLast) {
      void toProfileSetup();
      return;
    }
    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
    setIndex(next);
  };

  return (
    <Screen
      noPadding
      footer={
        <View style={styles.footer}>
          <Dots count={SLIDES.length} activeIndex={index} activeColor={SLIDES[index].dotColor} />
          <View style={styles.buttons}>
            <Button label={isLast ? '프로필 만들기' : '다음으로'} onPress={goNext} />
            <Button
              label={isLast ? '나중에하기' : '건너뛰기'}
              variant="secondary"
              onPress={() => void skip()}
            />
          </View>
        </View>
      }
    >
      <View style={styles.header}>
        <FeellogLogo width={108} />
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
              <View style={styles.artArea}>{slide.art}</View>
              <View style={styles.copy}>
                <AppText variant="display" center>
                  {slide.title}
                </AppText>
                <AppText variant="bodyLg" muted center>
                  {slide.sub}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  artArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    gap: spacing.base,
    paddingBottom: spacing.lg,
  },
  footer: {
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  buttons: {
    gap: spacing.base,
    // Figma 버튼 폭 276/360 — 좌우 여백을 더해 근사
    marginHorizontal: spacing.lg,
  },
});

const artStyles = StyleSheet.create({
  // ── 1장: 파란 원 + 가위 (Figma: 원 238 @x63,y117 / 가위 136x119 @x26,y279) ──
  scissorsBox: {
    width: 275,
    height: 281,
  },
  blueCircle: {
    position: 'absolute',
    left: 37,
    top: 0,
    width: 238,
    height: 238,
    borderRadius: radius.pill,
    backgroundColor: palette.bluePastel,
  },
  scissors: {
    position: 'absolute',
    left: 0,
    top: 162,
    width: 136,
    height: 119,
  },
  // ── 2장: 코랄 카드 + 세 사람 (Figma 그룹 320x178, 카드 y+20 128) ──
  peopleBox: {
    width: 320,
    maxWidth: '100%',
    height: 179,
  },
  coralCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: 128,
    borderRadius: radius.md,
    backgroundColor: palette.coralPastel,
  },
  people: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    width: 301,
    height: 179,
  },
  // ── 3장: 민트 메모지(회전) + 흰 줄 + 연필 (Figma: 메모 228 @x61,y148 / 연필 149x146) ──
  pencilBox: {
    width: 272,
    height: 262,
  },
  memo: {
    position: 'absolute',
    left: 0,
    top: 16,
    width: 228,
    height: 228,
    backgroundColor: palette.mintPastel,
    transform: [{ rotate: '8deg' }],
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  memoLine: {
    height: 2,
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
  },
  memoLineShort: {
    alignSelf: 'flex-start',
    width: '55%',
  },
  pencil: {
    position: 'absolute',
    left: 120,
    top: 72,
    width: 149,
    height: 146,
  },
});
