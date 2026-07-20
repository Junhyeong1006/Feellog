/**
 * activity_BookingSheet — 예약 준비중 안내 바텀시트 (클래스 상세·장바구니 공용).
 * 온라인 예약이 아직 없으므로 정직하게 안내하고 다음 행동(위치 확인)을 제시한다.
 * 소유: activity/[id].tsx + cart.tsx 작업분 — 다른 화면에서 쓰려면 위치 확인 후 사용.
 */
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, MAX_CONTENT_WIDTH, radius, shadows, spacing } from '@/tokens';
import { AppText, Button } from '@/ui';

export interface BookingSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 주면 '위치 확인하기' 버튼 노출(카카오맵 열기 등) */
  onOpenMap?: () => void;
}

export function BookingSheet({ visible, onClose, onOpenMap }: BookingSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="안내 닫기"
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <AppText variant="title" center>
            온라인 예약 준비 중이에요
          </AppText>
          <AppText variant="body" muted center style={styles.body}>
            채팅으로 문의하거나 위치를 확인해 방문해보세요.
          </AppText>

          <View style={styles.actions}>
            {onOpenMap != null && (
              <Button
                label="위치 확인하기"
                onPress={() => {
                  onClose();
                  onOpenMap();
                }}
                accessibilityLabel="카카오맵에서 위치 확인하기"
              />
            )}
            <Button label="닫기" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    ...shadows.floating,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
    marginBottom: spacing.sm,
  },
  body: {
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
});
