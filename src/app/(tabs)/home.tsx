/**
 * 홈 탭 — 대시보드. 인사 + 나의 여가 유형 + 오늘의 추천 미리보기 + 바로가기.
 * 데스크탑: [유형 카드 | 추천 미리보기] 2컬럼 대시보드.
 */
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { ActivityListItem } from '@/components/ActivityListItem';
import { SUB_TRAIT_META, TYPE_META } from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { colors, CONTENT_WIDTH, radius, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Divider, Logo, Screen } from '@/ui';

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
      <View style={styles.testIcon}>
        <AppText style={styles.testEmoji}>🧭</AppText>
      </View>
      <AppText variant="h2" center>
        성향 테스트로 시작해요
      </AppText>
      <AppText variant="body" muted center style={styles.typeTagline}>
        12개의 장면을 고르면 나에게 맞는 취미를 찾아드려요
      </AppText>
      <Button label="성향 테스트 하기" onPress={() => router.push('/test')} style={styles.typeBtn} />
    </Card>
  );

  const previewSection = (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="title">이런 활동 어때요?</AppText>
        <Button label="더 보기" variant="ghost" size="md" fullWidth={false} onPress={() => router.push('/reco')} />
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
      <View style={styles.header}>
        {/* 데스크탑은 사이드바에 로고가 있으므로 인사만 크게 */}
        {isDesktop ? (
          <AppText variant="h2">안녕하세요, {greetName}</AppText>
        ) : (
          <>
            <Logo size={26} />
            <AppText variant="body" muted>
              안녕하세요, {greetName}
            </AppText>
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
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
  testIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  testEmoji: {
    fontSize: 42,
    lineHeight: 50,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
