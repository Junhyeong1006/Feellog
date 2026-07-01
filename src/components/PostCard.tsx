/**
 * PostCard — 커뮤니티 글 카드. 작성자(아바타 이니셜 + 유형 배지 + 시간) + 본문 +
 * (사진글) 카테고리 이모지 밴드 + 좋아요/댓글 수. 좋아요는 부모가 제어(로컬 토글).
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { TYPE_META } from '@/core';
import type { CommunityPost } from '@/data/samplePosts';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Badge, Card } from '@/ui';

import { categoryVisual } from './categoryVisual';

export interface PostCardProps {
  post: CommunityPost;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
}

export function PostCard({ post, liked, likeCount, onToggleLike }: PostCardProps) {
  const visual = categoryVisual(post.category);
  const typeLabel = TYPE_META[post.authorType].label;

  return (
    <Card padding="lg" elevation="soft">
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <AppText variant="body" weight="bold" color={colors.primary}>
            {post.authorName.charAt(0)}
          </AppText>
        </View>
        <View style={styles.authorText}>
          <AppText variant="body" weight="semibold">
            {post.authorName}
          </AppText>
          <AppText variant="caption" muted>
            {post.timeAgo}
          </AppText>
        </View>
        <Badge label={typeLabel} tone="primary" size="sm" />
      </View>

      <AppText variant="body" style={styles.body}>
        {post.body}
      </AppText>

      {post.hasPhoto && (
        <View style={[styles.photo, { backgroundColor: visual.accent }]}>
          <AppText style={styles.photoEmoji}>{visual.emoji}</AppText>
        </View>
      )}

      <View style={styles.footer}>
        <Pressable
          onPress={onToggleLike}
          accessibilityRole="button"
          accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
          accessibilityState={{ selected: liked }}
          hitSlop={8}
          style={styles.footerBtn}
        >
          <AppText style={styles.footerIcon}>{liked ? '❤️' : '🤍'}</AppText>
          <AppText variant="body" color={liked ? colors.danger : colors.textSecondary} weight="semibold">
            {likeCount}
          </AppText>
        </Pressable>

        <View style={styles.footerBtn}>
          <AppText style={styles.footerIcon}>💬</AppText>
          <AppText variant="body" muted weight="semibold">
            {post.commentCount}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    flex: 1,
    gap: 2,
  },
  body: {
    lineHeight: 28,
    marginTop: spacing.md,
  },
  photo: {
    height: 160,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  photoEmoji: {
    fontSize: 60,
    lineHeight: 70,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.base,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
  },
  footerIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
