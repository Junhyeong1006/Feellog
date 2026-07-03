/**
 * CategoryBand — 활동/게시글의 사진 블록 (v5: 사진 우선 원칙).
 * 우선순위: 원격 imageUrl > 번들 카테고리 실사진 > 중립 글리프 밴드(최후 폴백).
 * 오버레이(그라데이션·배지·텍스트온포토)는 호출부가 얹는다 — 이 컴포넌트는 사진면만 책임.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/tokens';
import { AppText } from '@/ui';

import { categoryPhoto } from './categoryPhoto';
import { categoryVisual } from './categoryVisual';

export interface CategoryBandProps {
  imageUrl?: string | null;
  category?: string | null;
  /** 밴드 높이(부모가 지정) */
  height: number;
  /** 글리프 폴백일 때 카테고리 라벨 표시 */
  showLabel?: boolean;
  /** 글리프 폴백의 아이콘 크기(기본 34) */
  glyphSize?: number;
}

export function CategoryBand({
  imageUrl,
  category,
  height,
  showLabel = true,
  glyphSize = 34,
}: CategoryBandProps) {
  const [remoteFailed, setRemoteFailed] = useState(false);
  const bundled = categoryPhoto(category);

  // 컴포넌트가 다른 활동으로 재사용될 때(추천 피드) 이전 실패 상태가 새 이미지를 가리지 않게 리셋
  useEffect(() => {
    setRemoteFailed(false);
  }, [imageUrl]);

  if (imageUrl && !remoteFailed) {
    return (
      <View style={[styles.band, { height }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.fill}
          contentFit="cover"
          transition={150}
          placeholder={undefined}
          onError={() => setRemoteFailed(true)}
        />
      </View>
    );
  }

  if (bundled) {
    return (
      <View style={[styles.band, { height }]}>
        <Image source={bundled} style={styles.fill} contentFit="cover" transition={150} />
      </View>
    );
  }

  // 최후 폴백: 중립 글리프 밴드(사진이 없는 미지의 카테고리)
  const visual = categoryVisual(category);
  return (
    <View style={[styles.band, styles.fallback, { height }]}>
      <View style={styles.front}>
        <MaterialCommunityIcons name={visual.icon} size={glyphSize} color={colors.textSecondary} />
        {showLabel && category != null && (
          <AppText variant="body" weight="semibold" color={colors.textSecondary}>
            {category}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt, // 사진 로딩 전 플레이스홀더 면
    justifyContent: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
  },
  front: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
