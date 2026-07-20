/**
 * Chip — 태그/필터 칩 (v6 블루 DS, '# 공방' 스타일).
 * 기본: 흰 필 + 파랑 보더 + 파랑 라벨(Figma 태그칩 r12). selected: 파랑 채움 + 흰 라벨.
 * onPress 없으면 표시 전용 View(게시글 해시태그). 있으면 Pressable + hitSlop으로 터치 48 확보.
 * size sm=태그(캡션 라벨, 시각 28~32) / md=필터·선택지(본문 라벨, 40).
 */
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';

import { AppText } from './Text';

export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  label: string;
  /** 파랑 채움 + 흰 라벨 (기본 false = 흰 필 + 파랑 보더/텍스트) */
  selected?: boolean;
  /** 없으면 표시 전용 태그로 렌더 */
  onPress?: () => void;
  /** sm=태그 칩(기본), md=필터/선택지 칩 */
  size?: ChipSize;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const VISUAL_HEIGHT: Record<ChipSize, number> = { sm: 28, md: 40 };

export function Chip({
  label,
  selected = false,
  onPress,
  size = 'sm',
  accessibilityLabel,
  style,
}: ChipProps) {
  const text = (
    <AppText
      variant={size === 'sm' ? 'small' : 'caption'}
      weight={selected ? 'bold' : 'medium'}
      color={selected ? colors.onPrimary : colors.primary}
    >
      {label}
    </AppText>
  );

  const boxStyle: StyleProp<ViewStyle> = [
    styles.chip,
    size === 'sm' ? styles.sm : styles.md,
    selected ? styles.selected : styles.idle,
    style,
  ];

  if (!onPress) {
    return (
      <View style={boxStyle} accessibilityLabel={accessibilityLabel ?? label}>
        {text}
      </View>
    );
  }

  const slop = Math.ceil((MIN_TOUCH_SIZE - VISUAL_HEIGHT[size]) / 2);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={Math.max(0, slop)}
      style={({ pressed }) => [...boxStyle, pressed && styles.pressed]}
    >
      {text}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sm: {
    minHeight: VISUAL_HEIGHT.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md, // Figma 태그칩 r12
  },
  md: {
    minHeight: VISUAL_HEIGHT.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  idle: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
