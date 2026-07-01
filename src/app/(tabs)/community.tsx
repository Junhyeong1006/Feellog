/**
 * 커뮤니티 탭 — 이웃들의 취미 기록(미리보기). 필터: 전체/우리 유형/인기/사진.
 * 좋아요는 로컬 토글(세션 한정). 글쓰기/댓글·서버 연동은 다음 단계.
 */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PostCard } from '@/components/PostCard';
import { SAMPLE_POSTS, type CommunityPost } from '@/data/samplePosts';
import { useTaste } from '@/hooks/useTaste';
import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';
import { AppText, Button, Screen } from '@/ui';

type FilterKey = 'all' | 'mine' | 'popular' | 'photo';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'mine', label: '우리 유형' },
  { key: 'popular', label: '인기' },
  { key: 'photo', label: '사진' },
];

export default function CommunityScreen() {
  const { taste } = useTaste();
  const myType = taste?.mainType ?? null;
  const [filter, setFilter] = useState<FilterKey>('all');
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const likeCountOf = (post: CommunityPost) => post.likeCount + (liked.has(post.id) ? 1 : 0);

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const posts = useMemo(() => {
    if (filter === 'mine') {
      return myType ? SAMPLE_POSTS.filter((p) => p.authorType === myType) : [];
    }
    if (filter === 'photo') {
      return SAMPLE_POSTS.filter((p) => p.hasPhoto);
    }
    if (filter === 'popular') {
      // 기본 좋아요 수로 정렬(로컬 토글로 손 밑에서 순서가 바뀌지 않게).
      return [...SAMPLE_POSTS].sort((a, b) => b.likeCount - a.likeCount);
    }
    return SAMPLE_POSTS;
  }, [filter, myType]);

  const showMineEmpty = filter === 'mine' && !myType;

  return (
    <Screen edges={['top']} scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="h2">커뮤니티</AppText>
        <AppText variant="caption" muted>
          미리보기 · 글쓰기는 곧 열려요
        </AppText>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
            >
              <AppText
                variant="body"
                weight="semibold"
                color={active ? colors.onPrimary : colors.textSecondary}
              >
                {f.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {showMineEmpty ? (
        <View style={styles.empty}>
          <AppText variant="body" muted center style={styles.emptyText}>
            성향 테스트를 하면{'\n'}같은 유형 이웃들의 글을 볼 수 있어요.
          </AppText>
          <Button label="성향 테스트 하기" variant="secondary" onPress={() => router.push('/test')} />
        </View>
      ) : (
        <View style={styles.list}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={liked.has(post.id)}
              likeCount={likeCountOf(post)}
              onToggleLike={() => toggleLike(post.id)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.surfaceInset,
  },
  list: {
    gap: spacing.base,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    lineHeight: 26,
  },
});
