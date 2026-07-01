/**
 * 커뮤니티 탭 — 이웃들의 취미 기록. 필터: 전체/우리 유형/인기/사진.
 * 실제 글(community_posts)을 보여주고, 글이 없으면 샘플로 폴백. 좋아요/글쓰기/내 글 삭제 지원.
 */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { Post } from '@/api/community';
import { PostCard } from '@/components/PostCard';
import { useCommunity } from '@/hooks/useCommunity';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
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
  const { session } = useAuth();
  const { taste } = useTaste();
  const myType = taste?.mainType ?? null;
  const myId = session?.user.id ?? null;
  const { posts, loading, isLiked, likeCountOf, toggleLike, removePost } = useCommunity();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (filter === 'mine') return myType ? posts.filter((p) => p.authorType === myType) : [];
    if (filter === 'photo') return posts.filter((p) => p.hasPhoto);
    // 화면에 보이는 카운트(likeCountOf)로 정렬 → 표시 순서와 표시 숫자가 어긋나지 않게.
    if (filter === 'popular') return [...posts].sort((a, b) => likeCountOf(b) - likeCountOf(a));
    return posts;
  }, [posts, filter, myType, likeCountOf]);

  const canDelete = (post: Post) => Boolean(myId) && !post.isSample && post.userId === myId;

  const onWrite = () => {
    if (session) router.push('/community/compose');
    else router.push('/login');
  };

  const showMineEmpty = filter === 'mine' && !myType;

  return (
    <Screen edges={['top']} scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="h2">커뮤니티</AppText>
        <Button label="글쓰기" size="md" fullWidth={false} onPress={onWrite} />
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

      {loading && posts.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : showMineEmpty ? (
        <View style={styles.empty}>
          <AppText variant="body" muted center style={styles.emptyText}>
            성향 테스트를 하면{'\n'}같은 유형 이웃들의 글을 볼 수 있어요.
          </AppText>
          <Button label="성향 테스트 하기" variant="secondary" onPress={() => router.push('/test')} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="body" muted center style={styles.emptyText}>
            아직 글이 없어요.{'\n'}첫 이야기를 남겨보세요.
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={isLiked(post.id)}
              likeCount={likeCountOf(post)}
              onToggleLike={() => toggleLike(post)}
              onDelete={canDelete(post) ? () => removePost(post.id) : undefined}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  loading: {
    paddingVertical: spacing.xxl,
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
