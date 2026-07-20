/**
 * 탭 내비게이션 (v6) — 메인 · 기록 · 소통 · 마이.
 * 디자인: 플로팅 라운드 탭바(흰 배경, 상단 라운드, 옅은 그림자),
 * 활성 탭 = 연블루 원형 필 + 블루 아이콘/라벨, 비활성 = 뉴트럴.
 *
 * 게이트: 부팅 디사이더(index)만으로는 딥링크(/home 직접 진입)를 못 막으므로
 * 여기서도 로그인/게스트를 검사한다(정적 export는 모든 라우트가 직접 진입 가능).
 */
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
/** expo-router Tabs가 넘겨주는 탭바 props의 최소 형태(BottomTabBarProps 로컬 정의 —
 * @react-navigation/bottom-tabs가 루트에 호이스팅되지 않아 타입만 직접 기술) */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

import { useAuth } from '@/providers/AuthProvider';
import { colors, MAX_CONTENT_WIDTH, radius, shadows, spacing } from '@/tokens';
import { AppText } from '@/ui';

const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = {
  home: { label: '메인', icon: 'home-outline', iconActive: 'home' },
  log: { label: '기록', icon: 'pencil-outline', iconActive: 'pencil' },
  community: { label: '소통', icon: 'people-outline', iconActive: 'people' },
  my: { label: '마이', icon: 'person-outline', iconActive: 'person' },
};

function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              style={styles.item}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={focused ? meta.iconActive : meta.icon}
                  size={24}
                  color={focused ? colors.primary : colors.textSecondary}
                />
              </View>
              <AppText
                variant="small"
                weight={focused ? 'bold' : 'regular'}
                color={focused ? colors.primary : colors.textSecondary}
              >
                {meta.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { loading, session, profileLoading, isAuthedOrGuest } = useAuth();

  // 인증 상태 파악 전에는 판단 보류(깜빡임/오리다이렉트 방지)
  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.gateLoading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!isAuthedOrGuest) return <Redirect href="/login" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: '메인' }} />
      <Tabs.Screen name="log" options={{ title: '기록' }} />
      <Tabs.Screen name="community" options={{ title: '소통' }} />
      <Tabs.Screen name="my" options={{ title: '마이' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  gateLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  barWrap: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...shadows.floating,
    // 웹앱 컬럼과 동일 폭으로 중앙 정렬
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  bar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minHeight: Platform.OS === 'web' ? 64 : 60,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primaryTint,
  },
});
