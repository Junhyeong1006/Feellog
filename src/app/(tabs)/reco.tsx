/**
 * 추천 탭 — 오늘의 추천 카드 피드.
 * 취향 벡터로 활동을 정렬해 한 장씩 보여주고, [좋아요]/[관심없어요]로 피드백을 준다.
 * "한 번에 한 장" 집중 UX는 시니어 선택 피로 감소라는 제품 원칙 — 데스크탑에서도 유지하되,
 * 카드를 키우고 버튼을 카드 바로 아래 인라인으로 배치한다.
 */
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { ActivityCard } from '@/components/ActivityCard';
import { EmptyState } from '@/components/EmptyState';
import { RecoFilterBar } from '@/components/RecoFilterBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useReco } from '@/hooks/useReco';
import { useAuth } from '@/providers/AuthProvider';
import { EMPTY_FILTER, hasActiveFilter } from '@/state/recoFilter';
import { colors, CONTENT_WIDTH, spacing } from '@/tokens';
import { AppText, Button, Screen } from '@/ui';

export default function RecoScreen() {
  const { profile, session, guest } = useAuth();
  const { loading, current, total, index, filter, setFilter, regions, react, reset } = useReco();
  const { isDesktop } = useBreakpoint();
  const filtered = hasActiveFilter(filter);
  const name = session ? displayNameOf(profile) : '회원님';
  // displayNameOf 폴백('회원님')에 호칭이 이미 붙어 있어 "회원님님"이 되지 않게 처리
  const greetName = name.endsWith('님') ? name : `${name}님`;

  const maxWidth = isDesktop ? CONTENT_WIDTH.focus : undefined;

  if (loading) {
    return (
      <Screen edges={['top']} maxWidth={maxWidth}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="body" muted style={styles.loadingText}>
            취향에 맞는 활동을 고르고 있어요…
          </AppText>
        </View>
      </Screen>
    );
  }

  const actions = current && (
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
  );

  return (
    <Screen
      edges={['top']}
      scroll
      maxWidth={maxWidth}
      contentStyle={styles.content}
      footer={isDesktop ? undefined : actions || undefined}
    >
      <View style={styles.header}>
        <AppText variant="h2">오늘의 추천</AppText>
        <AppText variant="bodyLg" muted style={styles.subtitle}>
          {greetName}의 취향에 맞춰 골라봤어요
        </AppText>
      </View>

      <RecoFilterBar filter={filter} regions={regions} onChange={setFilter} />

      {current ? (
        <View style={styles.cardWrap}>
          <ActivityCard
            activity={current.activity}
            score={current.score}
            bandHeight={isDesktop ? 280 : undefined}
            onPressDetail={() => router.push(`/activity/${current.activity.id}`)}
          />
          {isDesktop && actions}
          <AppText variant="caption" muted center style={styles.progress}>
            {Math.min(index + 1, total)} / {total}
          </AppText>
        </View>
      ) : filtered && total === 0 ? (
        <EmptyState
          spot="search"
          title="조건에 맞는 활동이 없어요"
          body={'지역이나 참가비 조건을\n조금 넓혀보시겠어요?'}
          action={<Button label="필터 초기화" variant="secondary" onPress={() => setFilter(EMPTY_FILTER)} />}
        />
      ) : (
        <EmptyState
          spot="compass"
          title="오늘의 추천을 다 봤어요"
          body={'좋아요로 남긴 취향은\n다음 추천에 바로 반영돼요'}
          action={
            <>
              <Button label="다시 보기" variant="secondary" onPress={reset} />
              {guest && !session && (
                <Button label="로그인하고 저장하기" variant="ghost" onPress={() => router.replace('/login')} />
              )}
            </>
          }
        />
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
    gap: spacing.base,
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
});
