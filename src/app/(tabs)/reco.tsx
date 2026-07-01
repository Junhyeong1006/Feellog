/**
 * 추천 탭 — 오늘의 추천 카드 피드.
 * 취향 벡터로 활동을 정렬해 한 장씩 보여주고, [좋아요]/[관심없어요]로 피드백을 준다.
 */
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { ActivityCard } from '@/components/ActivityCard';
import { useReco } from '@/hooks/useReco';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Button, Screen } from '@/ui';

export default function RecoScreen() {
  const { profile, session, guest } = useAuth();
  const { loading, current, total, index, react, reset } = useReco();
  const name = session ? displayNameOf(profile) : '회원님';

  if (loading) {
    return (
      <Screen edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="body" muted style={styles.loadingText}>
            취향에 맞는 활동을 고르고 있어요…
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top']}
      scroll
      contentStyle={styles.content}
      footer={
        current ? (
          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <Button
                label="관심없어요"
                variant="outline"
                onPress={() => react(current, false)}
                accessibilityLabel="이 활동 관심없어요"
              />
            </View>
            <View style={styles.actionItem}>
              <Button
                label="좋아요"
                variant="primary"
                onPress={() => react(current, true)}
                accessibilityLabel="이 활동 좋아요"
              />
            </View>
          </View>
        ) : undefined
      }
    >
      <View style={styles.header}>
        <AppText variant="h2">오늘의 추천</AppText>
        <AppText variant="bodyLg" muted style={styles.subtitle}>
          {name}님의 취향에 맞춰 골라봤어요
        </AppText>
      </View>

      {current ? (
        <View style={styles.cardWrap}>
          <ActivityCard
            activity={current.activity}
            score={current.score}
            onPressDetail={() => router.push(`/activity/${current.activity.id}`)}
          />
          <AppText variant="caption" muted center style={styles.progress}>
            {Math.min(index + 1, total)} / {total}
          </AppText>
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <AppText style={styles.emptyEmoji}>🎉</AppText>
          </View>
          <AppText variant="h2" center>
            오늘의 추천을 다 봤어요
          </AppText>
          <AppText variant="bodyLg" muted center style={styles.emptyBody}>
            좋아요한 활동은 마이페이지에서{'\n'}다시 볼 수 있어요
          </AppText>
          <Button label="다시 보기" variant="secondary" onPress={reset} style={styles.resetBtn} />
          {guest && !session && (
            <Button
              label="로그인하고 저장하기"
              variant="ghost"
              onPress={() => router.replace('/login')}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    marginTop: spacing.xs,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  subtitle: {
    lineHeight: 27,
  },
  cardWrap: {
    gap: spacing.sm,
  },
  progress: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionItem: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 46,
    lineHeight: 54,
  },
  emptyBody: {
    lineHeight: 28,
  },
  resetBtn: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
