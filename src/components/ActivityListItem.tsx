/**
 * ActivityListItem — 컴팩트 활동 행(홈 미리보기/마이 좋아요 목록).
 * 카테고리 스쿼클(틴트+잉크 글리프) + 제목/메타 + 우측 매칭% 빅넘버(tabular).
 * 토스식 행 해부: 좌 아이콘 칩 → 본문 → 우측 정렬 숫자.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppActivity } from '@/api/activities';
import { colors, radius, spacing } from '@/tokens';
import { AppText } from '@/ui';
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
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = activity.imageUrl != null && !imgFailed;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${activity.title} 자세히 보기`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.thumb, !showImage && { backgroundColor: visual.accent }]}>
        {showImage ? (
          <Image
            source={{ uri: activity.imageUrl! }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <MaterialCommunityIcons name={visual.icon} size={26} color={visual.ink} />
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
        <View style={styles.scoreWrap}>
          <AppText variant="title" weight="bold" color={colors.mintInk} tabular>
            {score}%
          </AppText>
          <AppText variant="caption" muted>
            잘맞음
          </AppText>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} style={styles.chevron} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  pressed: {
    opacity: 0.7,
  },
  thumb: {
    width: 52,
    height: 52,
    // 스쿼클(정원 금지 — 디자인 리서치) — 틴트 배경 + 잉크 글리프
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  scoreWrap: {
    alignItems: 'flex-end',
    gap: 0,
  },
  chevron: {
    paddingHorizontal: spacing.xs,
  },
});
