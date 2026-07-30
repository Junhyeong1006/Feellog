/**
 * 소통 탭 (Figma 518-999 게시글 / 522-796 친구).
 * 헤더(Feellog 로고 + 장바구니) → 세그먼트 탭 [게시글|친구].
 * 게시글: 후기쓰기/글쓰기 버튼 + 피드(SAMPLE_POSTS + 내가 쓴 로컬 글 병합, 좋아요 로컬 토글).
 * 친구: 친구 찾기 검색 + SAMPLE_FRIENDS 리스트(말풍선 → 채팅방) + 친구 추가 FAB(준비중 시트).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { figmaAssets } from '@/assets/figmaAssets';
import { CommunityFeedPostCard } from '@/components/community_FeedPostCard';
import { FeellogLogo } from '@/components/FeellogLogo';
import { SAMPLE_FRIENDS, SAMPLE_POSTS, type SampleFriend } from '@/data/sampleSocial';
import { useCart } from '@/hooks/useCollections';
import { useFontScale } from '@/providers/FontScaleProvider';
import {
  useLocalComments,
  useLocalPosts,
  usePostLikes,
  type FeedPost,
} from '@/state/localPosts';
import {
  colors,
  fontFamily,
  MAX_CONTENT_WIDTH,
  MIN_TOUCH_SIZE,
  palette,
  radius,
  spacing,
  typography,
} from '@/tokens';
import { AppText, Button, Screen, SegmentedTabs } from '@/ui';

/** 친구 카드 말풍선 색 사이클(시안: 노랑 → 파랑 → 회색) */
const BUBBLE_COLORS = [palette.yellow, palette.blue, colors.textMuted];

export default function CommunityScreen() {
  const [tab, setTab] = useState(0);

  return (
    <Screen edges={['top']} noPadding>
      <View style={styles.header}>
        <FeellogLogo width={110} />
        <CartButton />
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedTabs tabs={['게시글', '친구']} activeIndex={tab} onChange={setTab} />
      </View>

      {tab === 0 ? <PostsFeed /> : <FriendsList />}
    </Screen>
  );
}

/** 헤더 장바구니 원형 버튼(수량 배지) */
function CartButton() {
  const { count } = useCart();
  return (
    <Pressable
      onPress={() => router.push('/cart')}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `장바구니, ${count}개 담김` : '장바구니'}
      style={({ pressed }) => [styles.cartBtn, pressed && styles.pressedDim]}
    >
      <Image source={figmaAssets.icons.cart} style={styles.cartIcon} contentFit="contain" />
      {count > 0 && (
        <View style={styles.cartBadge}>
          <AppText variant="small" weight="bold" color={colors.onPrimary} tabular>
            {count > 9 ? '9+' : count}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

// ── 게시글 탭 ──

function PostsFeed() {
  const { posts: localPosts, loading } = useLocalPosts();
  const { isLiked, toggle } = usePostLikes();
  const { countOf } = useLocalComments();

  // 내 글(최신순) 먼저, 샘플은 그 뒤에 원래 순서대로
  const feed: FeedPost[] = useMemo(() => [...localPosts, ...SAMPLE_POSTS], [localPosts]);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.feedContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.writeRow}>
        <Button
          label="후기쓰기"
          variant="chipAction"
          size="md"
          onPress={() => router.push('/community/review')}
        />
        <Button
          label="글쓰기"
          variant="chipAction"
          size="md"
          onPress={() => router.push('/community/compose')}
        />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        feed.map((post) => (
          <CommunityFeedPostCard
            key={post.id}
            post={post}
            liked={isLiked(post.id)}
            likeCount={post.likeCount + (isLiked(post.id) ? 1 : 0)}
            commentCount={post.commentCount + countOf(post.id)}
            onToggleLike={() => void toggle(post.id)}
            onOpen={() => router.push(`/community/${post.id}`)}
          />
        ))
      )}
    </ScrollView>
  );
}

// ── 친구 탭 ──

function FriendsList() {
  const { scale } = useFontScale();
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const friends = useMemo(() => {
    const q = query.trim();
    if (!q) return SAMPLE_FRIENDS;
    return SAMPLE_FRIENDS.filter((f) => f.nickname.includes(q));
  }, [query]);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.friendsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="친구 찾기"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="친구 찾기"
            style={[
              styles.searchInput,
              scale !== 1 && { fontSize: Math.round(typography.caption.fontSize * scale) },
            ]}
          />
        </View>

        {friends.length === 0 ? (
          <AppText variant="body" muted center style={styles.emptyNote}>
            {`'${query.trim()}' 닉네임의 친구를 찾지 못했어요.`}
          </AppText>
        ) : (
          friends.map((f, i) => <FriendRow key={f.id} friend={f} index={i} />)
        )}
      </ScrollView>

      <Pressable
        onPress={() => setSheetOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="친구 추가"
        style={({ pressed }) => [styles.fab, pressed && styles.pressedDim]}
      >
        <Ionicons name="add" size={32} color={colors.primary} />
      </Pressable>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setSheetOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <AppText variant="title" center>
              친구 추가
            </AppText>
            <AppText variant="body" muted center>
              아직 준비 중인 기능이에요.{'\n'}곧 닉네임으로 친구를 찾고 초대할 수 있어요.
            </AppText>
            <Button label="확인" size="md" onPress={() => setSheetOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FriendRow({ friend, index }: { friend: SampleFriend; index: number }) {
  const bubbleColor = BUBBLE_COLORS[index % BUBBLE_COLORS.length];
  const subtitle =
    friend.typeLabel ??
    (friend.isGroup && friend.memberCount != null ? `멤버 ${friend.memberCount}명` : '');
  const name =
    friend.isGroup && friend.memberCount != null
      ? `${friend.nickname} 외 ${Math.max(friend.memberCount - 1, 0)}명`
      : friend.nickname;

  return (
    <View style={styles.friendCard}>
      <View style={styles.friendAvatar}>
        {friend.avatar != null ? (
          <Image source={friend.avatar} style={styles.friendAvatarImg} contentFit="cover" />
        ) : (
          <Ionicons name="people" size={24} color={colors.primary} />
        )}
      </View>

      <View style={styles.friendText}>
        <AppText variant="body2" numberOfLines={1}>
          {name}
        </AppText>
        {subtitle !== '' && (
          <AppText variant="caption" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>

      {friend.chatId != null && (
        <Pressable
          // 채팅 화면 라우트는 별도 구현 — typed routes 생성 전이라 Href 캐스팅
          onPress={() => router.push(`/chat/${friend.chatId}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`${friend.nickname}와 채팅하기`}
          style={({ pressed }) => [styles.chatBtn, pressed && styles.pressedDim]}
        >
          <Ionicons name="chatbubble" size={28} color={bubbleColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  cartBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    width: 20,
    height: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
  },
  pressedDim: {
    opacity: 0.7,
  },
  // 게시글 탭
  feedContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  writeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  loading: {
    paddingVertical: spacing.xxl,
  },
  // 친구 탭
  friendsContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.huge + spacing.xxl, // FAB에 마지막 카드가 가리지 않게
    gap: spacing.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_SIZE,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  emptyNote: {
    paddingVertical: spacing.xxl,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  friendAvatarImg: {
    width: '100%',
    height: '100%',
  },
  friendText: {
    flex: 1,
    gap: 2,
  },
  chatBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
});
