/**
 * Stars — 별점 (v6 블루 DS. 노랑 #FAC342 = colors.accentYellow 토큰).
 * 표시 모드: value 0~5(반개 지원) — 채움 별/반 별/빈 별(outline).
 * 입력 모드: onChange를 주면 큰 별 + 별마다 터치 48 확보(후기 작성).
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_SIZE, spacing } from '@/tokens';

const MAX_STARS = 5;

export interface StarsProps {
  /** 0~5 (표시 모드에선 소수 허용 — 반 별로 렌더) */
  value: number;
  /** 주면 입력 모드: 별 탭 → 1~5 콜백 */
  onChange?: (next: number) => void;
  /** 별 아이콘 크기(px). 기본: 표시 20 / 입력 36 */
  size?: number;
  /** 채움 색 override(기본 accentYellow #FAC342) */
  color?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

type StarShape = 'star' | 'star-half' | 'star-outline';

function shapeAt(index: number, value: number): StarShape {
  if (value >= index + 0.75) return 'star';
  if (value >= index + 0.25) return 'star-half';
  return 'star-outline';
}

export function Stars({
  value,
  onChange,
  size,
  color = colors.accentYellow,
  accessibilityLabel,
  style,
}: StarsProps) {
  const interactive = onChange != null;
  const iconSize = size ?? (interactive ? 36 : 20);
  const clamped = Math.max(0, Math.min(MAX_STARS, value));

  if (!interactive) {
    return (
      <View
        style={[styles.row, style]}
        accessibilityLabel={accessibilityLabel ?? `별점 5점 만점에 ${clamped}점`}
      >
        {Array.from({ length: MAX_STARS }).map((_, i) => (
          <Ionicons key={i} name={shapeAt(i, clamped)} size={iconSize} color={color} />
        ))}
      </View>
    );
  }

  const pad = Math.max(0, Math.ceil((MIN_TOUCH_SIZE - iconSize) / 2));
  return (
    <View
      style={[styles.row, style]}
      accessibilityLabel={accessibilityLabel ?? `별점 선택, 현재 ${Math.round(clamped)}점`}
    >
      {Array.from({ length: MAX_STARS }).map((_, i) => (
        <Pressable
          key={i}
          onPress={() => onChange(i + 1)}
          accessibilityRole="button"
          accessibilityLabel={`${i + 1}점`}
          accessibilityState={{ selected: clamped >= i + 1 }}
          style={({ pressed }) => [{ padding: pad }, pressed && styles.pressed]}
        >
          <Ionicons
            name={clamped >= i + 0.75 ? 'star' : 'star-outline'}
            size={iconSize}
            color={color}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
