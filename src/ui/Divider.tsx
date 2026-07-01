/**
 * Divider — 얇은 구분선.
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/tokens';

export interface DividerProps {
  /** 위아래 여백 */
  gap?: keyof typeof spacing;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ gap, color = colors.border, style }: DividerProps) {
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: color },
        gap != null && { marginVertical: spacing[gap] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
