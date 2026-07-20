/**
 * 메인(홈) 탭 — Figma v6 블루 (439-1249 기존 유저 / 334-989 테스트 전).
 * [헤더] [오늘의 하루 픽 + 지역·가격 필터 칩] [추천 사진 카드(useTodayPick)]
 * [별로에요/좋아요] [검색바 → /search] [카테고리 6 원형 → /search/results?group=키]
 * 테스트 전(hasPrefs=false)에는 블루 히어로 카드('나의 스타일 찾기' → /test) + 카테고리 그리드.
 * 지역·가격 필터는 엔진 MatchFilter에 없는 축이라 표시용 자체 상태로 적용한다.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { figmaAssets } from '@/assets/figmaAssets';
import { HomeHeader } from '@/components/HomeHeader';
import type { Activity } from '@/core';
import {
  demoDurationMin,
  demoPhoto,
  demoPrice,
  demoRegion,
  formatDuration,
  formatPrice,
} from '@/data/activityDisplay';
import { ACTIVITY_SEED } from '@/data/activitySeed';
import { useTodayPick } from '@/hooks/useTodayPick';
import { colors, MAX_CONTENT_WIDTH, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, Button, Card, Screen } from '@/ui';

/** 타 화면 소유 라우트(/search 등) — typed routes 생성 전일 수 있어 문자열 캐스트로 이동 */
const pushPath = (path: string) => router.push(path as unknown as Href);

/** 홈 카테고리 6종 (스펙 [6]) — group 키는 /search/results가 시드 카테고리로 매핑 */
const CATEGORY_ITEMS = [
  { key: 'active', label: '활동', icon: figmaAssets.categoryIcons.active },
  { key: 'food', label: '음식', icon: figmaAssets.categoryIcons.food },
  { key: 'culture', label: '문화·예술', icon: figmaAssets.categoryIcons.culture },
  { key: 'craft', label: '공예', icon: figmaAssets.categoryIcons.craft },
  { key: 'nature', label: '자연·힐링', icon: figmaAssets.categoryIcons.nature },
  { key: 'learning', label: '배움', icon: figmaAssets.categoryIcons.learning },
] as const;

/** 가격 상한 필터 선택지(표시용) */
const PRICE_OPTIONS: readonly { label: string; value: number | null }[] = [
  { label: '전체', value: null },
  { label: '3만원 이하', value: 30000 },
  { label: '5만원 이하', value: 50000 },
  { label: '8만원 이하', value: 80000 },
];

/** 추천 카드 모서리 — 스펙 r32(토큰 밖 실측값) */
const PICK_CARD_RADIUS = 32;

/** 사진 위 가독용 검정 그라데이션(neutral900 기반 — 스펙 [3]) */
const PHOTO_OVERLAY = [
  'rgba(28, 28, 26, 0)',
  'rgba(28, 28, 26, 0.35)',
  'rgba(28, 28, 26, 0.8)',
] as const;

