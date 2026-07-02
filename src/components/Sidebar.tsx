/**
 * Sidebar — 데스크탑 웹 전용 좌측 내비게이션(모바일 하단 탭의 와이드 대응).
 * 로고 → 메뉴 4개(홈·추천·커뮤니티·마이) → 하단 사용자/로그인 영역.
 * (tabs)/_layout.tsx에서 isDesktop일 때만 렌더된다.
 */
import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { displayNameOf } from '@/api/profiles';
import { TYPE_META } from '@/core';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, SIDEBAR_WIDTH, spacing } from '@/tokens';
import { AppText, Button, Logo } from '@/ui';

interface NavDef {
  href: Href;
  path: string;
  emoji: string;
  label: string;
}

const NAV_ITEMS: NavDef[] = [
  { href: '/home', path: '/home', emoji: '🏠', label: '홈' },
  { href: '/reco', path: '/reco', emoji: '✨', label: '추천' },
  { href: '/community', path: '/community', emoji: '💬', label: '커뮤니티' },
  { href: '/my', path: '/my', emoji: '🙂', label: '마이' },
];

function NavItem({ item, active, onPress }: { item: NavDef; active: boolean; onPress: () => void }) {
  // Link asChild는 함수형 style을 무시하므로(활성 pill/행 배치가 깨짐) Pressable + router로 이동한다.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.navItemPressed]}
    >
      <AppText style={styles.navEmoji} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {item.emoji}
      </AppText>
      {/* primaryPressed: 틴트 배경 위에서도 WCAG AA 대비 확보(primary는 2.9:1로 미달) */}
      <AppText
        variant="body"
        weight={active ? 'bold' : 'medium'}
        color={active ? colors.primaryPressed : colors.textSecondary}
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
        <Logo size={30} />
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
                <AppText style={styles.avatarEmoji}>🙂</AppText>
              </View>
            )}
            <View style={styles.userInfo}>
              <AppText variant="body" weight="semibold" numberOfLines={1}>
                {displayNameOf(profile)}
              </AppText>
              {typeLabel && (
                <AppText variant="caption" color={colors.primaryPressed} numberOfLines={1}>
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
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
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
    borderRadius: radius.lg,
  },
  navItemActive: {
    backgroundColor: colors.primaryTint,
  },
  navItemPressed: {
    opacity: 0.7,
  },
  navEmoji: {
    fontSize: 22,
    lineHeight: 28,
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
    backgroundColor: colors.surfaceInset,
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
  avatarEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
});
