/**
 * ActivityCard — 추천 피드의 활동 카드.
 * 상단 카테고리 밴드(이미지 없으면 고스트 글리프 밴드) + 매칭% 배지 + 제목/요약/태그/메타.
 * 메타는 Ionicons(위치/시간/가격), 태그는 8px 사각(#접두어 없음 — 형태 위계).
 * onPressDetail을 주면 카드 전체가 상세로 이동한다.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppActivity } from '@/api/activities';
import { colors, radius, shadows, spacing } from '@/tokens';
import { AppText, Badge } from '@/ui';
import { formatDuration, formatPrice, formatRegion } from '@/utils/format';

import { CategoryBand } from './CategoryBand';

export interface ActivityCardProps {
  activity: AppActivity;
  /** 매칭 점수(0~100) — 있으면 배지 표시 */
  score?: number;
  onPressDetail?: () => void;
  /** 밴드 높이 */
  bandHeight?: number;
}

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <AppText variant="caption" muted tabular>
        {label}
      </AppText>
    </View>
  );
}

export function ActivityCard({ activity, score, onPressDetail, bandHeight = 132 }: ActivityCardProps) {
  const region = formatRegion(activity.regionSido, activity.regionSigungu);

  const body = (
    <>
      <View>
        <CategoryBand imageUrl={activity.imageUrl} category={activity.category} height={bandHeight} />
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
              <Badge key={k} label={k} tone="neutral" size="sm" shape="square" />
            ))}
          </View>
        )}

        <View style={styles.metaRow}>
          <Meta icon="location-outline" label={region} />
          <Meta icon="time-outline" label={formatDuration(activity.durationMin)} />
          <Meta icon="cash-outline" label={formatPrice(activity.price)} />
        </View>

        {onPressDetail != null && (
          <View style={styles.detailLink}>
            <AppText variant="body" weight="semibold" color={colors.primaryInk}>
              자세히 보기
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryInk} />
          </View>
        )}
      </View>
    </>
  );

  if (onPressDetail) {
    return (
      <Pressable
        onPress={onPressDetail}
        accessibilityRole="button"
        accessibilityLabel={`${activity.title} 자세히 보기`}
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
    borderWidth: 1,
    borderColor: colors.borderOnWhite,
    overflow: 'hidden',
    ...shadows.raised,
  },
  pressed: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
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
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.sm,
  },
});