/** 드롭다운 필터 칩 (스펙: bg#F4F3F0 stroke#C8C7C3 r8, SUIT 400 12 + 파랑 쉐브론) */
function FilterChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} 필터 선택`}
      hitSlop={8}
      style={({ pressed }) => [styles.filterChip, pressed && styles.pressedDim]}
    >
      <AppText variant="small" color={palette.black}>
        {label}
      </AppText>
      <Ionicons name="chevron-down" size={14} color={colors.primary} />
    </Pressable>
  );
}

/** 필터 선택 바텀 시트 */
function FilterSheet({
  title,
  options,
  selectedIndex,
  onSelect,
  onClose,
}: {
  title: string;
  options: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="닫기" />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <AppText variant="h3" style={styles.sheetTitle}>
            {title}
          </AppText>
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {options.map((opt, i) => {
              const selected = i === selectedIndex;
              return (
                <Pressable
                  key={opt}
                  onPress={() => onSelect(i)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={opt}
                  style={({ pressed }) => [styles.sheetRow, pressed && styles.pressedDim]}
                >
                  <AppText
                    variant="bodyLg"
                    color={selected ? colors.primary : colors.textPrimary}
                    weight={selected ? 'bold' : 'medium'}
                  >
                    {opt}
                  </AppText>
                  {selected && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** 오늘의 하루 픽 사진 카드 (스펙 [3]) */
function PickCard({ activity }: { activity: Activity }) {
  return (
    <View style={styles.pickCard}>
      <Image
        source={demoPhoto(activity)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`${activity.title} 사진`}
      />
      <LinearGradient colors={PHOTO_OVERLAY} style={StyleSheet.absoluteFill} />
      <View style={styles.pickBody}>
        <AppText variant="small" color={colors.onPrimary}>
          {activity.category}
        </AppText>
        <AppText variant="display" color={colors.onPrimary} numberOfLines={1} adjustsFontSizeToFit>
          {activity.title}
        </AppText>
        <AppText variant="caption" color={palette.white} numberOfLines={1}>
          {activity.summary}
        </AppText>
        <View style={styles.pickMetaRow}>
          <View style={styles.pickMeta}>
            <Ionicons name="location-sharp" size={12} color={palette.white} />
            <AppText variant="small" color={palette.white}>
              {demoRegion(activity)}
            </AppText>
            <Ionicons name="time-outline" size={12} color={palette.white} style={styles.metaGapLeft} />
            <AppText variant="small" color={palette.white}>
              {formatDuration(demoDurationMin(activity))}
            </AppText>
          </View>
          <AppText variant="h1" color={palette.white} tabular style={styles.pickPrice}>
            {formatPrice(demoPrice(activity))}
          </AppText>
        </View>
      </View>
    </View>
  );
}

/** 테스트 전 히어로 (스펙 334-989 [2]) */
function StyleFindHero() {
  return (
    <View style={styles.hero}>
      <AppText variant="display" color={colors.onPrimary}>
        {'숨겨진 나의 취미를\n발견해봐요'}
      </AppText>
      <View style={styles.heroBottom}>
        <AppText variant="bodyLg" color={colors.onPrimary}>
          {'나의 스타일 찾기로\n나만의 취미를 발견하세요.'}
        </AppText>
        <Pressable
          onPress={() => router.push('/test')}
          accessibilityRole="button"
          accessibilityLabel="나의 스타일 찾기"
          style={({ pressed }) => [styles.heroCta, pressed && styles.pressedDim]}
        >
          <AppText variant="title" weight="semibold" color={colors.textPrimary}>
            나의 스타일 찾기
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

/** 카테고리 6 원형 그리드 (스펙 [6]) */
function CategoryGrid() {
  return (
    <View style={styles.grid} accessibilityRole="list">
      {CATEGORY_ITEMS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => pushPath(`/search/results?group=${item.key}`)}
          accessibilityRole="button"
          accessibilityLabel={`${item.label} 카테고리 보기`}
          style={({ pressed }) => [styles.gridItem, pressed && styles.pressedDim]}
        >
          <Image source={item.icon} style={styles.gridIcon} contentFit="contain" />
          <AppText variant="small" color={palette.black}>
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const pick = useTodayPick();

  // 표시용 필터(엔진 MatchFilter 밖 축 — demoRegion/demoPrice 기준 자체 상태)
  const [region, setRegion] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'region' | 'price' | null>(null);
  const [reacting, setReacting] = useState(false);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const a of ACTIVITY_SEED) set.add(demoRegion(a));
    return [...set].sort((x, y) => x.localeCompare(y, 'ko'));
  }, []);

  const passesDisplay = (a: Activity) =>
    (region == null || demoRegion(a) === region) && (maxPrice == null || demoPrice(a) <= maxPrice);

  const current = pick.current;
  const shown = current != null && passesDisplay(current.activity) ? current : null;
  /** 필터 때문에 현재 픽이 가려진 상태 */
  const filteredOut = current != null && shown == null;

  const react = async (liked: boolean) => {
    if (reacting) return;
    setReacting(true);
    try {
      await pick.react(liked);
    } finally {
      setReacting(false);
    }
  };

  const clearFilters = () => {
    setRegion(null);
    setMaxPrice(null);
  };

  const priceLabel = PRICE_OPTIONS.find((o) => o.value === maxPrice)?.label;

  return (
    <Screen scroll edges={['top']} contentStyle={styles.content}>
      <HomeHeader />

      {pick.loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !pick.hasPrefs ? (
        <>
          <StyleFindHero />
          <CategoryGrid />
        </>
      ) : (
        <>
          {/* 섹션 헤더 + 필터 칩 (스펙 [2]) */}
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleBox}>
              <AppText variant="h3">오늘의 하루 픽!</AppText>
              <AppText variant="caption" weight="medium">
                새롭게 하루 하나, 시작 ~
              </AppText>
            </View>
            <View style={styles.filterRow}>
              <FilterChip label={region == null ? '지역·전체' : region} onPress={() => setSheet('region')} />
              <FilterChip
                label={maxPrice == null ? '가격' : `가격·${priceLabel ?? ''}`}
                onPress={() => setSheet('price')}
              />
            </View>
          </View>

          {shown != null ? (
            <>
              <PickCard activity={shown.activity} />
              {/* 피드백 (스펙 [4]) — 엔진 current 벡터 즉시 보정 */}
              <View style={styles.feedbackRow}>
                <Button
                  label="별로에요"
                  variant="secondary"
                  onPress={() => void react(false)}
                  disabled={reacting}
                  style={styles.feedbackBtn}
                />
                <Button
                  label="좋아요"
                  variant="cta"
                  onPress={() => void react(true)}
                  disabled={reacting}
                  style={styles.feedbackBtn}
                />
              </View>
            </>
          ) : filteredOut ? (
            <Card padding="xl" cornerRadius="xl" bordered>
              <View style={styles.stateBox}>
                <AppText variant="bodyLg" center>
                  조건에 맞는 오늘 픽이 없어요
                </AppText>
                <AppText variant="caption" muted center>
                  지역·가격 조건을 바꾸면 다시 추천해 드려요.
                </AppText>
                <Button label="조건 초기화" variant="secondary" size="md" onPress={clearFilters} />
              </View>
            </Card>
          ) : (
            <Card padding="xl" cornerRadius="xl" bordered>
              <View style={styles.stateBox}>
                <AppText variant="bodyLg" center>
                  오늘 픽을 다 봤어요
                </AppText>
                <AppText variant="caption" muted center>
                  다시 보면 지금 취향으로 새로 추천해 드려요.
                </AppText>
                <Button label="다시 보기" variant="secondary" size="md" onPress={pick.reset} />
              </View>
            </Card>
          )}

          {/* 검색바 (스펙 [5]) */}
          <Pressable
            onPress={() => pushPath('/search')}
            accessibilityRole="button"
            accessibilityLabel="활동 검색"
            style={({ pressed }) => [styles.searchBar, pressed && styles.pressedDim]}
          >
            <Ionicons name="search" size={20} color={colors.primary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.searchPlaceholder}>
              어떤 활동을 찾고 계신가요?
            </AppText>
            <Ionicons name="menu" size={22} color={colors.primary} />
          </Pressable>

          <CategoryGrid />
        </>
      )}

      {sheet === 'region' && (
        <FilterSheet
          title="지역 선택"
          options={['전체', ...regions]}
          selectedIndex={region == null ? 0 : regions.indexOf(region) + 1}
          onSelect={(i) => {
            setRegion(i === 0 ? null : regions[i - 1]);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'price' && (
        <FilterSheet
          title="가격 선택"
          options={PRICE_OPTIONS.map((o) => o.label)}
          selectedIndex={Math.max(0, PRICE_OPTIONS.findIndex((o) => o.value === maxPrice))}
          onSelect={(i) => {
            setMaxPrice(PRICE_OPTIONS[i]?.value ?? null);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  loading: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 섹션 헤더 + 필터
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitleBox: {
    flexShrink: 1,
    gap: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10, // 스펙 pad(8-10,7-8)
    paddingVertical: 7,
  },

  // 추천 카드
  pickCard: {
    aspectRatio: 320 / 193, // 스펙 320x193
    borderRadius: PICK_CARD_RADIUS,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    ...shadows.card,
  },
  pickBody: {
    padding: spacing.lg,
    gap: 2,
  },
  pickMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pickMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  metaGapLeft: {
    marginLeft: spacing.xs,
  },
  pickPrice: {
    lineHeight: 38,
  },

  // 피드백 버튼 (스펙 [4] 133x56 x2)
  feedbackRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  feedbackBtn: {
    flex: 1,
  },
  stateBox: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  // 검색바
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.base,
  },
  searchPlaceholder: {
    flex: 1,
  },

  // 카테고리 그리드
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
    paddingTop: spacing.xs,
  },
  gridItem: {
    width: '33.33%',
    alignItems: 'center',
    gap: 7, // 스펙 gap5-7
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  gridIcon: {
    width: 60,
    height: 60,
  },

  // 테스트 전 히어로
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    minHeight: 480, // 스펙 321x521 근사(스크롤 내 유동)
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  heroBottom: {
    gap: spacing.lg,
  },
  heroCta: {
    minHeight: 56, // 스펙 276x56
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryPressed,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },

  // 필터 시트
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    ...shadows.floating,
  },
  sheetTitle: {
    paddingBottom: spacing.sm,
  },
  sheetScroll: {
    maxHeight: 400,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.xs,
  },
  pressedDim: {
    opacity: 0.75,
  },
});
