/**
 * 클래스 상세 (Figma 559-3774) — v6 블루 DS.
 * 플로팅 뒤로가기 → 사진 히어로 → 태그칩 → 제목/평점 → 가격·소요시간·난이도 3분할
 * → 소개 카드 → 위치(지도 placeholder + 카카오맵) → 후기 → 하단 찜·장바구니·예약 CTA.
 * 예약은 온라인 미지원 — 준비중 시트로 정직하게 안내(BookingSheet).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// NOTE: '@/assets/*'는 tsconfig에서 루트 assets/로 매핑돼 '@/assets/figmaAssets'가
// 타입 해석에 실패한다(전 화면 공통 이슈). 자체 정합을 위해 상대 경로로 가져온다.
import { figmaAssets } from '../../assets/figmaAssets';
import { BookingSheet } from '@/components/activity_BookingSheet';
import type { Activity } from '@/core';
import { ACTIVITY_SEED } from '@/data/activitySeed';
import {
  demoDifficulty,
  demoDurationMin,
  demoPhoto,
  demoPrice,
  demoRating,
  demoRegion,
  demoTags,
  formatDuration,
  formatPrice,
} from '@/data/activityDisplay';
import { useCart, useWishlist } from '@/hooks/useCollections';
import { track } from '@/lib/analytics';
import { colors, radius, shadows, spacing } from '@/tokens';
import { AppText, Button, Card, Chip, Screen, Stars } from '@/ui';
import { openKakaoMapSearch } from '@/utils/maps';

// 'cart_add'는 아직 AnalyticsEvent 유니온에 없다(analytics.ts는 소유권 밖 파일).
// 런타임은 문자열 이벤트를 그대로 적재하므로 동작에는 문제 없음 — 유니온 추가는 todo.
const CART_ADD_EVENT = 'cart_add';

/** id → 안정 해시(후기 데모 결정적 생성용 — activityDisplay와 동일 방식) */
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 카테고리별 소개 보강 문구(데모) — summary 뒤에 이어붙여 상세 소개를 만든다 */
const CATEGORY_INTRO: Record<string, string> = {
  요리: '재료 손질부터 완성까지 차근차근 따라 하다 보면 어느새 근사한 결과물이 완성됩니다.',
  수공예: '차분한 분위기 속에서 재료를 손끝으로 만지며 나만의 작품을 완성해보세요.',
  미술: '잘 그리지 않아도 괜찮아요. 선 하나, 색 하나에 집중하는 시간 자체가 힐링이 됩니다.',
  플라워: '계절의 꽃과 초록을 가까이 두는 것만으로도 일상의 공기가 달라집니다.',
  뷰티: '나를 가꾸는 손길 하나하나가 자신감이 되어 돌아옵니다.',
  액티비티: '몸을 움직이며 쌓인 긴장을 풀고, 함께하는 사람들과 활력을 나눠보세요.',
  음악: '소리에 귀 기울이며 연주하다 보면 마음이 차분히 정돈됩니다.',
  라이프스타일: '작은 습관 하나가 일상의 결을 바꿉니다. 부담 없이 시작해보세요.',
  정규: '꾸준히 이어가는 정규 과정으로, 회차를 거듭할수록 깊어지는 즐거움을 느낄 수 있습니다.',
};

function introOf(a: Activity): string {
  const enrich = CATEGORY_INTRO[a.category] ?? '';
  return `${a.summary}. ${enrich} 지친 일상에서 벗어나 오롯이 나에게 집중하는 시간을 선사합니다.`;
}

/** 데모 후기 — 활동 id 기반 결정적 생성(닉네임·별점·본문) */
const REVIEW_NAMES = ['보라도리뚜비', '재현', '민수엄마', '햇살가득', '정원지기', '새벽커피', '구름산책', '소소한하루'];
const REVIEW_BODIES = [
  '선생님이 너무 친절하시고 공간 분위기가 너무 좋았어요. 처음이었는데 예쁘게 완성해서 만족합니다!',
  '데이트 코스로 추천해요. 조용하게 집중할 수 있어서 힐링되는 시간이었어요.',
  '설명이 차분하고 자세해서 따라가기 쉬웠어요. 완성물을 집에 가져오니 뿌듯하네요.',
  '두 시간이 금방 지나갔어요. 다음에는 친구랑 같이 오려고 합니다.',
  '초보도 부담 없이 즐길 수 있었어요. 공간도 깨끗하고 아늑합니다.',
  '혼자 갔는데도 어색하지 않게 챙겨주셔서 좋았어요. 또 방문하고 싶어요.',
];

