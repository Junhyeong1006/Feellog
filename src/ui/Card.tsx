/**
 * Card — 흰 표면 + 헤어라인 보더 카드 (v5: 기본 그림자 없음).
 * 실서비스 실측: 콘텐츠 카드에 그림자를 주는 곳 0곳 — 경계는 보더가 담당(노안 대비감).
 * onPress를 주면 눌림/호버 피드백이 있는 Pressable로 동작한다(추천/활동 카드).
 * shadow/padding/radius를 prop으로 바꿀 수 있어 교체가 쉽다.
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
  /** 그림자 강도 (기본 none — 경계는 헤어라인 보더) */
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
  elevation = 'none',
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
    borderWidth: 1,
    borderColor: colors.borderOnWhite,
  },
  hovered: {
    transform: [{ translateY: -1 }],
    ...shadows.card,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
});
