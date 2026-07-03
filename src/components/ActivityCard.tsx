/**
 * ActivityCard — 추천 피드의 활동 카드 (v5: 풀사진 카드).
 * 사진이 카드의 전부(실서비스 문법: 사진 면적 60~75%) — 하단 그라데이션 딤 위에
 * 카테고리·제목·요약·메타를 텍스트온포토로. 매칭 배지는 좌상단 흰 필.
 * onPressDetail을 주면 카드 전체가 상세로 이동하며, 우하단 '자세히 보기' 필로
 * 진입 단서를 명시한다(시니어 UX — 탭 가능함이 보여야 한다).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppActivity } from '@/api/activities';
import { colors, palette, photoOverlay, radius, shadows, spacing } from '@/tokens';
import { AppText, Badge } from '@/ui';
import { formatDuration, formatPrice, formatRegion } from '@/utils/format';

import { CategoryBand } from './CategoryBand';

export interface ActivityCardProps {
  activity: AppActivity;
  /** 매칭 점수(0~100) — 있으면 배지 표시 */
  score?: number;
  onPressDetail?: () => void;
  /** 사진 높이 */
  bandHeight?: number;
}

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={colors.onPhotoSoft} />
      <AppText variant="caption" color={colors.onPhotoSoft} weight="semibold" tabular>
        {label}
      </AppText>
    </View>
  );
}

export function ActivityCard({ activity, score, onPressDetail, bandHeight = 420 }: ActivityCardProps) {
  const region = formatRegion(activity.regionSido, activity.regionSigungu);

  const body = (
    <View>
      <CategoryBand imageUrl={activity.imageUrl} category={activity.category} height={bandHeight} />

      {/* 하단 그라데이션 딤 + 텍스트온포토 — 텍스트 시작점(0.55)부터 0.45 딤 확보(AA) */}
      <LinearGradient colors={photoOverlay.bottom} locations={[0.32, 0.55, 1]} style={styles.dim} />
      <View style={styles.copy}>
        {activity.category != null && (
          <AppText variant="caption" weight="bold" color={colors.onPhotoSoft}>
            {activity.category}
          </AppText>
        )}
        <AppText variant="h2" color={colors.onPhoto} numberOfLines={2} style={styles.title}>
          {activity.title}
        </AppText>
        {activity.summary != null && (
          <AppText variant="caption" color={colors.onPhotoSoft} numberOfLines={1} style={styles.summary}>
            {activity.summary}
          </AppText>
        )}
        <View style={styles.metaRow}>
          <Meta icon="location-outline" label={region} />
          <Meta icon="time-outline" label={formatDuration(activity.durationMin)} />
          <Meta icon="cash-outline" label={formatPrice(activity.price)} />
        </View>

        {onPressDetail != null && (
          <View style={styles.detailChip}>
            <AppText variant="caption" weight="bold" color={palette.ink}>
              자세히 보기
            </AppText>
            <Ionicons name="chevron-forward" size={15} color={palette.ink} />
          </View>
        )}
      </View>

      {score != null && (
        <View style={styles.badgeOverlay}>
          <Badge label={`${score}% 잘 맞아요`} tone="onPhoto" />
        </View>
      )}
    </View>
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
    borderRadius: radius.xl,
    overflow: 'hidden',
    // 그림자는 배경색이 있어야 안드로이드에서도 렌더된다
    backgroundColor: colors.surface,
    // 사진 히어로 카드는 그림자 허용 예외(떠 있는 주인공 1장)
    ...shadows.card,
  },
  pressed: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  copy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    gap: 3,
  },
  title: {
    marginTop: 1,
  },
  summary: {
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailChip: {
    // 메타 행과 겹치지 않게 자기 행을 차지(우측 정렬)
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
  },
});