interface DemoReview {
  name: string;
  stars: number;
  body: string;
}

function demoReviews(a: Activity): DemoReview[] {
  const h = hashOf(a.id);
  return Array.from({ length: 4 }, (_, i) => ({
    name: REVIEW_NAMES[(h + i * 3) % REVIEW_NAMES.length],
    stars: 5 - ((h + i) % 2),
    body: REVIEW_BODIES[(h + i) % REVIEW_BODIES.length],
  }));
}

const CART_TOAST_MS = 2200;

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useMemo(() => ACTIVITY_SEED.find((a) => a.id === id) ?? null, [id]);

  const { isWished, toggle } = useWishlist();
  const { count: cartCount, add: addToCart } = useCart();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [cartToast, setCartToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activity) track('activity_view', { activityId: activity.id });
  }, [activity?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      if (toastTimer.current != null) clearTimeout(toastTimer.current);
    },
    [],
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  if (!activity) {
    return (
      <Screen scroll contentStyle={styles.notFound}>
        <FloatingBack onPress={goBack} />
        <View style={styles.notFoundBody}>
          <AppText variant="h3" center>
            클래스를 찾을 수 없어요
          </AppText>
          <AppText variant="body" muted center>
            삭제되었거나 주소가 바뀌었을 수 있어요.
          </AppText>
          <Button label="홈으로 가기" onPress={() => router.replace('/home')} style={styles.notFoundBtn} />
        </View>
      </Screen>
    );
  }

  const rating = demoRating(activity);
  const tags = demoTags(activity);
  const region = demoRegion(activity);
  const address = `${region} 123-45 2층`;
  const reviews = demoReviews(activity);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2);
  const wished = isWished(activity.id);
  // 시드 활동은 카테고리 대표 실사진, 그 외(미래 실데이터)는 상세 히어로 기본 사진
  const heroSource = ACTIVITY_SEED.includes(activity)
    ? demoPhoto(activity)
    : figmaAssets.photos.classDetailHero;

  const onOpenMap = () => {
    track('map_open', { activityId: activity.id });
    void openKakaoMapSearch(`${region} ${activity.name}`);
  };

  const onWish = () => {
    void toggle(activity.id);
  };

  const onCartAdd = () => {
    void addToCart(activity.id);
    track(CART_ADD_EVENT, { activityId: activity.id });
    setCartToast(true);
    if (toastTimer.current != null) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setCartToast(false), CART_TOAST_MS);
  };

  const onBook = () => {
    track('booking_click', { activityId: activity.id });
    setSheetOpen(true);
  };

  const footer = (
    <View>
      {cartToast && (
        <Pressable
          onPress={() => router.push('/cart')}
          accessibilityRole="button"
          accessibilityLabel="장바구니에 담았어요. 장바구니 보러 가기"
          style={styles.toast}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
          <AppText variant="caption" weight="bold" color={colors.onPrimary}>
            담았어요 · 장바구니 보기
          </AppText>
        </Pressable>
      )}

      <View style={styles.footerRow}>
        <Pressable
          onPress={onWish}
          accessibilityRole="button"
          accessibilityLabel={wished ? '찜 해제하기' : '찜하기'}
          accessibilityState={{ selected: wished }}
          style={({ pressed }) => [styles.circleBtn, styles.wishBtn, pressed && styles.pressed]}
        >
          <Ionicons name={wished ? 'heart' : 'heart-outline'} size={26} color={colors.accentCoral} />
        </Pressable>

        <Pressable
          onPress={onCartAdd}
          accessibilityRole="button"
          accessibilityLabel="장바구니에 담기"
          style={({ pressed }) => [styles.circleBtn, styles.cartBtn, pressed && styles.pressed]}
        >
          <Ionicons name="cart-outline" size={26} color={colors.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <AppText variant="small" weight="bold" color={colors.onPrimary} tabular>
                {cartCount}
              </AppText>
            </View>
          )}
        </Pressable>

        <View style={styles.ctaWrap}>
          <Button label="예약하러 가기" onPress={onBook} accessibilityLabel={`${activity.title} 예약하러 가기`} />
        </View>
      </View>
    </View>
  );

  return (
    <Screen scroll footer={footer} contentStyle={styles.content}>
      <FloatingBack onPress={goBack} />

      {/* 히어로 사진 */}
      <Image
        source={heroSource}
        style={styles.hero}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`${activity.title} 대표 사진`}
      />

      {/* 태그 칩 */}
      <View style={styles.tagRow}>
        {tags.map((t) => (
          <Chip key={t} label={`# ${t}`} size="sm" />
        ))}
      </View>

      {/* 제목 + 평점 */}
      <View style={styles.titleBlock}>
        <AppText variant="h3">{activity.title}</AppText>
        <View style={styles.ratingRow}>
          <Stars value={rating.rating} size={20} />
          <AppText variant="caption" weight="bold" tabular>
            {rating.rating.toFixed(1)}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            ({rating.count}개의 후기)
          </AppText>
        </View>
      </View>

      {/* 가격 · 소요시간 · 난이도 3분할 */}
      <View style={styles.metaRow}>
        <MetaCell label="가격" value={formatPrice(demoPrice(activity))} />
        <View style={styles.metaDivider} />
        <MetaCell label="소요시간" value={formatDuration(demoDurationMin(activity))} />
        <View style={styles.metaDivider} />
        <MetaCell label="난이도" value={demoDifficulty(activity)} />
      </View>

      {/* 소개 카드 */}
      <Card padding="base" cornerRadius="lg">
        <AppText variant="body">{introOf(activity)}</AppText>
      </Card>

      {/* 위치 */}
      <View style={styles.section}>
        <AppText variant="title">위치</AppText>
        <Pressable
          onPress={onOpenMap}
          accessibilityRole="button"
          accessibilityLabel={`${activity.title} 위치를 카카오맵에서 보기 — ${address}`}
          style={({ pressed }) => [styles.mapCard, pressed && styles.pressed]}
        >
          <View style={styles.mapImageWrap}>
            <Image source={figmaAssets.photos.mapWishlist} style={styles.mapImage} contentFit="cover" />
            <View style={styles.mapOpenPill}>
              <Ionicons name="map-outline" size={14} color={colors.primary} />
              <AppText variant="small" weight="bold" color={colors.primary}>
                카카오맵 열기
              </AppText>
            </View>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <AppText variant="body">{address}</AppText>
          </View>
        </Pressable>
      </View>

      {/* 후기 */}
      <View style={styles.section}>
        <View style={styles.reviewHead}>
          <AppText variant="title">후기 {rating.count}개</AppText>
          <Pressable
            onPress={() => setShowAllReviews((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showAllReviews ? '후기 접기' : '후기 전체보기'}
            hitSlop={spacing.md}
            style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
          >
            <AppText variant="caption" color={colors.primary}>
              {showAllReviews ? '접기' : '전체보기'}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.reviewList}>
          {visibleReviews.map((r, i) => (
            <Card
              key={`${r.name}-${i}`}
              background={colors.surfaceInset}
              bordered={false}
              elevation="none"
              cornerRadius="xl"
              padding="base"
            >
              <View style={styles.reviewTop}>
                <AppText variant="body2">{r.name}</AppText>
                <Stars value={r.stars} size={16} />
              </View>
              <AppText variant="body" muted style={styles.reviewBody}>
                {r.body}
              </AppText>
            </Card>
          ))}
        </View>
      </View>

      <BookingSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onOpenMap={onOpenMap} />
    </Screen>
  );
}

