/**
 * 활동 상세 — 매칭% + 요약 + 메타(지역/소요/참가비/강도) + 지도 미리보기 + 예약.
 * 예약: booking_url 있으면 외부 링크, 없으면(샘플/데모) 완료 상태를 목업으로 표시.
 */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';

import { fetchActivity, type AppActivity } from '@/api/activities';
import { categoryVisual } from '@/components/categoryVisual';
import { matchScore } from '@/core';
import { useTaste } from '@/hooks/useTaste';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Screen, ScreenHeader } from '@/ui';
import { formatDuration, formatIntensity, formatPrice, formatRegion } from '@/utils/format';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { taste } = useTaste();
  const [activity, setActivity] = useState<AppActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const a = id ? await fetchActivity(id) : null;
        if (mounted) setActivity(a);
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

  if (loading) {
    return (
      <Screen edges={['top', 'bottom']} noPadding>
        <ScreenHeader title="활동 상세" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!activity) {
    return (
      <Screen edges={['top', 'bottom']} noPadding>
        <ScreenHeader title="활동 상세" />
        <View style={styles.center}>
          <AppText variant="h2" center>
            활동을 찾을 수 없어요
          </AppText>
          <AppText variant="body" muted center style={styles.notFoundBody}>
            삭제되었거나 잠시 후 다시 시도해주세요.
          </AppText>
          <Button label="추천으로 돌아가기" variant="secondary" onPress={() => router.replace('/home')} />
        </View>
      </Screen>
    );
  }

  const visual = categoryVisual(activity.category);
  const score = taste ? matchScore(taste.vector, activity.vector) : null;
  const region = formatRegion(activity.regionSido, activity.regionSigungu);

  const onBook = async () => {
    if (activity.bookingUrl) {
      try {
        await Linking.openURL(activity.bookingUrl);
      } catch {
        setBooked(true);
      }
      return;
    }
    setBooked(true);
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      noPadding
      footer={
        booked ? (
          <View style={styles.bookedRow}>
            <AppText variant="bodyLg" weight="semibold" color={colors.success}>
              ✓ 예약이 완료되었어요
            </AppText>
            <Button label="추천으로 돌아가기" variant="secondary" onPress={() => router.replace('/home')} />
          </View>
        ) : (
          <Button label="예약하기" onPress={onBook} />
        )
      }
    >
      <ScreenHeader title="활동 상세" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.band, { backgroundColor: visual.accent }]}>
          {activity.imageUrl ? (
            <Image source={{ uri: activity.imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <AppText style={styles.emoji}>{visual.emoji}</AppText>
          )}
          {score != null && (
            <View style={styles.badgeOverlay}>
              <Badge label={`${score}% 잘 맞아요 · 취향 매칭`} tone="mint" />
            </View>
          )}
        </View>

        <View style={styles.body}>
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
                <Badge key={k} label={`#${k}`} tone="neutral" size="sm" />
              ))}
            </View>
          )}

          <View style={styles.metaGrid}>
            <MetaCell label="지역" value={region} />
            <MetaCell label="소요 시간" value={formatDuration(activity.durationMin)} />
            <MetaCell label="참가비" value={formatPrice(activity.price)} />
            <MetaCell label="활동 강도" value={formatIntensity(activity.intensity)} />
          </View>

          <View style={styles.section}>
            <AppText variant="title">위치</AppText>
            <Card padding="lg" elevation="soft" style={styles.mapCard}>
              <AppText style={styles.mapPin}>📍</AppText>
              <AppText variant="body" weight="semibold">
                {region}
              </AppText>
              <AppText variant="caption" muted>
                지도 미리보기는 준비 중이에요
              </AppText>
            </Card>
          </View>

          {activity.partnerName != null && (
            <AppText variant="caption" muted style={styles.partner}>
              제공 · {activity.partnerName}
            </AppText>
          )}
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
  band: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 84,
    lineHeight: 96,
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
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
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  mapPin: {
    fontSize: 32,
    lineHeight: 38,
  },
  partner: {
    marginTop: spacing.sm,
  },
  bookedRow: {
    gap: spacing.sm,
    alignItems: 'center',
  },
});
