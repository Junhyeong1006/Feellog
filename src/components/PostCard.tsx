/**
 * PostCard — 커뮤니티 글 카드. 작성자(아바타/유형 배지/시간) + 본문 +
 * (사진글) 사진 블록 + 좋아요/댓글 수. 좋아요는 부모가 제어.
 * onDelete가 있으면 본인 글 → 인라인 확인 후 삭제.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Post } from '@/api/community';
import { TYPE_META } from '@/core';
import { colors, palette, radius, spacing } from '@/tokens';
import { AppText, Badge, Card } from '@/ui';

import { CategoryBand } from './CategoryBand';
import { samplePostPhoto } from './categoryPhoto';

/** 아바타 폴백 색: 이름 해시로 결정적 배정(틴트 bg + 딥 잉크 fg — v5 그린/테라코타/중립) */
const AVATAR_TONES = [
  { bg: palette.greenTint, fg: palette.green600 },
  { bg: palette.terracottaTint, fg: palette.terracotta },
  { bg: palette.inset, fg: palette.gray600 },
] as const;

function avatarTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

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
  const typeLabel = post.authorType ? TYPE_META[post.authorType].label : null;
  const tone = avatarTone(post.authorName);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // 샘플 글은 카탈로그와 다른 전용 컷 — 같은 사진이 '유저 사진'으로 재등장하는 가짜 티 방지
  const sampleCut = post.isSample ? samplePostPhoto(post.id) : null;

  return (
    <Card padding="lg" elevation="soft">
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
          {post.authorAvatarUrl ? (
            <Image source={{ uri: post.authorAvatarUrl }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <AppText variant="body" weight="bold" color={tone.fg}>
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
        <View style={styles.photo}>
          {sampleCut ? (
            <Image source={sampleCut} style={styles.samplePhoto} contentFit="cover" transition={150} />
          ) : (
            <CategoryBand imageUrl={post.imageUrl} category={post.category} height={168} glyphSize={28} />
          )}
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
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.accent : colors.textSecondary}
          />
          <AppText variant="body" color={liked ? colors.accent : colors.textSecondary} weight="semibold" tabular>
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
            <Ionicons name="chatbubble-outline" size={21} color={colors.textSecondary} />
            <AppText variant="body" muted weight="semibold" tabular>
              {post.commentCount}
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.footerBtn}>
            <Ionicons name="chatbubble-outline" size={21} color={colors.textSecondary} />
            <AppText variant="body" muted weight="semibold" tabular>
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
    borderRadius: radius.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  samplePhoto: {
    width: '100%',
    height: 168,
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
    // 웹은 hitSlop이 무시되므로 실제 높이로 48dp 확보
    minHeight: 48,
    paddingHorizontal: spacing.xs,
  },
  deleteBtn: {
    marginLeft: 'auto',
    minHeight: 48,
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
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
