/**
 * Screen — 화면 공통 컨테이너.
 * - SafeArea + 크림 배경
 * - 웹에서 모바일 폭(MAX_CONTENT_WIDTH)으로 중앙 정렬
 * - scroll 옵션(기본 false), footer 슬롯(하단 고정 액션 영역)
 * 모든 화면은 이걸로 감싸서 여백/폭/배경을 일관되게 유지한다.
 */
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, MAX_CONTENT_WIDTH, spacing } from '@/tokens';

export interface ScreenProps {
  children: React.ReactNode;
  /** 본문을 스크롤 가능하게 */
  scroll?: boolean;
  /** 하단 고정 영역(주요 버튼 등) */
  footer?: React.ReactNode;
  /** 배경색 override */
  background?: string;
  /** 좌우 패딩 없이(전체폭 콘텐츠: 캐러셀 등) */
  noPadding?: boolean;
  /** SafeArea 적용 가장자리 */
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * 콘텐츠 최대 너비 override (기본 MAX_CONTENT_WIDTH=480).
   * 데스크탑 레이아웃은 CONTENT_WIDTH 프리셋(reading/wide/dashboard)을 넘긴다.
   * 작은 창에서는 어차피 100%로 줄어들므로 모바일에 영향 없음.
   */
  maxWidth?: number;
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom'];

export function Screen({
  children,
  scroll = false,
  footer,
  background = colors.background,
  noPadding = false,
  edges = DEFAULT_EDGES,
  contentStyle,
  maxWidth,
}: ScreenProps) {
  const padStyle = noPadding ? null : styles.padded;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={edges}>
      <View style={[styles.centering, maxWidth != null && { maxWidth }]}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, padStyle, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.body, padStyle, contentStyle]}>{children}</View>
        )}

        {footer != null && <View style={[styles.footer, noPadding && styles.footerPadded]}>{footer}</View>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centering: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  footerPadded: {
    paddingHorizontal: spacing.xl,
  },
});
