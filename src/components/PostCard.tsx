/**
 * PostCard — 커뮤니티 글 카드. 작성자(아바타/유형 배지/시간) + 본문 +
 * (사진글) 카테고리 이모지 밴드 + 좋아요/댓글 수. 좋아요는 부모가 제어.
 * onDelete가 있으면 본인 글 → 인라인 확인 후 삭제.
 */
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Post } from '@/api/community';
import { TYPE_META } from '@/core';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Badge, Card } from '@/ui';

import { categoryVisual } from './categoryVisual';
import { CategoryImage } from './CategoryImage';

export interface PostCardProps {
  post: Post;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onDelete?: () => void;
  /** 본문/댓글 영역 탭 → 글 상세(댓글)로 이동. 상세 화면 자신은 넘기지 않는다. */
  onOpen?: () => void;
}

export function PostCard({ post, liked, likeCount, onToggleLike, onDelete, onOpen }: PostCardProps) {
  const visual = categoryVisual(post.category);
  const typeLabel = post.authorType ? TYPE_META[post.authorType].label : null;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card padding="lg" elevation="soft">
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          {post.authorAvatarUrl ? (
            <Image source={{ uri: post.authorAvatarUrl }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <AppText variant="body" weight="bold" color={colors.primaryInk}>
              {post.authorName.charAt(0)}
            </AppText>
          )}
        </View>
        <View style={styles.authorText}>
          <AppText variant="body" weight="semibold">
            {post.authorName}
          </AppText>
          <AppText variant="caption" muted>
            {post.createdAtLabel}
          </AppText>
        </View>
        {typeLabel && <Badge label={typeLabel} tone="primary" size="sm" />}
      </View>

      {onOpen ? (
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel="글 자세히 보기">
          <AppText variant="body" style={styles.body} numberOfLines={6}>
            {post.body}
          </AppText>
        </Pressable>
      ) : (
        <AppText variant="body" style={styles.body}>
          {post.body}
        </AppText>
      )}

      {post.hasPhoto && (
        <View style={[styles.photo, { backgroundColor: visual.accent }]}>
          <CategoryImage uri={post.imageUrl} emoji={visual.emoji} emojiSize={60} />
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
          <AppText variant="body" color={liked ? colors.coralInk : colors.textSecondary} weight="semibold">
            {likeCount}
          </AppText>
        </Pressable>

        {onOpen ? (
          <Pressable
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel={`댓글 ${post.commentCount}개 보기`}
            hitSlop={8}
            style={styles.footerBtn}
          >
            <AppText style={styles.footerIcon}>💬</AppText>
            <AppText variant="body" muted weight="semibold">
              {post.commentCount}
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.footerBtn}>
            <AppText style={styles.footerIcon}>💬</AppText>
            <AppText variant="body" muted weight="semibold">
              {post.commentCount}
            </AppText>
          </View>
        )}

        {onDelete && (
          <Pressable
            onPress={() => setConfirmingDelete(true)}
            accessibilityRole="button"
            accessibilityLabel="내 글 삭제"
            hitSlop={8}
            style={styles.deleteBtn}
          >
            <AppText variant="caption" muted>
              삭제
            </AppText>
          </Pressable>
        )}
      </View>

      {confirmingDelete && (
        <View style={styles.confirm}>
          <AppText variant="body" style={styles.confirmText}>
            이 글을 삭제할까요?
          </AppText>
          <View style={styles.confirmActions}>
            <Pressable onPress={() => setConfirmingDelete(false)} hitSlop={6} style={styles.confirmBtn}>
              <AppText variant="body" weight="semibold" color={colors.textSecondary}>
                취소
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => {
                setConfirmingDelete(false);
                onDelete?.();
              }}
              hitSlop={6}
              style={styles.confirmBtn}
            >
              <AppText variant="body" weight="semibold" color={colors.danger}>
                삭제
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
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
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
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
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
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
  deleteBtn: {
    marginLeft: 'auto',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  confirmText: {
    flex: 1,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  confirmBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
