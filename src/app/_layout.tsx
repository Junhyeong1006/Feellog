import { Stack, usePathname, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorFallback } from '@/components/AppErrorBoundary';
import { track } from '@/lib/analytics';
import { AuthProvider } from '@/providers/AuthProvider';
import { FontScaleProvider } from '@/providers/FontScaleProvider';
import { colors } from '@/tokens';

// 소셜 로그인 팝업(웹) 콜백 처리를 위해 앱 로드 시 1회 호출.
// 리다이렉트된 팝업이 이 호출로 opener에 결과 URL을 postMessage하고 자동으로 닫힌다.
// (일반 창에서는 무해한 no-op). 네이티브에도 영향 없음.
WebBrowser.maybeCompleteAuthSession();

/** 렌더 예외 공통 폴백(S8) — 시니어 친화 안내 + 다시 시도. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <AppErrorFallback error={error} retry={retry} />;
}

/** 라우트 전환마다 페이지뷰 이벤트 적재(핵심 퍼널 분석용). */
function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track('page_view', { path: pathname });
  }, [pathname]);
  return null;
}

/**
 * 루트 레이아웃.
 * GestureHandlerRootView(스와이프 카드 대비) → SafeAreaProvider → FontScaleProvider(글씨 크기)
 * → AuthProvider 순으로 감싼다. 화면 전환은 헤더 없이 크림 배경으로 통일.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <FontScaleProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <PageViewTracker />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            />
          </AuthProvider>
        </FontScaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = { root: { flex: 1 } } as const;
