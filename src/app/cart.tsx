/**
 * 장바구니 (v6 블루 DS) — 로컬 카트(useCart) 목록 + 합계 + 예약 문의 CTA.
 * 온라인 결제/예약은 미지원 — CTA는 준비중 안내 시트(BookingSheet)로 정직하게 연결.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BookingSheet } from '@/components/activity_BookingSheet';
import type { Activity } from '@/core';
import { ACTIVITY_SEED } from '@/data/activitySeed';
import { demoPhoto, demoPrice, formatPrice } from '@/data/activityDisplay';
import { useCart } from '@/hooks/useCollections';
import { track } from '@/lib/analytics';
import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';
import { AppText, Button, Card, Divider, Screen, ScreenHeader } from '@/ui';

interface CartRow {
  activity: Activity;
  qty: number;
}

export default function CartScreen() {
  const { items, loading, remove } = useCart();
  const [sheetOpen, setSheetOpen] = useState(false);

  // 카트 항목 ↔ 시드 활동 조인(모르는 id는 표시에서 제외)
  const rows = useMemo<CartRow[]>(
    () =>
      items
        .map((item) => {
          const activity = ACTIVITY_SEED.find((a) => a.id === item.activityId);
          return activity ? { activity, qty: item.qty } : null;
        })
        .filter((r): r is CartRow => r != null),
    [items],
  );

  const totalQty = rows.reduce((sum, r) => sum + r.qty, 0);
  const totalPrice = rows.reduce((sum, r) => sum + demoPrice(r.activity) * r.qty, 0);

  const onInquire = () => {
    track('booking_click', { source: 'cart', items: rows.length });
    setSheetOpen(true);
  };

  const footer =
    rows.length > 0 ? (
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <AppText variant="body" muted>
            총 {totalQty}개
          </AppText>
          <AppText variant="h3" tabular>
            {formatPrice(totalPrice)}
          </AppText>
        </View>
        <Button label="예약 문의하기" onPress={onInquire} />
      </View>
    ) : undefined;

  return (
    <Screen scroll footer={footer} contentStyle={styles.content}>
      <ScreenHeader title="장바구니" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={40} color={colors.primary} />
          </View>
          <AppText variant="h3" center>
            장바구니가 비어 있어요
          </AppText>
          <AppText variant="body" muted center>
            마음에 드는 클래스를 담아보세요.
          </AppText>
          <Button
            label="클래스 둘러보기"
            variant="secondary"
            onPress={() => router.replace('/home')}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((row, i) => (
            <View key={row.activity.id}>
              {i > 0 && <Divider />}
              <CartItemRow
                row={row}
                onPress={() => router.push(`/activity/${row.activity.id}`)}
                onRemove={() => void remove(row.activity.id)}
              />
            </View>
          ))}
        </View>
      )}

      <BookingSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}

function CartItemRow({
  row,
  onPress,
  onRemove,
}: {
  row: CartRow;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { activity, qty } = row;
  return (
    <Card
      onPress={onPress}
      elevation="none"
      bordered={false}
      background="transparent"
      padding="xs"
      accessibilityLabel={`${activity.title}, ${formatPrice(demoPrice(activity))}, 수량 ${qty}개`}
      style={styles.itemCard}
    >
      <View style={styles.itemRow}>
        <Image source={demoPhoto(activity)} style={styles.thumb} contentFit="cover" transition={150} />

        <View style={styles.itemInfo}>
          <AppText variant="body2" numberOfLines={1}>
            {activity.title}
          </AppText>
          <AppText variant="caption" muted>
            {activity.category} · 수량 {qty}개
          </AppText>
          <AppText variant="body2" color={colors.primary} tabular>
            {formatPrice(demoPrice(activity) * qty)}
          </AppText>
        </View>

        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`${activity.title} 장바구니에서 빼기`}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.huge,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyBtn: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  list: {
    paddingTop: spacing.sm,
  },
  itemCard: {
    marginVertical: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceInset,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  removeBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  footer: {
    gap: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
