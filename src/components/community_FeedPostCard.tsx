/**
 * CommunityFeedPostCard — 소통 피드 게시글 카드 (Figma 518-999).
 * 말풍선형(좌상단만 크게 둥근) 파스텔 카드: bgTone → POST_BG_TONES 배경 + 톤 매칭 보더.
 * 하단 흰 푸터바: 좋아요(하트+수)·댓글 아이콘+수 | 태그 칩 + 별점(후기면).
 * 소통 탭 피드와 글 상세(/community/[id])가 공용으로 쓴다.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { POST_BG_TONES } from '@/data/sampleSocial';
import type { FeedPost } from '@/state/localPosts';
import { colors, palette, radius, spacing } from '@/tokens';
import { AppText, Chip, Stars } from '@/ui';

/** 말풍선 좌상단 큰 라운드(시안 150의 근사 — 콘텐츠 클리핑 없는 선) */
const BUBBLE_RADIUS = 80;

/** bgTone → 보더 색(시안: 핑크 카드 #EE7864, 노랑 카드 #FAC342) */
const TONE_BORDER: Record<NonNullable<FeedPost['bgTone']>, string> = {
  pink: palette.coral,
  yellow: palette.yellow,
  mint: palette.mint,
  purple: palette.purple,
  blue: palette.blue,
};

export interface FeedPostCardProps {
  post: FeedPost;
  liked: boolean;
  /** 표시할 좋아요 수(로컬 토글 반영값) */
  likeCount: number;
  /** 표시할 댓글 수(로컬 댓글 반영값) */
  commentCount: number;
  onToggleLike: () => void;
  /** 카드/댓글 아이콘 탭 → 글 상세(상세 화면에서는 생략) */
  onOpen?: () => void;
  /** 본문 전체 표시(상세 화면). 기본 false = 6줄 말줄임 */
  expanded?: boolean;
}

export function CommunityFeedPostCard({
  post,
  liked,
  likeCount,
  commentCount,
  onToggleLike,
  onOpen,
  expanded = false,
}: FeedPostCardProps) {
  const bg = post.bgTone ? POST_BG_TONES[post.bgTone] : colors.surface;
  const border = post.bgTone ? TONE_BORDER[post.bgTone] : colors.divider;
  const imageSource = post.imageUri ? { uri: post.imageUri } : post.image;
  const meta = [post.timeLabel, post.categoryLabel].filter(Boolean).join(' · ');

  const body = (
    <>
      <View style={styles.content}>
        <View style={styles.headRow}>
          <View style={styles.avatar}>
            {post.avatar != null ? (
              <Image source={post.avatar} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <AppText variant="body2" color={colors.primary}>
                {post.authorName.charAt(0)}
              </AppText>
            )}
          </View>
          <View style={styles.headText}>
            <AppText variant="body2" numberOfLines={1}>
              {post.authorName}
            </AppText>
            <AppText variant="small" muted numberOfLines={1}>
              {meta}
            </AppText>
          </View>
        </View>

        <AppText variant="body" numberOfLines={expanded ? undefined : 6}>
          {post.body}
        </AppText>

        {imageSource != null && (
          <Image
            source={imageSource}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel="첨부 사진"
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.reactions}>
          <Pressable
            onPress={onToggleLike}
            accessibilityRole="button"
            accessibilityLabel={`좋아요 ${likeCount}개`}
            accessibilityState={{ selected: liked }}
            hitSlop={spacing.md}
            style={({ pressed }) => [styles.reactionBtn, pressed && styles.pressed]}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={24}
              color={liked ? colors.accentCoral : colors.textPrimary}
            />
            <AppText variant="body" tabular>
              {likeCount}
            </AppText>
          </Pressable>

          <Pressable
            onPress={onOpen}
            disabled={onOpen == null}
            accessibilityRole="button"
            accessibilityLabel={`댓글 ${commentCount}개`}
            hitSlop={spacing.md}
            style={({ pressed }) => [styles.reactionBtn, pressed && onOpen != null && styles.pressed]}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
            <AppText variant="body" tabular>
              {commentCount}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.metaCol}>
          {post.tags.length > 0 && (
            <View style={styles.tags}>
              {post.tags.slice(0, 3).map((t) => (
                <Chip key={t} label={`# ${t}`} size="sm" />
              ))}
            </View>
          )}
          {post.rating != null && (
            <Stars value={post.rating} size={16} style={styles.stars} />
          )}
        </View>
      </View>
    </>
  );

  if (onOpen == null) {
    return <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${post.authorName}님의 글 자세히 보기`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bg, borderColor: border },
        pressed && styles.cardPressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderTopLeftRadius: BUBBLE_RADIUS,
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.96,
  },
  content: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
    gap: spacing.md,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // 좌상단 큰 라운드에 아바타가 걸리지 않게 살짝 안쪽으로
    marginLeft: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceInset,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
  },
  pressed: {
    opacity: 0.6,
  },
  metaCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    flexShrink: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  stars: {
    gap: 0,
  },
});
