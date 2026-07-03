/**
 * 탭 내비게이션 — 홈 · 추천 · 커뮤니티 · 마이.
 * 모바일(기본): 하단 탭바. 데스크탑 웹(≥1024px): 좌측 사이드바 + 탭바 숨김.
 * 같은 <Tabs> 내비게이터를 유지한 채 크롬만 바꿔서 리사이즈해도 화면 상태가 보존된다.
 * 시니어를 위해 라벨/터치 영역을 넉넉히.
 *
 * 게이트: 부팅 디사이더(index)만으로는 딥링크(/home 직접 진입)를 못 막으므로
 * 여기서도 로그인/게스트·필수 동의를 검사한다(정적 export는 모든 라우트가 직접 진입 가능).
 */
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { Sidebar } from '@/components/Sidebar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/providers/AuthProvider';
import { useFontScale } from '@/providers/FontScaleProvider';
import { colors, fontFamily } from '@/tokens';

/** 활성=filled / 비활성=outline 스왑(색 변화 + 형태 변화 이중 신호 — 저시력 대응) */
function TabIcon({
  name,
  focused,
  color,
}: {
  name: 'home' | 'sparkles' | 'chatbubbles' | 'person';
  focused: boolean;
  color: ColorValue;
}) {
  return <Ionicons name={focused ? name : (`${name}-outline` as const)} size={26} color={color} />;
}

export default function TabsLayout() {
  const { isDesktop } = useBreakpoint();
  const { loading, session, profile, profileLoading, isAuthedOrGuest } = useAuth();
  const { scale } = useFontScale();
  // '앱 전체 글씨' 약속 이행 — 탭 라벨도 스케일(내비 폭 보호를 위해 1.3배 캡)
  const labelSize = Math.round(16 * Math.min(scale, 1.3));

  // 인증 상태 파악 전에는 판단 보류(깜빡임/오리다이렉트 방지)
  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.gateLoading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!isAuthedOrGuest) return <Redirect href="/login" />;
  if (session && profile && !profile.consented_at) return <Redirect href="/consent" />;

  return (
    <View style={styles.row}>
      {isDesktop && <Sidebar />}
      <View style={styles.content}>
        <Tabs
          tabBar={isDesktop ? () => null : undefined}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primaryInk,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: styles.bar,
            tabBarLabelStyle: [styles.label, { fontSize: labelSize }],
            tabBarItemStyle: styles.item,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: '홈',
              tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
            }}
          />
          <Tabs.Screen
            name="reco"
            options={{
              title: '추천',
              tabBarIcon: ({ focused, color }) => <TabIcon name="sparkles" focused={focused} color={color} />,
            }}
          />
          <Tabs.Screen
            name="community"
            options={{
              title: '커뮤니티',
              tabBarIcon: ({ focused, color }) => <TabIcon name="chatbubbles" focused={focused} color={color} />,
            }}
          />
          <Tabs.Screen
            name="my"
            options={{
              title: '마이',
              tabBarIcon: ({ focused, color }) => <TabIcon name="person" focused={focused} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gateLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'web' ? 74 : undefined,
    paddingTop: 6,
  },
  item: {
    paddingVertical: 4,
  },
  label: {
    fontFamily: fontFamily.base,
    // fontSize는 위에서 폰트스케일 반영(기본 16 — 캡션 하한 준수)
    fontWeight: '600',
    marginBottom: Platform.OS === 'web' ? 6 : 2,
  },
});
