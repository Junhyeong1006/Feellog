/**
 * 활동 상세 — 매칭% + 요약 + 메타(지역/소요/참가비/강도) + 지도 미리보기 + 예약.
 * 예약: booking_url 있으면 외부 링크, 없으면(샘플/데모) 완료 상태를 목업으로 표시.
 * 데스크탑: 본문(좌) + 예약·위치 레일(우) 2컬럼, 모바일: 세로 스택 + 하단 고정 예약 버튼.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { fetchActivity, type AppActivity } from '@/api/activities';
import { CategoryBand } from '@/components/CategoryBand';
import { matchScore } from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useTaste } from '@/hooks/useTaste';
import { colors, CONTENT_WIDTH, radius, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Screen, ScreenHeader } from '@/ui';
import { formatDuration, formatIntensity, formatPrice, formatRegion } from '@/utils/format';
import { openKakaoMapSearch } from '@/utils/maps';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { taste } = useTaste();
  const { isDesktop } = useBreakpoint();
  const [activity, setActivity] = useState<AppActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookError, setBookError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const a = id ? await fetchActivity(id) : null;
        if (mounted) {
          setActivity(a);
          if (a) track('activity_view', { activityId: a.id });
        }
      } catch {
        if (mounted) setActivity(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const maxWidth = isDesktop ? CONTENT_WIDTH.wide : undefined;

  if (loading) {
    return (
      <Screen edges={['top', 'bottom']} noPadding maxWidth={maxWidth}>
        <ScreenHeader title="활동 상세" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!activity) {
    return (
      <Screen edges={['top', 'bottom']} noPadding maxWidth={maxWidth}>
        <ScreenHeader title="활동 상세" />
        <View style={styles.center}>
          <AppText variant="h2" center>
            활동을 찾을 수 없어요
          </AppText>
          <AppText variant="body" muted center style={styles.notFoundBody}>
            삭제되었거나 잠시 후 다시 시도해주세요.
          </AppText>
          <Button label="추천으로 돌아가기" variant="secondary" onPress={() => router.replace('/reco')} />
        </View>
      </Screen>
    );
  }

  const score = taste ? matchScore(taste.vector, activity.vector) : null;
  const region = formatRegion(activity.regionSido, activity.regionSigungu);
  const mapQuery = `${activity.partnerName ?? activity.title} ${activity.regionSigungu ?? activity.regionSido ?? ''}`.trim();

  // 예약 링크가 없거나 열기 실패 시 절대 "완료"로 속이지 않는다(시니어 신뢰선)
  const onBook = async () => {
    if (!activity.bookingUrl) return;
    track('booking_click', { activityId: activity.id });
    setBookError(false);
    try {
      await Linking.openURL(activity.bookingUrl);
    } catch {
      setBookError(true);
    }
  };

  const onMap = () => {
    track('map_open', { activityId: activity.id });
    void openKakaoMapSearch(mapQuery);
  };

  const hero = (
    <View style={[styles.band, isDesktop && styles.bandDesk]}>
      <CategoryBand
        imageUrl={activity.imageUrl}
        category={activity.category}
        height={isDesktop ? 340 : 260}
        glyphSize={40}
      />
      {score != null && (
        <View style={styles.badgeOverlay}>
          <Badge label={`${score}% 잘 맞아요 · 취향 매칭`} tone="onPhoto" />
        </View>
      )}
    </View>
  );

  const mainInfo = (
    <>
      <AppText variant="h1" style={styles.title}>
        {activity.title}
      </AppText>
      {activity.summary != null && (
        <AppText variant="bodyLg" muted style={styles.summary}>
          {activity.summary}
        </AppText>
      )}

      {activity.keywords.length > 0 && (
        <View style={styles.chips}>
          {activity.keywords.map((k) => (
            <Badge key={k} label={k} tone="neutral" size="sm" shape="square" />
          ))}
        </View>
      )}

      <View style={styles.metaGrid}>
        <MetaCell label="지역" value={region} />
        <MetaCell label="소요 시간" value={formatDuration(activity.durationMin)} />
        <MetaCell label="참가비" value={formatPrice(activity.price)} />
        <MetaCell label="활동 강도" value={formatIntensity(activity.intensity)} />
      </View>

      {activity.partnerName != null && (
        <AppText variant="caption" muted style={styles.partner}>
          제공 · {activity.partnerName}
        </AppText>
      )}
    </>
  );

  const mapCard = (
    <View style={styles.section}>
      <AppText variant="title">위치</AppText>
      <Card padding="lg" elevation="soft" style={styles.mapCard}>
        <View style={styles.mapRow}>
          <Ionicons name="location-outline" size={22} color={colors.primaryInk} />
          <AppText variant="body" weight="semibold">
            {region}
          </AppText>
        </View>
        <Button
          label="카카오맵에서 보기"
          variant="secondary"
          onPress={onMap}
          style={styles.mapBtn}
          accessibilityLabel={`${activity.title} 위치를 카카오맵에서 보기`}
        />
      </Card>
    </View>
  );

  // 예약 CTA: 링크가 있으면 외부 예약, 없으면 다음 행동(위치 확인)을 버튼으로 제시
  // — 회색 안내문만 남기는 막다른 길 금지(적대적 리뷰: 시니어 퍼널)
  const bookingAction = activity.bookingUrl ? (
    <View style={styles.bookedRow}>
      <Button label="예약하기" onPress={onBook} />
      {bookError && (
        <AppText variant="caption" color={colors.danger} center>
          예약 페이지를 열지 못했어요. 잠시 후 다시 시도해 주세요.
        </AppText>
      )}
    </View>
  ) : (
    <View style={styles.bookedRow}>
      <Button
        label="카카오맵에서 위치 보기"
        onPress={onMap}
        accessibilityLabel={`${activity.title} 위치를 카카오맵에서 보기`}
      />
      <AppText variant="caption" muted center>
        온라인 예약은 준비 중이에요. 위치를 확인하고 방문해 보세요.
      </AppText>
    </View>
  );

  if (isDesktop) {
    return (
      <Screen edges={['top', 'bottom']} noPadding maxWidth={maxWidth}>
        <ScreenHeader title="활동 상세" />
        <ScrollView contentContainerStyle={[styles.content, styles.contentDesk]} showsVerticalScrollIndicator={false}>
          {hero}
          <View style={styles.columns}>
            <View style={styles.mainCol}>{mainInfo}</View>
            <View style={styles.rail}>
              <Card padding="lg" style={styles.bookCard}>
                <AppText variant="caption" muted>
                  참가비
                </AppText>
                <AppText variant="h2">{formatPrice(activity.price)}</AppText>
                {bookingAction}
              </Card>
              {mapCard}
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      noPadding
      footer={bookingAction}
    >
      <ScreenHeader title="활동 상세" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {hero}
        <View style={styles.body}>
          {mainInfo}
          {mapCard}
        </View>
      </ScrollView>
    </Screen>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="body" weight="semibold" style={styles.metaValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  notFoundBody: {
    marginBottom: spacing.sm,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  contentDesk: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.xl,
  },
  band: {},
  bandDesk: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  mainCol: {
    flex: 1,
    gap: spacing.base,
  },
  rail: {
    width: 300,
    gap: spacing.xl,
  },
  bookCard: {
    gap: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  title: {
    lineHeight: 40,
  },
  summary: {
    lineHeight: 29,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.xs,
  },
  metaValue: {
    marginTop: 2,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  mapCard: {
    gap: spacing.sm,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapBtn: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
  partner: {
    marginTop: spacing.sm,
  },
  bookedRow: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  noBooking: {
    lineHeight: 26,
    paddingVertical: spacing.sm,
  },
});
