/**
 * 탭 내비게이션 — 홈 · 추천 · 커뮤니티 · 마이.
 * 모바일(기본): 하단 탭바. 데스크탑 웹(≥1024px): 좌측 사이드바 + 탭바 숨김.
 * 같은 <Tabs> 내비게이터를 유지한 채 크롬만 바꿔서 리사이즈해도 화면 상태가 보존된다.
 * 아이콘은 이모지(에셋 없이). 시니어를 위해 라벨/터치 영역을 넉넉히.
 */
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { Sidebar } from '@/components/Sidebar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, fontFamily } from '@/tokens';
import { AppText } from '@/ui';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <AppText style={[styles.icon, focused && styles.iconFocused]}>{emoji}</AppText>;
}

export default function TabsLayout() {
  const { isDesktop } = useBreakpoint();

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
            tabBarLabelStyle: styles.label,
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
    fontSize: 15, // 캡션 하한(15px) 준수 — 시니어 가독성 플로어
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
