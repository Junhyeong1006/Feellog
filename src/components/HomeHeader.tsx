/**
 * HomeHeader — 상단 로고 + 우측 액션 헤더 (Figma 439-1249 / 334-989 [1]).
 * 기본 우측은 장바구니 버튼(40 원형, figma icon-cart SVG 자체에 원형 배경 포함) + 담긴 수 배지.
 * 다른 화면에서도 재사용 가능 — right 슬롯으로 우측을 교체할 수 있다.
 */
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { figmaAssets } from '@/assets/figmaAssets';
import { FeellogLogo } from '@/components/FeellogLogo';
import { useCart } from '@/hooks/useCollections';
import { colors, radius, spacing } from '@/tokens';
import { AppText } from '@/ui';

export interface HomeHeaderProps {
  /** 우측 슬롯 — 생략하면 장바구니 버튼(+배지) */
  right?: React.ReactNode;
}

/** 장바구니 라우트 — 타 화면 소유라 typed routes 생성 전일 수 있어 문자열 캐스트로 이동 */
const CART_ROUTE = '/cart' as unknown as Href;

/** 스펙: 카트 버튼 40x40(시각) — hitSlop으로 터치 48 확보 */
const CART_SIZE = 40;

function CartButton() {
  const { count } = useCart();
  const label = count > 0 ? `장바구니, ${count}개 담김` : '장바구니';

  return (
    <Pressable
      onPress={() => router.push(CART_ROUTE)}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={(48 - CART_SIZE) / 2}
      style={({ pressed }) => [styles.cart, pressed && styles.pressed]}
    >
      <Image source={figmaAssets.icons.cart} style={styles.cartIcon} contentFit="contain" />
      {count > 0 && (
        <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <AppText variant="small" weight="bold" color={colors.onPrimary} tabular>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

export function HomeHeader({ right }: HomeHeaderProps) {
  return (
    <View style={styles.row}>
      {/* 스펙: 로고 106x39 */}
      <FeellogLogo width={106} />
      {right ?? <CartButton />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingTop: spacing.sm,
  },
  cart: {
    width: CART_SIZE,
    height: CART_SIZE,
  },
  cartIcon: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
