import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/tokens';

/**
 * 루트 레이아웃. Phase 0에서는 단일 스택만 둔다.
 * Phase 1에서 온보딩/성향테스트/결과/홈(추천) 라우트를 추가한다.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SafeAreaProvider>
  );
}
