/**
 * CategoryImage — 활동/게시글 이미지 밴드 공용 렌더러.
 * 이미지가 없거나 "로드에 실패"하면 카테고리 이모지 폴백으로 전환한다
 * (깨진 URL이 빈 색면으로 남는 것 방지). 부모가 크기/배경을 결정한다.
 */
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/ui';

export interface CategoryImageProps {
  uri: string | null | undefined;
  /** 폴백 이모지(categoryVisual().emoji) */
  emoji: string;
  /** 폴백 이모지 크기(px) */
  emojiSize: number;
}

export function CategoryImage({ uri, emoji, emojiSize }: CategoryImageProps) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <AppText
        style={{ fontSize: emojiSize, lineHeight: Math.round(emojiSize * 1.15) }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {emoji}
      </AppText>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.fill}
      contentFit="cover"
      onError={() => setFailed(true)}
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
});
