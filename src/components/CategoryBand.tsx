/**
 * CategoryBand — 사진 없는 활동/게시글의 상단 밴드(이모지+파스텔 원 대체).
 * 문법: 틴트 배경 + 좌측 잉크 글리프·카테고리 라벨 + 우하단 대형 고스트 글리프(모서리 밖으로 잘리게).
 * '잘린 오버사이즈 그래픽'은 실서비스 배너의 표준 구도 — 부모 카드에 overflow:hidden 필수.
 * 이미지가 있으면 이미지 우선, 로드 실패 시 이 밴드로 폴백한다.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/tokens';
import { AppText } from '@/ui';

import { categoryVisual } from './categoryVisual';

export interface CategoryBandProps {
  imageUrl?: string | null;
  category?: string | null;
  /** 밴드 높이(부모가 지정) */
  height: number;
  /** 카테고리 라벨 표시(카드용 true, 좁은 썸네일 false) */
  showLabel?: boolean;
  /** 좌측 글리프 크기(기본 34) */
  glyphSize?: number;
}

export function CategoryBand({
  imageUrl,
  category,
  height,
  showLabel = true,
  glyphSize = 34,
}: CategoryBandProps) {
  const visual = categoryVisual(category);
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <View style={[styles.band, { height }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.fill}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  // 고스트 글리프: 밴드 높이에 비례(잘림이 핵심)
  const ghostSize = Math.round(height * 1.15);

  return (
    <View style={[styles.band, { height, backgroundColor: visual.accent }]}>
      <MaterialCommunityIcons
        name={visual.icon}
        size={ghostSize}
        color={visual.ink}
        style={[styles.ghost, { right: -ghostSize * 0.18, bottom: -ghostSize * 0.22 }]}
      />
      <View style={styles.front}>
        <MaterialCommunityIcons name={visual.icon} size={glyphSize} color={visual.ink} />
        {showLabel && category != null && (
          <AppText variant="body" weight="bold" color={visual.ink}>
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
    justifyContent: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  ghost: {
    position: 'absolute',
    opacity: 0.13,
  },
  front: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
