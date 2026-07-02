/**
 * 글 상세 + 댓글(S10). 글 1건 + 댓글 목록(오래된 순) + 입력창.
 * 게스트는 읽기만(입력창 대신 로그인 안내). 샘플 글은 댓글 미지원 안내.
 * 좋아요는 이 화면에서도 낙관적 토글(피드는 포커스 복귀 시 재동기화).
 */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import {
  createComment,
  deleteComment,
  fetchComments,
  fetchMyLikedPostIds,
  fetchPost,
  setPostLike,
  type Comment,
  type Post,
} from '@/api/community';
import { PostCard } from '@/components/PostCard';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { useFontScale } from '@/providers/FontScaleProvider';
import {
  colors,
  CONTENT_WIDTH,
  fontFamily,
  MIN_TOUCH_SIZE,
  palette,
  radius,
  spacing,
  typography,
} from '@/tokens';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/ui';

const MAX_COMMENT = 500;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { isDesktop } = useBreakpoint();
  const { scale } = useFontScale();
  const myId = session?.user.id ?? null;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeDelta, setLikeDelta] = useState(0);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 세션 객체는 토큰 갱신마다 새 참조가 되므로 user.id로 좁혀 불필요한 재로드를 막는다
  const sessionUserId = session?.user.id ?? null;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      // 낙관적 좋아요 상태 초기화(서버 스냅샷으로 대체 — 델타 중복 합산 방지)
      setLiked(false);
      setLikeDelta(0);
      try {
        const p = id ? await fetchPost(id) : null;
        if (!alive) return;
        setPost(p);
        if (p && !p.isSample) {
          const [cs, likedIds] = await Promise.all([
            fetchComments(p.id).catch(() => [] as Comment[]),
            session ? fetchMyLikedPostIds().catch(() => [] as string[]) : Promise.resolve([] as string[]),
          ]);
          if (!alive) return;
          setComments(cs);
          setLiked(likedIds.includes(p.id));
        }
      } catch {
        if (alive) setPost(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // 로그인 사용자 변경 시 좋아요 상태 재확인(session 대신 user.id — 토큰 갱신 재실행 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sessionUserId]);

  const onToggleLike = useCallback(() => {
    if (!post) return;
    const next = !liked;
    setLiked(next);
    setLikeDelta((d) => d + (next ? 1 : -1));
    if (!post.isSample && session) {
      setPostLike(post.id, next).catch(() => {});
    }
  }, [post, liked, session]);

  const onSubmit = async () => {
    if (!post || submitting) return;
    const body = input.trim();
    if (!body) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createComment(post.id, body);
      track('comment_create', { postId: post.id });
      setComments((prev) => [...prev, created]);
      setInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '댓글 등록에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId)); // 낙관적 제거
    try {
      await deleteComment(commentId);
    } catch {
      // 실패 시 재로드로 복구
      if (post) fetchComments(post.id).then(setComments).catch(() => {});
    }
  };

  const maxWidth = isDesktop ? CONTENT_WIDTH.reading : undefined;

  if (loading) {
    return (
      <Screen edges={['top', 'bottom']} noPadding maxWidth={maxWidth}>
        <ScreenHeader title="게시글" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen edges={['top', 'bottom']} noPadding maxWidth={maxWidth}>
        <ScreenHeader title="게시글" />
        <View style={styles.center}>
          <AppText variant="h2" center>
            글을 찾을 수 없어요
          </AppText>
          <AppText variant="body" muted center>
            삭제되었거나 잠시 후 다시 시도해주세요.
          </AppText>
          <Button
            label="커뮤니티로 돌아가기"
            variant="secondary"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      noPadding
      maxWidth={maxWidth}
      footer={
        post.isSample ? undefined : session ? (
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={(t) => setInput(t.slice(0, MAX_COMMENT))}
              placeholder="따뜻한 댓글을 남겨보세요"
              placeholderTextColor={palette.gray500}
              multiline
              style={[
                styles.input,
                scale !== 1 && {
                  fontSize: Math.round(typography.body.fontSize * scale),
                  lineHeight: Math.round(typography.body.lineHeight * scale),
                },
              ]}
              accessibilityLabel="댓글 내용"
            />
            <Button
              label="등록"
              size="md"
              fullWidth={false}
              onPress={onSubmit}
              loading={submitting}
              disabled={input.trim().length === 0 || submitting}
            />
          </View>
        ) : (
          <Button label="로그인하고 댓글 남기기" variant="secondary" onPress={() => router.push('/login')} />
        )
      }
    >
      <ScreenHeader title="게시글" />
      <ScrollView
        contentContainerStyle={styles.bodyWrap}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PostCard
          post={post}
          liked={liked}
          likeCount={post.likeCount + likeDelta}
          onToggleLike={onToggleLike}
        />

        <View style={styles.commentsHead}>
          <AppText variant="title">댓글 {post.isSample ? post.commentCount : comments.length}</AppText>
        </View>

        {post.isSample ? (
          <Card padding="lg" elevation="soft">
            <AppText variant="body" muted center style={styles.sampleNote}>
              지금 보시는 글은 미리보기용 샘플이에요.{'\n'}첫 글을 남기고 이웃들과 이야기를 시작해보세요!
            </AppText>
            <Button
              label="글쓰기"
              variant="secondary"
              onPress={() => (session ? router.push('/community/compose') : router.push('/login'))}
            />
          </Card>
        ) : comments.length === 0 ? (
          <AppText variant="body" muted center style={styles.emptyNote}>
            아직 댓글이 없어요. 첫 댓글을 남겨보세요!
          </AppText>
        ) : (
          <Card padding="lg" elevation="soft" style={styles.commentsCard}>
            {comments.map((c, i) => (
              <CommentRow
                key={c.id}
                comment={c}
                first={i === 0}
                onDelete={myId === c.userId ? () => onDeleteComment(c.id) : undefined}
              />
            ))}
          </Card>
        )}

        {error != null && (
          <AppText variant="caption" color={colors.danger} center>
            {error}
          </AppText>
        )}
      </ScrollView>
    </Screen>
  );
}

function CommentRow({
  comment,
  first,
  onDelete,
}: {
  comment: Comment;
  first: boolean;
  onDelete?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={[styles.comment, !first && styles.commentDivider]}>
      <View style={styles.commentAvatar}>
        {comment.authorAvatarUrl ? (
          <Image source={{ uri: comment.authorAvatarUrl }} style={styles.commentAvatarImg} contentFit="cover" />
        ) : (
          <AppText variant="caption" weight="bold" color={colors.primaryInk}>
            {comment.authorName.charAt(0)}
          </AppText>
        )}
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <AppText variant="body" weight="semibold">
            {comment.authorName}
          </AppText>
          <AppText variant="caption" muted>
            {comment.createdAtLabel}
          </AppText>
          {onDelete && !confirming && (
            <Pressable
              onPress={() => setConfirming(true)}
              accessibilityRole="button"
              accessibilityLabel="내 댓글 삭제"
              hitSlop={8}
              style={styles.commentDelete}
            >
              <AppText variant="caption" muted>
                삭제
              </AppText>
            </Pressable>
          )}
          {onDelete && confirming && (
            <View style={styles.commentConfirm}>
              <Pressable onPress={() => setConfirming(false)} hitSlop={8} style={styles.commentConfirmBtn}>
                <AppText variant="caption" weight="semibold" color={colors.textSecondary}>
                  취소
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirming(false);
                  onDelete();
                }}
                hitSlop={8}
                style={styles.commentConfirmBtn}
              >
                <AppText variant="caption" weight="semibold" color={colors.danger}>
                  삭제
                </AppText>
              </Pressable>
            </View>
          )}
        </View>
        <AppText variant="body" style={styles.commentText}>
          {comment.body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  bodyWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
  commentsHead: {
    marginTop: spacing.sm,
  },
  commentsCard: {
    gap: 0,
  },
  sampleNote: {
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  emptyNote: {
    paddingVertical: spacing.xl,
    lineHeight: 26,
  },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  commentDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  commentAvatarImg: {
    width: '100%',
    height: '100%',
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
  commentDelete: {
    marginLeft: 'auto',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  commentConfirm: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: spacing.lg, // hitSlop(8+8)과 겹치지 않는 간격(≥16)
  },
  commentConfirmBtn: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  commentText: {
    lineHeight: 27,
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
    ...typography.body,
    fontFamily: fontFamily.base,
    color: colors.textPrimary,
  },
});
