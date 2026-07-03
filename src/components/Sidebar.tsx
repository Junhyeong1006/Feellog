/**
 * Sidebar — 데스크탑 웹 전용 좌측 내비게이션(모바일 하단 탭의 와이드 대응).
 * 로고 → 메뉴 4개(홈·추천·커뮤니티·마이) → 하단 사용자/로그인 영역.
 * (tabs)/_layout.tsx에서 isDesktop일 때만 렌더된다.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native';
import { Image } from 'expo-image';

/** react-native-web hovered 상태(RN 타입에 없어 확장) */
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

import { displayNameOf } from '@/api/profiles';
import { TYPE_META } from '@/core';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, SIDEBAR_WIDTH, spacing } from '@/tokens';
import { AppText, Button, Logo } from '@/ui';

interface NavDef {
  href: Href;
  path: string;
  icon: 'home' | 'sparkles' | 'chatbubbles' | 'person';
  label: string;
}

const NAV_ITEMS: NavDef[] = [
  { href: '/home', path: '/home', icon: 'home', label: '홈' },
  { href: '/reco', path: '/reco', icon: 'sparkles', label: '추천' },
  { href: '/community', path: '/community', icon: 'chatbubbles', label: '커뮤니티' },
  { href: '/my', path: '/my', icon: 'person', label: '마이' },
];

function NavItem({ item, active, onPress }: { item: NavDef; active: boolean; onPress: () => void }) {
  // Link asChild는 함수형 style을 무시하므로(활성 pill/행 배치가 깨짐) Pressable + router로 이동한다.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      style={(state) => {
        const { pressed, hovered } = state as WebPressableState;
        return [
          styles.navItem,
          hovered && !active && styles.navItemHovered,
          active && styles.navItemActive,
          pressed && styles.navItemPressed,
        ];
      }}
    >
      {/* 활성 표시는 색+굵기+채움+좌측 바 다중 신호(색맹/저시력 대응) */}
      {active && <View style={styles.activeBar} />}
      <Ionicons
        name={active ? item.icon : (`${item.icon}-outline` as const)}
        size={24}
        color={active ? colors.primaryInk : colors.textSecondary}
      />
      <AppText
        variant="body"
        weight={active ? 'bold' : 'semibold'}
        color={active ? colors.primaryInk : colors.textSecondary}
      >
        {item.label}
      </AppText>
    </Pressable>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, profile } = useAuth();
  const { taste } = useTaste();

  const typeLabel = taste?.mainType ? TYPE_META[taste.mainType].label : null;

  return (
    <View style={styles.root}>
      <View style={styles.logoWrap}>
        <Logo size={26} lockup />
        <AppText variant="caption" muted>
          나에게 맞는 취미 찾기
        </AppText>
      </View>

      <View style={styles.nav} accessibilityRole="tablist">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            active={pathname.startsWith(item.path)}
            onPress={() => router.push(item.href)}
          />
        ))}
      </View>

      <View style={styles.bottom}>
        {session ? (
          <Pressable
            onPress={() => router.push('/my')}
            accessibilityRole="button"
            accessibilityLabel="내 프로필"
            style={({ pressed }) => [styles.userChip, pressed && styles.navItemPressed]}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={20} color={colors.primaryInk} />
              </View>
            )}
            <View style={styles.userInfo}>
              <AppText variant="body" weight="semibold" numberOfLines={1}>
                {displayNameOf(profile)}
              </AppText>
              {typeLabel && (
                <AppText variant="caption" color={colors.primaryInk} numberOfLines={1}>
                  {typeLabel}
                </AppText>
              )}
            </View>
          </Pressable>
        ) : (
          <Button label="로그인하기" variant="secondary" size="md" onPress={() => router.push('/login')} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: SIDEBAR_WIDTH,
    // 캔버스와 같은 크림 — 색면 사이드바는 B2B 대시보드처럼 보인다(디자인 리서치)
    backgroundColor: colors.background,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  logoWrap: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  nav: {
    flex: 1,
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  navItemHovered: {
    backgroundColor: colors.surfaceAlt,
  },
  navItemActive: {
    backgroundColor: colors.primaryTint,
  },
  navItemPressed: {
    opacity: 0.7,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  bottom: {
    gap: spacing.sm,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    // 크림 캔버스 위 흰 카드(크림-온-크림 중첩 금지 규칙)
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderOnWhite,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
});
