/**
 * AppErrorBoundary — 렌더 중 예외를 잡아 시니어 친화 안내 + 다시 시도 버튼(S8).
 * 루트 _layout에서 expo-router의 ErrorBoundary export로 연결한다.
 */
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/tokens';
import { AppText, Button } from '@/ui';

export interface AppErrorFallbackProps {
  error: Error;
  retry: () => void;
}

export function AppErrorFallback({ error, retry }: AppErrorFallbackProps) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <AppText style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          🌧️
        </AppText>
        <AppText variant="h2" center>
          잠시 문제가 생겼어요
        </AppText>
        <AppText muted center style={styles.body}>
          불편을 드려 죄송해요.{'\n'}아래 버튼을 눌러 다시 시도해 주세요.
        </AppText>
        {__DEV__ && (
          <AppText variant="caption" muted style={styles.debug} numberOfLines={4}>
            {error.message}
          </AppText>
        )}
        <Button label="다시 시도" onPress={retry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  emoji: {
    fontSize: 56,
    lineHeight: 64,
    textAlign: 'center',
  },
  body: {
    lineHeight: 26,
  },
  debug: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
