/**
 * 탭 내비게이션 — 홈 · 추천 · 커뮤니티 · 마이.
 * 모바일(기본): 하단 탭바. 데스크탑 웹(≥1024px): 좌측 사이드바 + 탭바 숨김.
 * 같은 <Tabs> 내비게이터를 유지한 채 크롬만 바꿔서 리사이즈해도 화면 상태가 보존된다.
 * 아이콘은 이모지(에셋 없이). 시니어를 위해 라벨/터치 영역을 넉넉히.
 *
 * 게이트: 부팅 디사이더(index)만으로는 딥링크(/home 직접 진입)를 못 막으므로
 * 여기서도 로그인/게스트·필수 동의를 검사한다(정적 export는 모든 라우트가 직접 진입 가능).
 */
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Sidebar } from '@/components/Sidebar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/providers/AuthProvider';
import { useFontScale } from '@/providers/FontScaleProvider';
import { colors, fontFamily } from '@/tokens';
import { AppText } from '@/ui';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <AppText style={[styles.icon, focused && styles.iconFocused]}>{emoji}</AppText>;
}

export default function TabsLayout() {
  const { isDesktop } = useBreakpoint();
  const { loading, session, profile, profileLoading, isAuthedOrGuest } = useAuth();
  const { scale } = useFontScale();
  // '앱 전체 글씨' 약속 이행 — 탭 라벨도 스케일(내비 폭 보호를 위해 1.3배 캡)
  const labelSize = Math.round(15 * Math.min(scale, 1.3));

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
            // 활성 라벨은 잉크 블루(작은 글자에서 원색 blue500은 AA 미달)
            tabBarActiveTintColor: colors.primaryInk,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: styles.bar,
            tabBarLabelStyle: [styles.label, { fontSize: labelSize }],
            tabBarItemStyle: styles.item,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{ title: '홈', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
          />
          <Tabs.Screen
            name="reco"
            options={{ title: '추천', tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} /> }}
          />
          <Tabs.Screen
            name="community"
            options={{
              title: '커뮤니티',
              tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="my"
            options={{ title: '마이', tabBarIcon: ({ focused }) => <TabIcon emoji="🙂" focused={focused} /> }}
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
    // fontSize는 위에서 폰트스케일 반영(기본 15 — 캡션 하한 준수)
    fontWeight: '600',
    marginBottom: Platform.OS === 'web' ? 6 : 2,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  iconFocused: {
    transform: [{ scale: 1.12 }],
  },
});
