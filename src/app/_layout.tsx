import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/providers/AuthProvider';
import { colors } from '@/tokens';

/**
 * 루트 레이아웃.
 * GestureHandlerRootView(스와이프 카드 대비) → SafeAreaProvider → AuthProvider 순으로 감싼다.
 * 화면 전환은 헤더 없이 크림 배경으로 통일. 라우트별 화면은 파일 기반으로 자동 등록.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = { root: { flex: 1 } } as const;
