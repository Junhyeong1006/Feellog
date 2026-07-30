/**
 * 보관함 — 즐겨찾기(별)·찜(하트) 목록 (26.07 온보딩작업 시안의 마이 탭 보관 카드에서 진입).
 * 로컬 컬렉션(useFavorites/useWishlist) 기반 — 게스트도 완전 동작.
 * 우측 아이콘 탭 = 해당 컬렉션에서 제거(토글).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ACTIVITY_SEED } from '@/data/activitySeed';
import { demoPhoto, demoPrice, demoRegion, formatPrice } from '@/data/activityDisplay';
import { useFavorites, useWishlist } from '@/hooks/useCollections';
import { colors, MIN_TOUCH_SIZE, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, Button, Screen, ScreenHeader, SegmentedTabs } from '@/ui';

const TABS = ['즐겨찾기', '찜'] as const;

export default function SavedScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeIndex, setActiveIndex] = useState(tab === 'wishlist' ? 1 : 0);
  const favorites = useFavorites();
  const wishlist = useWishlist();

  const isFavTab = activeIndex === 0;
  const ids = isFavTab ? favorites.ids : wishlist.ids;
  const items = ACTIVITY_SEED.filter((a) => ids.includes(a.id));
  // AA 딥 컬러 — 아이콘이 제거 버튼의 유일한 시각 표식이라 3:1 이상 필요
  const tint = isFavTab ? palette.yellowDeep : palette.coralDeep;
  const icon = isFavTab ? ('star' as const) : ('heart' as const);
  const remove = isFavTab ? favorites.toggle : wishlist.toggle;

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
      <ScreenHeader title="보관함" />

      <SegmentedTabs tabs={[...TABS]} activeIndex={activeIndex} onChange={setActiveIndex} />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name={`${icon}-outline`} size={56} color={tint} />
          <AppText variant="bodyLg" center>
            {isFavTab ? '아직 즐겨찾기한 클래스가 없어요' : '아직 찜한 클래스가 없어요'}
          </AppText>
          <AppText variant="body" muted center>
            {isFavTab
              ? '클래스 상세에서 별을 누르면 여기에 모여요.'
              : '마음에 드는 클래스에 하트를 누르면 여기에 모여요.'}
          </AppText>
          <Button
            label="클래스 둘러보기"
            variant="secondary"
            fullWidth={false}
            style={styles.emptyCta}
            onPress={() => router.replace('/home' as unknown as Href)}
          />
        </View>
      ) : (
        items.map((a) => (
          // 버튼 중첩 방지(웹 button-in-button) — 카드 이동/제거를 형제 Pressable로 분리
          <View key={a.id} style={styles.itemCard}>
            <Pressable
              onPress={() => router.push(`/activity/${a.id}` as unknown as Href)}
              accessibilityRole="button"
              accessibilityLabel={`${a.title} 상세 보기`}
              style={({ pressed }) => [styles.itemMain, pressed && styles.pressedDim]}
            >
              <Image source={demoPhoto(a)} style={styles.thumb} contentFit="cover" />
              <View style={styles.itemBody}>
                <AppText variant="body2" numberOfLines={1}>
                  {a.title}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {demoRegion(a)} · {formatPrice(demoPrice(a))}
                </AppText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => void remove(a.id)}
              accessibilityRole="button"
              accessibilityLabel={isFavTab ? '즐겨찾기에서 제거' : '찜에서 제거'}
              hitSlop={spacing.xs}
              style={({ pressed }) => [styles.removeBtn, pressed && styles.pressedDim]}
            >
              <Ionicons name={icon} size={26} color={tint} />
            </Pressable>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  emptyCta: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceInset,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  removeBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedDim: {
    opacity: 0.8,
  },
});
