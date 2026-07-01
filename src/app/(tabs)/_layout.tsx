/**
 * 하단 탭 내비게이션 — 홈 · 추천 · 커뮤니티 · 마이.
 * 아이콘은 이모지(에셋 없이). 시니어를 위해 라벨/터치 영역을 넉넉히.
 */
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { colors, fontFamily } from '@/tokens';
import { AppText } from '@/ui';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <AppText style={[styles.icon, focused && styles.iconFocused]}>{emoji}</AppText>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
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
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'web' ? 68 : undefined,
    paddingTop: 6,
  },
  item: {
    paddingVertical: 4,
  },
  label: {
    fontFamily: fontFamily.base,
    fontSize: 12,
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
