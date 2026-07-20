/**
 * 검색 입력 화면 (Figma 553-1287 계열).
 * 상단: 원형 뒤로가기 + 검색바(자동 포커스, 돋보기 아이콘).
 * 본문: 추천 검색어 칩 8개(시드 인기 카테고리 4 + 대표 활동명 4) + 최근 검색어(개별/전체 삭제).
 * 검색 실행 → recentSearches 저장 → /search/results?q= 이동.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ACTIVITY_SEED } from '@/data/activitySeed';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '@/state/recentSearches';
import { colors, fontFamily, MIN_TOUCH_SIZE, radius, spacing, typography } from '@/tokens';
import { HomeHeader } from '@/components/HomeHeader';
import { AppText, Screen } from '@/ui';

/** 추천 검색어 8개 — 시드에서 결정적으로 파생(인기 카테고리 4 + 각 카테고리 대표 활동명 4) */
function buildSuggestions(): string[] {
  const counts = new Map<string, number>();
  for (const a of ACTIVITY_SEED) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  const topCategories = [...counts.entries()]
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
    .slice(0, 4)
    .map(([category]) => category);
  const names = topCategories
    .map((category) => ACTIVITY_SEED.find((a) => a.category === category)?.name)
    .filter((n): n is string => n != null);
  return [...topCategories, ...names];
}

const SUGGESTIONS = buildSuggestions();

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const initialQ = typeof params.q === 'string' ? params.q : '';
  const [text, setText] = useState(initialQ);
  const [recent, setRecent] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getRecentSearches().then((list) => {
        if (alive) setRecent(list);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const submit = (raw: string) => {
    const query = raw.trim();
    if (!query) return;
    addRecentSearch(query).then(setRecent);
    router.push({ pathname: '/search/results', params: { q: query } });
  };

  const removeOne = (query: string) => {
    removeRecentSearch(query).then(setRecent);
  };

  const clearAll = () => {
    clearRecentSearches().then(setRecent);
  };

  return (
    <Screen scroll>
      <HomeHeader />

      {/* 뒤로가기 + 검색바 */}
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
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submit(text)}
            placeholder="어떤 활동을 찾고 계신가요?"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="검색어 입력"
            style={styles.searchInput}
          />
          {text.length > 0 && (
            <Pressable
              onPress={() => setText('')}
              accessibilityRole="button"
              accessibilityLabel="입력 지우기"
              hitSlop={spacing.md}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 추천 검색어 */}
      <View style={styles.section}>
        <AppText variant="bodyLg" muted>
          추천 검색어
        </AppText>
        <View>
          {SUGGESTIONS.map((word, i) => (
            <Pressable
              key={word}
              onPress={() => submit(word)}
              accessibilityRole="button"
              accessibilityLabel={`추천 검색어 ${word} 검색`}
              style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
            >
              <AppText variant="body2" color={colors.primary} tabular>
                {i + 1}.
              </AppText>
              <AppText variant="body" style={styles.suggestionText}>
                {word}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 최근 검색어 */}
      <View style={styles.section}>
        <View style={styles.sectionHeadRow}>
          <AppText variant="bodyLg" muted>
            최근 검색어
          </AppText>
          {recent.length > 0 && (
            <Pressable
              onPress={clearAll}
              accessibilityRole="button"
              accessibilityLabel="최근 검색어 전체 삭제"
              hitSlop={spacing.md}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <AppText variant="caption" color={colors.primary}>
                전체 삭제
              </AppText>
            </Pressable>
          )}
        </View>

        {recent.length === 0 ? (
          <AppText variant="caption" muted style={styles.emptyRecent}>
            아직 최근 검색어가 없어요
          </AppText>
        ) : (
          recent.map((word) => (
            <Pressable
              key={word}
              onPress={() => submit(word)}
              accessibilityRole="button"
              accessibilityLabel={`${word} 다시 검색`}
              style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
            >
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <AppText variant="body" muted numberOfLines={1} style={styles.recentText}>
                {word}
              </AppText>
              <Pressable
                onPress={() => removeOne(word)}
                accessibilityRole="button"
                accessibilityLabel={`${word} 삭제`}
                hitSlop={spacing.md}
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
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
    gap: spacing.sm,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionText: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emptyRecent: {
    paddingVertical: spacing.sm,
  },
  recentRow: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: spacing.sm,
  },
  recentText: {
    flex: 1,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
