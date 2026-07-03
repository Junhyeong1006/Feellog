/**
 * 추천 탭 — 오늘의 추천 카드 피드 (v5: 풀사진 카드).
 * 취향 벡터로 활동을 정렬해 한 장씩 보여주고, [좋아요]/[관심없어요]로 피드백을 준다.
 * "한 번에 한 장" 집중 UX는 시니어 선택 피로 감소라는 제품 원칙 — 데스크탑에서도 유지.
 * 진행(1/12)은 우측 필 배지로, 카드가 화면의 주인공.
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
import { colors, CONTENT_WIDTH, radius, spacing } from '@/tokens';
import { AppText, Button, Screen } from '@/ui';

export default function RecoScreen() {
  const { profile, session, guest } = useAuth();
  const { loading, current, total, index, filter, setFilter, regions, react, reset } = useReco();
  const { isDesktop } = useBreakpoint();
  const filtered = hasActiveFilter(filter);
  // 게스트를 '회원님'이라 부르지 않는다 — 호칭 없는 주어 생략형으로
  const name = session ? displayNameOf(profile) : null;
  const greetName = name == null ? null : name.endsWith('님') ? name : `${name}님`;
  const subtitle = greetName ? `${greetName}의 취향에 맞춰 골라봤어요` : '취향에 맞춰 골라봤어요';

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
        <View style={styles.headerRow}>
          <AppText variant="h1">오늘의 추천</AppText>
          {total > 0 && (
            <View style={styles.progressPill}>
              <AppText variant="caption" weight="bold" color={colors.textSecondary} tabular>
                {Math.min(index + 1, total)} / {total}
              </AppText>
            </View>
          )}
        </View>
        <AppText variant="body" muted>
          {subtitle}
        </AppText>
      </View>

      <RecoFilterBar filter={filter} regions={regions} onChange={setFilter} />

      {current ? (
        <View style={styles.cardWrap}>
          <ActivityCard
            activity={current.activity}
            score={current.score}
            bandHeight={isDesktop ? 520 : 440}
            onPressDetail={() => router.push(`/activity/${current.activity.id}`)}
          />
          {isDesktop && actions}
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
    gap: spacing.base,
  },
  header: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressPill: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    gap: spacing.base,
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
