/**
 * ActivityListItem — 컴팩트 활동 행(홈 미리보기/마이 좋아요 목록).
 * 카테고리 이모지 썸네일 + 제목 + 지역·참가비(또는 매칭%). 탭하면 상세로.
 */
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppActivity } from '@/api/activities';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Badge } from '@/ui';
import { formatPrice, formatRegion } from '@/utils/format';

import { categoryVisual } from './categoryVisual';

export interface ActivityListItemProps {
  activity: AppActivity;
  score?: number;
  onPress?: () => void;
}

export function ActivityListItem({ activity, score, onPress }: ActivityListItemProps) {
  const visual = categoryVisual(activity.category);
  const region = formatRegion(activity.regionSido, activity.regionSigungu);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${activity.title} 상세보기`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.thumb, { backgroundColor: visual.accent }]}>
        {activity.imageUrl ? (
          <Image source={{ uri: activity.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <AppText style={styles.emoji}>{visual.emoji}</AppText>
        )}
      </View>

      <View style={styles.body}>
        <AppText variant="body" weight="semibold" numberOfLines={1}>
          {activity.title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {region} · {formatPrice(activity.price)}
        </AppText>
      </View>

      {score != null ? (
        <Badge label={`${score}%`} tone="mint" size="sm" />
      ) : (
        <AppText style={styles.chevron} color={colors.textMuted}>
          ›
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  chevron: {
    fontSize: 26,
    lineHeight: 30,
    paddingHorizontal: spacing.xs,
  },
});
