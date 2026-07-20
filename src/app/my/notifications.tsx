/**
 * 마이 > 알림 설정 안내 — Figma v6 (604-1354 정본 + 418-815 ON 상태).
 * 활동 알림 토글(OFF 회색 / ON 파랑) + 용도 설명 + 푸시 미리보기 카드.
 * 토글 상태는 자체 AsyncStorage 키에 저장(로컬 완결 — appFlags 미사용).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// NOTE: '@/assets/*'는 tsconfig에서 루트 assets/로 매핑되어 src/assets는 상대경로로 가져온다
import { figmaAssets } from '../../assets/figmaAssets';
import { FeellogLogo } from '@/components/FeellogLogo';
import { colors, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, Screen, ScreenHeader } from '@/ui';

/** 활동 알림 ON/OFF — 이 화면 전용 로컬 키 */
const STORAGE_KEY = 'feellog.my.activityNotifications.v1';

/** 스펙: 토글 68x40 흰 필 + 노브 원 32(카드색) */
const TRACK_WIDTH = 68;
const TRACK_HEIGHT = 40;
const KNOB_SIZE = 32;

export default function NotificationsScreen() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (alive && raw != null) setEnabled(raw === '1');
      })
      .catch(() => {
        // 읽기 실패는 기본값(OFF) 유지
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0').catch(() => {
      // 저장 실패는 치명적이지 않음(다음 토글에 재시도)
    });
  };

  // 스펙: OFF 카드 #A8A7A3(neutral400) / ON 카드 #5793F4(primary)
  const cardColor = enabled ? colors.primary : palette.neutral400;

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
      <ScreenHeader title="알림 설정 안내" />

      {/* 활동 알림 토글 카드 (313x98 r20) */}
      <Pressable
        onPress={toggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        accessibilityLabel="활동 알림"
        style={({ pressed }) => [
          styles.toggleCard,
          { backgroundColor: cardColor },
          pressed && styles.pressed,
        ]}
      >
        <AppText variant="titleW" color={colors.onPrimary}>
          활동 알림
        </AppText>
        <View style={[styles.track, enabled ? styles.trackOn : styles.trackOff]}>
          <View style={[styles.knob, { backgroundColor: cardColor }]}>
            {enabled ? (
              <Ionicons name="notifications" size={16} color={colors.onPrimary} />
            ) : (
              <Image source={figmaAssets.icons.bellOff} style={styles.bellOffIcon} contentFit="contain" />
            )}
          </View>
        </View>
      </Pressable>

      {/* 용도 설명 */}
      <View style={styles.explain}>
        <AppText variant="bodyLg" color={colors.primary}>
          알람 용도는 무엇일까요?
        </AppText>
        <AppText variant="body" muted>
          허용을 하시면 예약 추천, 이벤트 등 다양한 소식을 앱 상단에서 받아 보실 수 있어요!
        </AppText>
      </View>

      {/* 푸시 미리보기 카드 (291x71, 검정 10% 글래스 r8) */}
      <View style={styles.preview} accessibilityLabel="알림 미리보기 예시">
        <View style={styles.previewIcon}>
          <FeellogLogo width={40} />
        </View>
        <View style={styles.previewTexts}>
          <AppText variant="body" weight="regular" color={colors.primary}>
            Feellog
          </AppText>
          <AppText variant="small" color={colors.primary}>
            최근 가까운 곳에 새로 오픈한 곳이 있어요!
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  toggleCard: {
    minHeight: 98,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  pressed: {
    opacity: 0.9,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    padding: (TRACK_HEIGHT - KNOB_SIZE) / 2,
    justifyContent: 'center',
  },
  trackOff: {
    alignItems: 'flex-start',
  },
  trackOn: {
    alignItems: 'flex-end',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellOffIcon: {
    width: 14,
    height: 14,
  },
  explain: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  preview: {
    // 스펙: bg #000 10% 글래스 — neutral 검정 토큰에서 파생(1A = 10%)
    backgroundColor: `${palette.black}1A`,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginHorizontal: spacing.xs,
  },
  previewIcon: {
    width: 49,
    height: 49,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewTexts: {
    flex: 1,
    gap: 2,
  },
});
