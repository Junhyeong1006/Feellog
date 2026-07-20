/**
 * ScreenHeader — 상단 바 (v6 블루 DS).
 * 좌측: 원형 뒤로가기(흰 원 + 파랑 보더 + 파랑 화살표 — Figma Icon/Back 스타일, 48dp).
 * 중앙: 타이틀(Title 20/700). 우측: 슬롯(X·장바구니 등).
 * 뒤로 갈 곳이 없으면 홈으로 대체 이동.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';

import { AppText } from './Text';

export interface ScreenHeaderProps {
  title?: string;
  /** 뒤로가기 숨김 */
  hideBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, hideBack = false, onBack, right }: ScreenHeaderProps) {
  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {!hideBack && (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.titleWrap}>
        {title != null && (
          <AppText variant="title" numberOfLines={1}>
            {title}
          </AppText>
        )}
      </View>

      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  side: {
    minWidth: MIN_TOUCH_SIZE + spacing.sm,
    justifyContent: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  backBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
