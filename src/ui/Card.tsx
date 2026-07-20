/**
 * Card — 흰 표면 카드 (v6 블루 DS).
 * r12~20(기본 lg=16) + neutral300 헤어라인 보더 + shadows.card(옅은 드롭섀도, Figma Shadow-1 계열).
 * 후기 카드처럼 회색 인셋 면이 필요하면 background로 바꾸고 bordered={false}.
 * onPress를 주면 눌림/호버 피드백이 있는 Pressable로 동작한다(추천/활동 카드).
 */
import {
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius as radiusToken, shadows, spacing, type ShadowToken } from '@/tokens';

/** react-native-web은 hovered 상태를 지원하지만 RN 타입에는 없어 확장해 읽는다 */
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** 그림자 강도 (기본 card) */
  elevation?: ShadowToken;
  /** 내부 패딩(기본 base=16 — Figma 카드 내부 16px) */
  padding?: keyof typeof spacing;
  /** 모서리 둥글기(기본 lg=16. 12~20 범위 권장) */
  cornerRadius?: keyof typeof radiusToken;
  /** 헤어라인 보더(기본 true — neutral300) */
  bordered?: boolean;
  /** 표면색 override (기본 neutral0 흰 카드) */
  background?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  elevation = 'card',
  padding = 'base',
  cornerRadius = 'lg',
  bordered = true,
  background = colors.surface,
  accessibilityLabel,
  style,
}: CardProps) {
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      padding: spacing[padding],
      borderRadius: radiusToken[cornerRadius],
      backgroundColor: background,
    },
    bordered && styles.bordered,
    shadows[elevation],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={(state) => {
          const { pressed, hovered } = state as WebPressableState;
          return [base, hovered && !pressed && styles.hovered, pressed && styles.pressed];
        }}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={base} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  hovered: {
    transform: [{ translateY: -1 }],
    ...shadows.cta,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
});
