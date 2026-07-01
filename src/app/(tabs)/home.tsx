/**
 * 홈 탭 — 대시보드. 인사 + 나의 여가 유형 + 오늘의 추천 미리보기 + 바로가기.
 */
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { ActivityListItem } from '@/components/ActivityListItem';
import { SUB_TRAIT_META, TYPE_META } from '@/core';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Divider, Logo, Screen } from '@/ui';

export default function HomeScreen() {
  const { profile, session, guest } = useAuth();
  const { taste } = useTaste();
  const { items, loading } = useRecommendations(3);
  const name = session ? displayNameOf(profile) : '회원님';

  const type = taste?.mainType ? TYPE_META[taste.mainType] : null;
  const sub = taste?.subTrait ? SUB_TRAIT_META[taste.subTrait] : null;

  return (
    <Screen edges={['top']} scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Logo size={26} />
        <AppText variant="body" muted>
          안녕하세요, {name}님
        </AppText>
      </View>

      {type ? (
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
      )}

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
