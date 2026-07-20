/**
 * 검색 결과 화면 (Figma 553-1555 + 필터 패널 559-3148/559-3232).
 * 상단: 원형 뒤로가기 + 검색바(탭 → 입력 화면) + 필터(햄버거) 버튼.
 * 필터 패널: 지역(칩 펼침)·가격·소요시간·실내/실외·활동유형·난이도 아코디언 + 초기화/적용하기.
 * 결과 카드: 사진 + 지역 + 제목 + 별점 + 가격 + 찜 하트(useWishlist). 카드 탭 → /activity/<id>.
 * URL: ?q=검색어 & group=홈 카테고리(active|food|culture|craft|nature|learning).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Activity } from '@/core';
import {
  demoDifficulty,
  demoDurationMin,
  demoPhoto,
  demoPrice,
  demoRating,
  demoRegion,
  demoTags,
  formatPrice,
} from '@/data/activityDisplay';
import { ACTIVITY_SEED } from '@/data/activitySeed';
import { useWishlist } from '@/hooks/useCollections';
import { colors, MIN_TOUCH_SIZE, palette, radius, shadows, spacing } from '@/tokens';
import { HomeHeader } from '@/components/HomeHeader';
import { AppText, Button, Screen } from '@/ui';

// ── 홈 카테고리 그룹 → 시드 카테고리 매핑(홈 화면과 동일 매핑) ──
const GROUP_META: Record<string, { label: string; categories: string[] }> = {
  active: { label: '활동', categories: ['액티비티'] },
  food: { label: '음식', categories: ['요리'] },
  culture: { label: '문화·예술', categories: ['미술', '음악'] },
  craft: { label: '공예', categories: ['수공예'] },
  nature: { label: '자연·힐링', categories: ['플라워', '라이프스타일'] },
  learning: { label: '배움', categories: ['정규', '뷰티'] },
};

// ── 필터 ──
type Place = '실내' | '야외';
type Difficulty = '하' | '중' | '상';

interface Filters {
  region: string | null;
  priceMax: number | null;
  durationMax: number | null;
  place: Place | null;
  category: string | null;
  difficulty: Difficulty | null;
}

const EMPTY_FILTERS: Filters = {
  region: null,
  priceMax: null,
  durationMax: null,
  place: null,
  category: null,
  difficulty: null,
};

const REGION_OPTIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주'];
const PRICE_OPTIONS = [
  { label: '3만원 이하', max: 30000 },
  { label: '5만원 이하', max: 50000 },
  { label: '10만원 이하', max: 100000 },
];
const DURATION_OPTIONS = [
  { label: '1시간 30분 이하', max: 90 },
  { label: '2시간 이하', max: 120 },
  { label: '2시간 30분 이하', max: 150 },
];
const PLACE_OPTIONS: Place[] = ['실내', '야외'];
const CATEGORY_OPTIONS = [...new Set(ACTIVITY_SEED.map((a) => a.category))];
const DIFFICULTY_OPTIONS: Difficulty[] = ['하', '중', '상'];

function countActiveFilters(f: Filters): number {
  return Object.values(f).filter((v) => v != null).length;
}

function matchesQuery(a: Activity, q: string): boolean {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = `${a.name} ${a.title} ${a.summary} ${a.category}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

// ── 정렬 ──
const SORTS = [
  { id: 'default', label: '기본순' },
  { id: 'price', label: '가격 낮은순' },
  { id: 'rating', label: '평점 높은순' },
] as const;

const PAGE_SIZE = 6;
/** 필터 패널이 검색바 바로 아래에 뜨도록 하는 오프셋 */
const PANEL_TOP = spacing.sm + MIN_TOUCH_SIZE + spacing.xs;

