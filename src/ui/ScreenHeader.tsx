/**
 * ScreenHeader — 상단 바(뒤로가기 + 제목 + 우측 슬롯).
 * 뒤로 갈 곳이 없으면 홈으로 대체 이동. 시니어 터치 영역 확보.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/tokens';

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
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  side: {
    minWidth: 48,
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
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
