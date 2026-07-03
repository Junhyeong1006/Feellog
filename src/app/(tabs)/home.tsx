/**
 * 홈 탭 — 대시보드. 인사 + 나의 여가 유형 + 오늘의 추천 미리보기 + 바로가기.
 * 데스크탑: [유형 카드 | 추천 미리보기] 2컬럼 대시보드.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { ActivityListItem } from '@/components/ActivityListItem';
import { BrandMark } from '@/components/BrandMark';
import { SUB_TRAIT_META, TYPE_META } from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { colors, CONTENT_WIDTH, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Divider, Screen } from '@/ui';

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
  const name = session ? displayNameOf(profile) : '회원님';
  // displayNameOf 폴백('회원님')에 호칭이 이미 붙어 있어 "회원님님"이 되지 않게 처리
  const greetName = name.endsWith('님') ? name : `${name}님`;

  const type = taste?.mainType ? TYPE_META[taste.mainType] : null;
  const sub = taste?.subTrait ? SUB_TRAIT_META[taste.subTrait] : null;

  const typeCard = type ? (
    <Card padding="xl" style={styles.typeCard}>
      <AppText variant="caption" muted>
        나의 여가 유형
      </AppText>
      <AppText variant="h2">{type.label}</AppText>
      {sub && <Badge label={`보조 성향 · ${sub.label}`} tone="mint" />}
      <AppText variant="body" muted style={styles.typeTagline}>
        {type.tagline}
      </AppText>
      <Button label="추천 보러 가기" onPress={() => router.push('/reco')} style={styles.typeBtn} />
    </Card>
  ) : (
    <Card padding="xl" style={styles.typeCard}>
      <BrandMark size={56} />
      <AppText variant="h2">성향 테스트로 시작해요</AppText>
      <AppText variant="body" muted style={styles.typeTagline}>
        12개의 장면을 고르면{'\n'}나에게 맞는 취미를 찾아드려요
      </AppText>
      <Button label="성향 테스트 하기" onPress={() => router.push('/test')} style={styles.typeBtn} />
    </Card>
  );

  const previewSection = (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="title">이런 활동 어때요?</AppText>
        <Pressable
          onPress={() => router.push('/reco')}
          accessibilityRole="button"
          accessibilityLabel="추천 전체보기"
          hitSlop={10}
          style={({ pressed }) => [styles.seeAll, pressed && styles.seeAllPressed]}
        >
          <AppText variant="body" weight="semibold" color={colors.primaryInk}>
            전체보기
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryInk} />
        </Pressable>
      </View>

      <Card padding="lg" elevation="soft">
        {loading ? (
          <View style={styles.previewLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : items.length > 0 ? (
          items.map((item, i) => (
            <View key={item.activity.id}>
              {i > 0 && <Divider gap="xs" />}
              <ActivityListItem
                activity={item.activity}
                score={item.score}
                onPress={() => router.push(`/activity/${item.activity.id}`)}
              />
            </View>
          ))
        ) : (
          <AppText variant="body" muted center style={styles.previewEmpty}>
            추천할 활동을 준비 중이에요
          </AppText>
        )}
      </Card>
    </View>
  );

  return (
    <Screen
      edges={['top']}
      scroll
      maxWidth={isDesktop ? CONTENT_WIDTH.dashboard : undefined}
      contentStyle={styles.content}
    >
      {/* 에디토리얼 헤더: 아이브로(날짜) + 좌정렬 볼드 인사 — 로고는 로그인/사이드바 전용 */}
      <View style={styles.header}>
        <AppText variant="caption" muted>
          {todayLabel()}
        </AppText>
        <AppText variant="h1" style={styles.greeting}>
          {greetName},{'\n'}오늘은 뭘 해볼까요?
        </AppText>
      </View>

      {isDesktop ? (
        <View style={styles.columns}>
          <View style={styles.leftCol}>{typeCard}</View>
          <View style={styles.rightCol}>{previewSection}</View>
        </View>
      ) : (
        <>
          {typeCard}
          {previewSection}
        </>
      )}

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
    lineHeight: 38,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 2,
  },
  rightCol: {
    flex: 3,
  },
  typeCard: {
    gap: spacing.sm,
  },
  typeTagline: {
    lineHeight: 26,
  },
  typeBtn: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
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
