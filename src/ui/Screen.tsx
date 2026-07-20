/**
 * Screen — 화면 공통 컨테이너 (v6 블루 DS).
 * - SafeArea + neutral50 배경
 * - 모든 기기에서 모바일 컬럼: MAX_CONTENT_WIDTH(480) 중앙 정렬(데스크탑 전용 레이아웃 없음)
 * - scroll 옵션(기본 false), footer 슬롯(하단 고정 액션 영역)
 * - 좌우 패딩 20(Figma 화면 좌우 여백)
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
  /** 배경색 override (기본 neutral50) */
  background?: string;
  /** 좌우 패딩 없이(전체폭 콘텐츠: 캐러셀 등) */
  noPadding?: boolean;
  /** SafeArea 적용 가장자리 */
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
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
}: ScreenProps) {
  const padStyle = noPadding ? null : styles.padded;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={edges}>
      <View style={styles.centering}>
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
          <View style={[styles.flex, padStyle, contentStyle]}>{children}</View>
        )}

        {footer != null && <View style={styles.footer}>{footer}</View>}
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
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg, // Figma 화면 좌우 여백 20
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
});