/** 플로팅 원형 뒤로가기 — Figma 60x60 흰 원 + 파랑 스트로크 */
function FloatingBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="뒤로가기"
      style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
    >
      <Ionicons name="arrow-back" size={28} color={colors.primary} />
    </Pressable>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="body" tabular>
        {value}
      </AppText>
    </View>
  );
}

const BACK_SIZE = 60;
const CIRCLE_SIZE = 50;

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  backBtn: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  hero: {
    width: '100%',
    aspectRatio: 320 / 193,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceInset,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  metaCell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  mapCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  mapImageWrap: {
    height: 105,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOpenPill: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.base,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.xxl,
  },
  seeAll: {
    minHeight: spacing.xxl,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  reviewList: {
    gap: spacing.md,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewBody: {
    lineHeight: 26,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  circleBtn: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  wishBtn: {
    backgroundColor: colors.background,
    borderColor: colors.accentCoral,
  },
  cartBtn: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.primary,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  ctaWrap: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: -(CIRCLE_SIZE + spacing.xs),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: spacing.xxxl,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    backgroundColor: colors.textPrimary,
    ...shadows.floating,
  },
  pressed: {
    opacity: 0.8,
  },
  notFound: {
    paddingTop: spacing.md,
    gap: spacing.base,
  },
  notFoundBody: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.huge,
  },
  notFoundBtn: {
    marginTop: spacing.md,
  },
});
