/**
 * Input — 텍스트 입력 프리미티브 (v6 블루 DS, Figma 로그인 220-4609 정본).
 * r8 · bg neutral50 · border neutral300 1px · placeholder SUIT 300/16 neutral400 · 라벨 없음.
 * 포커스 시 파랑 보더(Figma Input stroke focus), error 시 코랄 보더 + 코랄 placeholder/텍스트.
 * multiline 지원(글쓰기·후기 본문). 폰트 배율(FontScaleProvider) 반영.
 */
import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps as RNTextInputProps,
  type TextStyle,
} from 'react-native';

import { useFontScale } from '@/providers/FontScaleProvider';
import { colors, fontFamily, MIN_TOUCH_SIZE, radius, spacing, typography } from '@/tokens';

export interface InputProps extends RNTextInputProps {
  /** 오류 상태 — 코랄 보더 + 코랄 placeholder/텍스트 */
  error?: boolean;
  style?: StyleProp<TextStyle>;
}

export function Input({
  error = false,
  multiline = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { scale } = useFontScale();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const textColor = error ? colors.danger : colors.textPrimary;
  const placeholderColor = error ? colors.danger : colors.textMuted;

  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={placeholderColor}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          borderColor,
          color: textColor,
          fontSize: Math.round(typography.body.fontSize * scale),
          lineHeight: Math.round(typography.body.lineHeight * scale),
        },
        multiline && styles.multiline,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    alignSelf: 'stretch',
    minHeight: Math.max(MIN_TOUCH_SIZE, 52), // Figma 276x52
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.background, // neutral50
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.base,
    fontWeight: typography.body.fontWeight, // SUIT 300
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
