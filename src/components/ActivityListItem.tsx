/**
 * ActivityListItem — 컴팩트 활동 행(홈 미리보기/마이 좋아요 목록) (v5).
 * 좌측 72px 실사진 썸네일(radius 10) + 제목/메타 + 우측 매칭% 빅넘버(tabular·그린).
 * 파스텔 아이콘 타일 폐기 — 사진이 곧 상품(실서비스 문법).
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppActivity } from '@/api/activities';
import { colors, radius, spacing } from '@/tokens';
import { AppText } from '@/ui';
import { formatPrice, formatRegion } from '@/utils/format';

import { CategoryBand } from './CategoryBand';

export interface ActivityListItemProps {
  activity: AppActivity;
  score?: number;
  onPress?: () => void;
}

export function ActivityListItem({ activity, score, onPress }: ActivityListItemProps) {
  const region = formatRegion(activity.regionSido, activity.regionSigungu);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${activity.title} 자세히 보기`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        <CategoryBand
          imageUrl={activity.imageUrl}
          category={activity.category}
          height={72}
          showLabel={false}
          glyphSize={24}
        />
      </View>

      <View style={styles.body}>
        <AppText variant="body" weight="semibold" numberOfLines={1}>
          {activity.title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1} tabular>
          {region} · {formatPrice(activity.price)}
        </AppText>
      </View>

      {score != null ? (
        <View style={styles.scoreWrap}>
          <AppText variant="title" weight="bold" color={colors.primary} tabular>
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
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
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