// ── 필터 패널 내부: 칩 (559-3232 — 회색 필 / 선택 시 파랑 채움) ──
function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        styles.filterChip,
        selected && styles.filterChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="small"
        weight={selected ? 'medium' : 'regular'}
        color={selected ? colors.onPrimary : colors.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

type SectionKey = 'region' | 'price' | 'duration' | 'place' | 'category' | 'difficulty';

function FilterSection({
  label,
  sectionKey,
  openSection,
  onToggle,
  first,
  children,
}: {
  label: string;
  sectionKey: SectionKey;
  openSection: SectionKey | null;
  onToggle: (key: SectionKey) => void;
  first?: boolean;
  children: React.ReactNode;
}) {
  const open = openSection === sectionKey;
  return (
    <View style={!first && styles.sectionDivider}>
      <Pressable
        onPress={() => onToggle(sectionKey)}
        accessibilityRole="button"
        accessibilityLabel={`${label} 필터 ${open ? '접기' : '펼치기'}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.sectionHead, pressed && styles.pressed]}
      >
        <AppText variant="caption" weight="semibold">
          {label}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={open ? colors.primary : colors.textMuted}
        />
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

/** 필터 드롭다운 패널(559-3232 확장형 기준 — 아코디언 + 초기화/적용하기) */
function FilterPanel({
  initial,
  onApply,
  onClose,
}: {
  initial: Filters;
  onApply: (next: Filters) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<Filters>(initial);
  const [openSection, setOpenSection] = useState<SectionKey | null>('region');

  const toggleSection = (key: SectionKey) => setOpenSection((cur) => (cur === key ? null : key));
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setPending((cur) => ({ ...cur, [key]: cur[key] === value ? null : value }));

  return (
    <>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="필터 닫기"
        style={styles.backdrop}
      />
      <View style={styles.panel} accessibilityLabel="검색 필터">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.panelBody}>
            <FilterSection label="지역" sectionKey="region" openSection={openSection} onToggle={toggleSection} first>
              <View style={styles.chipGrid}>
                {REGION_OPTIONS.map((r) => (
                  <FilterChip key={r} label={r} selected={pending.region === r} onPress={() => set('region', r)} />
                ))}
              </View>
            </FilterSection>

            <FilterSection label="가격" sectionKey="price" openSection={openSection} onToggle={toggleSection}>
              <View style={styles.chipGrid}>
                {PRICE_OPTIONS.map((p) => (
                  <FilterChip
                    key={p.max}
                    label={p.label}
                    selected={pending.priceMax === p.max}
                    onPress={() => set('priceMax', p.max)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection label="소요시간" sectionKey="duration" openSection={openSection} onToggle={toggleSection}>
              <View style={styles.chipGrid}>
                {DURATION_OPTIONS.map((d) => (
                  <FilterChip
                    key={d.max}
                    label={d.label}
                    selected={pending.durationMax === d.max}
                    onPress={() => set('durationMax', d.max)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection label="실내/실외" sectionKey="place" openSection={openSection} onToggle={toggleSection}>
              <View style={styles.chipGrid}>
                {PLACE_OPTIONS.map((p) => (
                  <FilterChip key={p} label={p} selected={pending.place === p} onPress={() => set('place', p)} />
                ))}
              </View>
            </FilterSection>

            <FilterSection label="활동 유형" sectionKey="category" openSection={openSection} onToggle={toggleSection}>
              <View style={styles.chipGrid}>
                {CATEGORY_OPTIONS.map((c) => (
                  <FilterChip key={c} label={c} selected={pending.category === c} onPress={() => set('category', c)} />
                ))}
              </View>
            </FilterSection>

            <FilterSection label="난이도" sectionKey="difficulty" openSection={openSection} onToggle={toggleSection}>
              <View style={styles.chipGrid}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <FilterChip key={d} label={d} selected={pending.difficulty === d} onPress={() => set('difficulty', d)} />
                ))}
              </View>
            </FilterSection>
          </View>
        </ScrollView>

        <View style={styles.panelActions}>
          <Button
            label="초기화"
            variant="secondary"
            size="md"
            fullWidth={false}
            onPress={() => setPending(EMPTY_FILTERS)}
          />
          <Button
            label="적용하기"
            size="md"
            fullWidth={false}
            style={styles.applyBtn}
            onPress={() => onApply(pending)}
          />
        </View>
      </View>
    </>
  );
}

// ── 결과 카드 (553-1555) ──
function ResultCard({
  activity,
  wished,
  onToggleWish,
}: {
  activity: Activity;
  wished: boolean;
  onToggleWish: () => void;
}) {
  const price = formatPrice(demoPrice(activity));
  const region = demoRegion(activity);
  const { rating, count } = demoRating(activity);

  return (
    <Pressable
      onPress={() => router.push(`/activity/${activity.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${region}, ${price}, 별점 ${rating}점`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardPhotoWrap}>
        <Image
          source={demoPhoto(activity)}
          style={styles.cardPhoto}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`${activity.title} 사진`}
        />
        <Pressable
          onPress={onToggleWish}
          accessibilityRole="button"
          accessibilityLabel={wished ? `${activity.title} 찜 해제` : `${activity.title} 찜하기`}
          accessibilityState={{ selected: wished }}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.heartBtn, pressed && styles.pressed]}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={18}
            color={colors.accentCoral}
          />
        </Pressable>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.regionRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <AppText variant="caption" muted>
            {region}
          </AppText>
        </View>
        <AppText variant="title" numberOfLines={1}>
          {activity.title}
        </AppText>
        <View style={styles.metaRow}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.accentYellow} />
            <AppText variant="small" weight="semibold" color={colors.accentYellow} tabular>
              {rating.toFixed(1)}
            </AppText>
            <AppText variant="small" muted tabular>
              ({count})
            </AppText>
          </View>
          <AppText variant="title" color={colors.primary} tabular>
            {price}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{ q?: string | string[]; group?: string | string[] }>();
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  const groupKey = typeof params.group === 'string' ? params.group : '';
  const group = GROUP_META[groupKey] ?? null;

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortIndex, setSortIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { isWished, toggle } = useWishlist();

  const results = useMemo(() => {
    let list = ACTIVITY_SEED.filter((a) => matchesQuery(a, q));
    if (group) list = list.filter((a) => group.categories.includes(a.category));
    if (filters.region != null) list = list.filter((a) => demoRegion(a).startsWith(filters.region as string));
    if (filters.priceMax != null) list = list.filter((a) => demoPrice(a) <= (filters.priceMax as number));
    if (filters.durationMax != null)
      list = list.filter((a) => demoDurationMin(a) <= (filters.durationMax as number));
    if (filters.place != null) list = list.filter((a) => demoTags(a).includes(filters.place as string));
    if (filters.category != null) list = list.filter((a) => a.category === filters.category);
    if (filters.difficulty != null) list = list.filter((a) => demoDifficulty(a) === filters.difficulty);

    const sort = SORTS[sortIndex].id;
    if (sort === 'price') list = [...list].sort((x, y) => demoPrice(x) - demoPrice(y));
    else if (sort === 'rating')
      list = [...list].sort((x, y) => demoRating(y).rating - demoRating(x).rating);
    return list;
  }, [q, group, filters, sortIndex]);

  // 검색 조건이 바뀌면 페이지 리셋
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, groupKey, filters, sortIndex]);

  const shown = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;
  const activeFilterCount = countActiveFilters(filters);
  const contextLabel = q || group?.label || '';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const openSearchInput = () => {
    router.push(q ? { pathname: '/search', params: { q } } : '/search');
  };

  return (
    <Screen noPadding>
      <HomeHeader />
      <View style={styles.root}>
        {/* 뒤로 + 검색바 + 필터 */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>

          <View style={styles.searchBar}>
            <Pressable
              onPress={openSearchInput}
              accessibilityRole="button"
              accessibilityLabel={q ? `검색어 ${q} 수정` : '검색어 입력으로 이동'}
              style={styles.searchBarText}
            >
              <Ionicons name="search" size={20} color={colors.primary} />
              {q ? (
                <AppText variant="body" numberOfLines={1} style={styles.searchQuery}>
                  {q}
                </AppText>
              ) : (
                <AppText variant="caption" muted numberOfLines={1} style={styles.searchQuery}>
                  어떤 활동을 찾고 계신가요?
                </AppText>
              )}
            </Pressable>
            <Pressable
              onPress={() => setPanelOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={
                activeFilterCount > 0 ? `필터 열기, ${activeFilterCount}개 적용됨` : '필터 열기'
              }
              accessibilityState={{ expanded: panelOpen }}
              hitSlop={spacing.md}
              style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
            >
              <Ionicons name="menu" size={22} color={colors.primary} />
              {activeFilterCount > 0 && <View style={styles.filterDot} />}
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 카운트 + 정렬 */}
          <View style={styles.countRow}>
            <AppText variant="caption" tabular>
              {contextLabel ? `'${contextLabel}' 검색 결과 ${results.length}건` : `검색 결과 ${results.length}건`}
            </AppText>
            <Pressable
              onPress={() => setSortIndex((i) => (i + 1) % SORTS.length)}
              accessibilityRole="button"
              accessibilityLabel={`정렬 변경, 현재 ${SORTS[sortIndex].label}`}
              hitSlop={spacing.md}
              style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}
            >
              <AppText variant="caption">{SORTS[sortIndex].label}</AppText>
              <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* 결과 리스트 / 빈 상태 */}
          {results.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search" size={40} color={colors.textMuted} />
              <AppText variant="bodyLg" center>
                검색 결과가 없어요
              </AppText>
              <AppText variant="caption" muted center>
                다른 검색어나 필터로 다시 찾아보세요
              </AppText>
              {activeFilterCount > 0 && (
                <Button
                  label="필터 초기화"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onPress={() => setFilters(EMPTY_FILTERS)}
                  style={styles.emptyReset}
                />
              )}
            </View>
          ) : (
            <View style={styles.cards}>
              {shown.map((a) => (
                <ResultCard
                  key={a.id}
                  activity={a}
                  wished={isWished(a.id)}
                  onToggleWish={() => toggle(a.id)}
                />
              ))}
              {hasMore && (
                <Button
                  label="더보기"
                  onPress={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  accessibilityLabel={`결과 더보기, ${results.length - visibleCount}건 남음`}
                />
              )}
            </View>
          )}
        </ScrollView>

        {/* 필터 드롭다운 패널 */}
        {panelOpen && (
          <FilterPanel
            initial={filters}
            onApply={(next) => {
              setFilters(next);
              setPanelOpen(false);
            }}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  searchBarText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE - 2,
  },
  searchQuery: {
    flex: 1,
  },
  filterBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentCoral,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cards: {
    gap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  cardPhotoWrap: {
    height: 114,
    backgroundColor: colors.surfaceInset,
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.huge,
  },
  emptyReset: {
    marginTop: spacing.sm,
  },
  // ── 필터 패널 ──
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  panel: {
    position: 'absolute',
    top: PANEL_TOP,
    right: spacing.lg,
    width: 288,
    maxHeight: 448,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: colors.surfaceInset,
    borderRadius: radius.lg,
    overflow: 'hidden',
    zIndex: 20,
    ...shadows.raised,
  },
  panelBody: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceInset,
  },
  sectionHead: {
    minHeight: MIN_TOUCH_SIZE - 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  sectionBody: {
    paddingBottom: spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  panelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceInset,
  },
  applyBtn: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
