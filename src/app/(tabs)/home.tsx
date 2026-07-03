/**
 * 홈 탭 — 대시보드 (v5). 인사 + 유형 사진 배너 + 오늘의 추천(사진 썸네일 리스트) + 안내.
 * 유형 카드는 흰 카드+버튼 대신 유형 대표 실사진 배너(좌→우 딤, 텍스트온포토).
 * 데스크탑: 배너 풀폭 + 추천은 리스트 대신 그대로(읽기 리듬 유지).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { ActivityListItem } from '@/components/ActivityListItem';
import { HERO_PHOTOS, typePhoto } from '@/components/categoryPhoto';
import { SUB_TRAIT_META, TYPE_META } from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { colors, CONTENT_WIDTH, photoOverlay, radius, spacing } from '@/tokens';
import { AppText, Divider, Screen } from '@/ui';

/** '7월 3일 목요일' — 홈 아이브로용 날짜 라벨 */
function todayLabel(): string {
  const now = new Date();
  const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${day}요일`;
}

export default function HomeScreen() {
  const { profile, session, guest } = useAuth();
  const { taste } = useTaste();
  const { isDesktop } = useBreakpoint();
  const { items, loading } = useRecommendations(isDesktop ? 4 : 3);
  // 게스트를 '회원님'이라 부르지 않는다(같은 화면의 둘러보기 안내와 모순 — 적대적 리뷰)
  const name = session ? displayNameOf(profile) : null;
  // displayNameOf 폴백('회원님')에 호칭이 이미 붙어 있어 "회원님님"이 되지 않게 처리
  const greetName = name == null ? null : name.endsWith('님') ? name : `${name}님`;
  const greeting = greetName ? `${greetName},\n오늘은 뭘 해볼까요?` : '반가워요,\n오늘은 뭘 해볼까요?';

  const type = taste?.mainType ? TYPE_META[taste.mainType] : null;
  const sub = taste?.subTrait ? SUB_TRAIT_META[taste.subTrait] : null;

  // 유형 배너: 진단 완료 → 유형 대표 사진 + 추천 이동 / 미진단 → 히어로 사진 + 테스트 유도
  const bannerPhoto = taste?.mainType ? typePhoto(taste.mainType) : HERO_PHOTOS.walk;
  const bannerEyebrow = type ? '나의 여가 유형' : '2분이면 충분해요';
  const bannerTitle = type ? type.label : '성향 테스트로 시작해요';
  const bannerBody = type
    ? (sub ? `보조 성향 · ${sub.label}` : type.tagline)
    : '12개의 질문에 답하면 나에게 맞는 취미가 보여요';
  const bannerCta = type ? '추천 보러 가기' : '성향 테스트 하기';
  const bannerHref = type ? '/reco' : '/test';

  const typeBanner = (
    <Pressable
      onPress={() => router.push(bannerHref)}
      accessibilityRole="button"
      accessibilityLabel={`${bannerTitle} — ${bannerCta}`}
      style={({ pressed }) => [styles.banner, isDesktop && styles.bannerDesk, pressed && styles.bannerPressed]}
    >
      <Image source={bannerPhoto} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient
        colors={photoOverlay.banner}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bannerCopy}>
        <AppText variant="caption" weight="bold" color={colors.onPhotoSoft}>
          {bannerEyebrow}
        </AppText>
        <AppText variant={isDesktop ? 'h1' : 'h2'} color={colors.onPhoto} style={styles.bannerTitle}>
          {bannerTitle}
        </AppText>
        <AppText variant="caption" color={colors.onPhotoSoft} numberOfLines={2}>
          {bannerBody}
        </AppText>
        <View style={styles.bannerCta}>
          <AppText variant="caption" weight="bold" color={colors.primary}>
            {bannerCta}
          </AppText>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );

  const previewSection = (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="h2">이런 활동 어때요?</AppText>
        <Pressable
          onPress={() => router.push('/reco')}
          accessibilityRole="button"
          accessibilityLabel="추천 전체보기"
          hitSlop={10}
          style={({ pressed }) => [styles.seeAll, pressed && styles.seeAllPressed]}
        >
          <AppText variant="caption" weight="bold" color={colors.primary}>
            전체보기
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.previewLoading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length > 0 ? (
        <View>
          {items.map((item, i) => (
            <View key={item.activity.id}>
              {i > 0 && <Divider />}
              <ActivityListItem
                activity={item.activity}
                score={item.score}
                onPress={() => router.push(`/activity/${item.activity.id}`)}
              />
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="body" muted style={styles.previewEmpty}>
          추천할 활동을 준비 중이에요
        </AppText>
      )}
    </View>
  );

  return (
    <Screen
      edges={['top']}
      scroll
      maxWidth={isDesktop ? CONTENT_WIDTH.wide : undefined}
      contentStyle={styles.content}
    >
      {/* 에디토리얼 헤더: 아이브로(날짜) + 좌정렬 볼드 인사 */}
      <View style={styles.header}>
        <AppText variant="caption" muted>
          {todayLabel()}
        </AppText>
        <AppText variant="h1" style={styles.greeting}>
          {greeting}
        </AppText>
      </View>

      {typeBanner}
      {previewSection}

      {guest && !session && (
        <AppText variant="caption" muted center style={styles.guestNote}>
          지금은 둘러보기 상태예요. 로그인하면 좋아요와 추천이 저장돼요.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  greeting: {
    lineHeight: 36,
  },
  banner: {
    height: 176,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bannerDesk: {
    height: 220,
  },
  bannerPressed: {
    opacity: 0.96,
  },
  bannerCopy: {
    padding: spacing.lg,
    gap: 3,
    maxWidth: 420,
  },
  bannerTitle: {
    marginVertical: 2,
  },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.md,
    minHeight: 40,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 48,
    paddingHorizontal: spacing.xs,
  },
  seeAllPressed: {
    opacity: 0.6,
  },
  previewLoading: {
    paddingVertical: spacing.xl,
  },
  previewEmpty: {
    paddingVertical: spacing.lg,
  },
  guestNote: {
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
});
