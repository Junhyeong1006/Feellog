/**
 * Card — 흰 표면 + 부드러운 그림자 카드.
 * onPress를 주면 눌림 피드백이 있는 Pressable로 동작한다(추천/활동 카드).
 * shadow/padding/radius를 prop으로 바꿀 수 있어 교체가 쉽다.
 */
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius as radiusToken, shadows, spacing, type ShadowToken } from '@/tokens';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** 그림자 강도 (기본 card) */
  elevation?: ShadowToken;
  /** 내부 패딩(기본 lg=20) */
  padding?: keyof typeof spacing;
  /** 모서리 둥글기(기본 xl=20) */
  cornerRadius?: keyof typeof radiusToken;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  elevation = 'card',
  padding = 'lg',
  cornerRadius = 'xl',
  accessibilityLabel,
  style,
}: CardProps) {
  const base: StyleProp<ViewStyle> = [
    styles.card,
    { padding: spacing[padding], borderRadius: radiusToken[cornerRadius] },
    shadows[elevation],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [base, pressed && styles.pressed]}
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
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
});
