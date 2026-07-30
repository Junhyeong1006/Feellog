/**
 * 소통 글 상세 — 피드 카드 풀 뷰 + 댓글(로컬 저장) + 댓글 입력바.
 * 시안 없음: v6 DS(파랑·SUIT·파스텔 카드) 준수 설계.
 * 대상 글 = SAMPLE_POSTS + 내가 쓴 로컬 글. 좋아요는 피드와 같은 로컬 토글을 공유한다.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { CommunityFeedPostCard } from '@/components/community_FeedPostCard';
import { SAMPLE_POSTS } from '@/data/sampleSocial';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { useFontScale } from '@/providers/FontScaleProvider';
import {
  timeLabelOf,
  useLocalComments,
  useLocalPosts,
  usePostLikes,
  type FeedPost,
  type LocalComment,
} from '@/state/localPosts';
import {
  colors,
  fontFamily,
  MIN_TOUCH_SIZE,
  radius,
  spacing,
  typography,
} from '@/tokens';
import { AppText, Button, Screen, ScreenHeader } from '@/ui';

const MAX_COMMENT = 500;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { scale } = useFontScale();

  const { posts: localPosts, loading } = useLocalPosts();
  const { isLiked, toggle } = usePostLikes();
  const { listOf, add: addComment, loading: commentsLoading } = useLocalComments();

  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const post: FeedPost | null = useMemo(
    () => [...localPosts, ...SAMPLE_POSTS].find((p) => p.id === id) ?? null,
    [localPosts, id],
  );

  const comments = post != null ? listOf(post.id) : [];
  const myName = session ? displayNameOf(profile) : '나';

  const submitComment = async () => {
    const body = input.slice(0, MAX_COMMENT).trim();
    if (!post || !body || submitting) return;
    setSubmitting(true);
    try {
      await addComment(post.id, myName, body);
      track('comment_create', { postId: post.id, local: true });
      setInput('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || commentsLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.headerBleed}>
          <ScreenHeader title="게시글" />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.headerBleed}>
          <ScreenHeader title="게시글" />
        </View>
        <View style={styles.center}>
          <AppText variant="h3" center>
            글을 찾을 수 없어요
          </AppText>
          <AppText variant="body" muted center>
            삭제되었거나 주소가 잘못되었어요.
          </AppText>
          <Button
            label="소통으로 돌아가기"
            variant="secondary"
            fullWidth={false}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
          />
        </View>
      </Screen>
    );
  }

  const totalCount = post.commentCount + comments.length;

  return (
    <Screen
      edges={['top', 'bottom']}
      scroll
      contentStyle={styles.content}
      footer={
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={(t) => setInput(t.slice(0, MAX_COMMENT))}
            placeholder="따뜻한 댓글을 남겨보세요"
            placeholderTextColor={colors.textMuted}
            multiline
            accessibilityLabel="댓글 내용"
            style={[
              styles.input,
              scale !== 1 && {
                fontSize: Math.round(typography.body.fontSize * scale),
                lineHeight: Math.round(typography.body.lineHeight * scale),
              },
            ]}
          />
          <Pressable
            onPress={submitComment}
            disabled={input.trim().length === 0 || submitting}
            accessibilityRole="button"
            accessibilityLabel="댓글 등록"
            accessibilityState={{ disabled: input.trim().length === 0 || submitting }}
            style={({ pressed }) => [
              styles.sendBtn,
              (input.trim().length === 0 || submitting) && styles.sendBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
            )}
          </Pressable>
        </View>
      }
    >
      <View style={styles.headerBleed}>
        <ScreenHeader title="게시글" />
      </View>

      <CommunityFeedPostCard
        post={post}
        liked={isLiked(post.id)}
        likeCount={post.likeCount + (isLiked(post.id) ? 1 : 0)}
        commentCount={totalCount}
        onToggleLike={() => void toggle(post.id)}
        expanded
      />

      <AppText variant="title" style={styles.commentsHead}>
        댓글 {totalCount}
      </AppText>

      {comments.length === 0 ? (
        <View style={styles.emptyCard}>
          <AppText variant="body" muted center>
            {post.commentCount > 0
              ? '이전 댓글은 준비 중이에요.\n새 댓글을 남겨보세요.'
              : '아직 댓글이 없어요.\n첫 댓글을 남겨보세요.'}
          </AppText>
        </View>
      ) : (
        <View style={styles.commentsCard}>
          {comments.map((c, i) => (
            <CommentRow key={c.id} comment={c} first={i === 0} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function CommentRow({ comment, first }: { comment: LocalComment; first: boolean }) {
  return (
    <View style={[styles.comment, !first && styles.commentDivider]}>
      <View style={styles.commentAvatar}>
        <AppText variant="caption" weight="bold" color={colors.primary}>
          {comment.authorName.charAt(0)}
        </AppText>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <AppText variant="body2" numberOfLines={1}>
            {comment.authorName}
          </AppText>
          <AppText variant="small" muted>
            {timeLabelOf(comment.createdAt)}
          </AppText>
        </View>
        <AppText variant="body">{comment.body}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBleed: {
    marginHorizontal: -spacing.sm,
  },
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  commentsHead: {
    marginTop: spacing.xs,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  commentsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
  },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  commentDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    maxHeight: 120,
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.base,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
});
