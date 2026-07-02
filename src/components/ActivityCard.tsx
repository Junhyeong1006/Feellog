/**
 * ActivityCard — 추천 피드의 활동 카드.
 * 상단 이미지 밴드(이미지 없으면 카테고리 이모지) + 매칭% 배지 + 제목/요약/키워드/메타.
 * onPressDetail을 주면 카드 전체가 상세로 이동한다.
 */
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppActivity } from '@/api/activities';
import { colors, radius, shadows, spacing } from '@/tokens';
import { AppText, Badge } from '@/ui';
import { formatDuration, formatPrice, formatRegion } from '@/utils/format';

import { categoryVisual } from './categoryVisual';

export interface ActivityCardProps {
  activity: AppActivity;
  /** 매칭 점수(0~100) — 있으면 배지 표시 */
  score?: number;
  onPressDetail?: () => void;
  /** 밴드 높이 */
  bandHeight?: number;
}

export function ActivityCard({ activity, score, onPressDetail, bandHeight = 150 }: ActivityCardProps) {
  const visual = categoryVisual(activity.category);
  const region = formatRegion(activity.regionSido, activity.regionSigungu);

  const body = (
    <>
      <View style={[styles.band, { height: bandHeight, backgroundColor: visual.accent }]}>
        {activity.imageUrl ? (
          <Image source={{ uri: activity.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <AppText style={styles.emoji}>{visual.emoji}</AppText>
        )}
        {score != null && (
          <View style={styles.badgeOverlay}>
            <Badge label={`${score}% 잘 맞아요`} tone="mint" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <AppText variant="h2" numberOfLines={2}>
          {activity.title}
        </AppText>
        {activity.summary != null && (
          <AppText variant="body" muted numberOfLines={2} style={styles.summary}>
            {activity.summary}
          </AppText>
        )}

        {activity.keywords.length > 0 && (
          <View style={styles.chips}>
            {activity.keywords.slice(0, 4).map((k) => (
              <Badge key={k} label={`#${k}`} tone="neutral" size="sm" />
            ))}
          </View>
        )}

        <View style={styles.metaRow}>
          <AppText variant="caption" muted>
            📍 {region}
          </AppText>
          <AppText variant="caption" muted>
            ⏱ {formatDuration(activity.durationMin)}
          </AppText>
          <AppText variant="caption" muted>
            💳 {formatPrice(activity.price)}
          </AppText>
        </View>

        {onPressDetail != null && (
          <AppText variant="body" weight="semibold" color={colors.primaryInk} style={styles.detailLink}>
            상세보기 ›
          </AppText>
        )}
      </View>
    </>
  );

  if (onPressDetail) {
    return (
      <Pressable
        onPress={onPressDetail}
        accessibilityRole="button"
        accessibilityLabel={`${activity.title} 상세보기`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.raised,
  },
  pressed: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },
  band: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 68,
    lineHeight: 78,
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summary: {
    lineHeight: 26,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  detailLink: {
    marginTop: spacing.sm,
  },
});
