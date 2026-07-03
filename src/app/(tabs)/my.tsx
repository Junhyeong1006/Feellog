/**
 * 마이 탭 — 프로필 + 좋아요한 활동 + 글씨 크기(접근성) + 설정(약관/로그아웃/계정삭제).
 * 계정삭제는 잊혀질 권리(RPC). 게스트는 로그인 유도.
 * 데스크탑: [프로필 | 활동·설정] 2컬럼.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { deleteMyAccount, displayNameOf } from '@/api/profiles';
import { ActivityListItem } from '@/components/ActivityListItem';
import { TYPE_META } from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useLikedActivities } from '@/hooks/useLikedActivities';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { FONT_SCALE_STEPS, useFontScale } from '@/providers/FontScaleProvider';
import { clearLocalTaste } from '@/state/tasteCache';
import { colors, CONTENT_WIDTH, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Chip, Divider, Screen } from '@/ui';

export default function MyScreen() {
  const { profile, session, guest, signOut } = useAuth();
  const { taste } = useTaste();
  const { items: liked, loading: likedLoading } = useLikedActivities();
  const { scale, setScale } = useFontScale();
  const { isDesktop } = useBreakpoint();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = session ? displayNameOf(profile) : '회원님';
  const type = taste?.mainType ? TYPE_META[taste.mainType] : null;
  const initial = name.charAt(0);
  /** 게스트는 회원 프로필 헤더('회' 아바타 + 회원님) 대신 로그인 유도 카드를 상단에 */
  const isGuest = guest && !session;

  const onLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const onDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteMyAccount();
      await clearLocalTaste();
      await signOut();
      router.replace('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : '계정 삭제에 실패했어요. 다시 시도해주세요.');
      setDeleting(false);
    }
  };

  const profileSection = (
    <View style={styles.profile}>
      <View style={styles.avatar}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" />
        ) : (
          <AppText variant="h1" color={colors.primaryInk}>
            {initial}
          </AppText>
        )}
      </View>
      <AppText variant="h2">{name}</AppText>
      {type && <Badge label={type.label} tone="primary" />}
    </View>
  );

  const guestCard = isGuest && (
    <Card padding="lg" style={styles.guestCard}>
      {type && (
        <View style={styles.guestType}>
          <AppText variant="caption" muted>
            나의 여가 유형
          </AppText>
          <AppText variant="h2">{type.label}</AppText>
        </View>
      )}
      <AppText variant="body" muted style={styles.guestText}>
        로그인하면 좋아요한 활동과 성향 결과가 저장돼요.
      </AppText>
      <Button label="로그인하기" onPress={() => router.replace('/login')} />
    </Card>
  );

  const likedSection = session && (
    <View style={styles.section}>
      <AppText variant="title">좋아요한 활동</AppText>
      <Card padding="lg" elevation="soft">
        {likedLoading ? (
          <View style={styles.likedLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : liked.length > 0 ? (
          liked.map((a, i) => (
            <View key={a.id}>
              {i > 0 && <Divider gap="xs" />}
              <ActivityListItem activity={a} onPress={() => router.push(`/activity/${a.id}`)} />
            </View>
          ))
        ) : (
          <AppText variant="body" muted center style={styles.likedEmpty}>
            아직 좋아요한 활동이 없어요.{'\n'}추천에서 마음에 드는 활동을 골라보세요.
          </AppText>
        )}
      </Card>
    </View>
  );

  const fontSection = (
    <View style={styles.section}>
      <AppText variant="title">글씨 크기</AppText>
      <Card padding="lg" elevation="soft" style={styles.fontCard}>
        <View style={styles.fontRow}>
          {FONT_SCALE_STEPS.map((step) => (
            <Chip
              key={step.value}
              label={step.label}
              selected={scale === step.value}
              onPress={() => setScale(step.value)}
              accessibilityLabel={`글씨 크기 ${step.label}`}
              style={styles.fontChip}
            />
          ))}
        </View>
        <AppText variant="caption" muted style={styles.fontHint}>
          앱 전체의 글씨가 함께 커져요.
        </AppText>
      </Card>
    </View>
  );

  const settingsSection = (
    <View style={styles.section}>
      <AppText variant="title">설정</AppText>
      <Card padding="lg" elevation="soft">
        <SettingRow label="이용약관" onPress={() => router.push('/legal/terms')} />
        <Divider gap="xs" />
        <SettingRow label="개인정보처리방침" onPress={() => router.push('/legal/privacy')} />
        {session && (
          <>
            <Divider gap="xs" />
            <SettingRow label="로그아웃" onPress={onLogout} />
            <Divider gap="xs" />
            <SettingRow label="계정 삭제" danger onPress={() => setConfirmingDelete(true)} />
          </>
        )}
      </Card>
    </View>
  );

  const deleteConfirm = confirmingDelete && (
    <Card padding="lg" style={styles.deleteCard}>
      <AppText variant="title" color={colors.danger}>
        정말 계정을 삭제할까요?
      </AppText>
      <AppText variant="body" muted style={styles.deleteBody}>
        프로필, 성향 결과, 좋아요 기록이 모두 삭제되며 되돌릴 수 없어요.
      </AppText>
      {error != null && (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      )}
      <View style={styles.deleteActions}>
        <View style={styles.deleteActionItem}>
          <Button
            label="취소"
            variant="secondary"
            onPress={() => setConfirmingDelete(false)}
            disabled={deleting}
          />
        </View>
        <View style={styles.deleteActionItem}>
          <Button label="삭제하기" variant="danger" onPress={onDelete} loading={deleting} />
        </View>
      </View>
    </Card>
  );

  if (isDesktop) {
    return (
      <Screen edges={['top']} scroll maxWidth={CONTENT_WIDTH.wide} contentStyle={styles.content}>
        <View style={styles.columns}>
          <View style={styles.leftCol}>
            {isGuest ? (
              guestCard
            ) : (
              <Card padding="xl">{profileSection}</Card>
            )}
          </View>
          <View style={styles.rightCol}>
            {likedSection}
            {fontSection}
            {settingsSection}
            {deleteConfirm}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} scroll contentStyle={styles.content}>
      {isGuest ? guestCard : profileSection}
      {likedSection}
      {fontSection}
      {settingsSection}
      {deleteConfirm}
    </Screen>
  );
}

function SettingRow({
  label,
  danger,
  onPress,
}: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingPressed]}
    >
      <AppText variant="body" color={danger ? colors.danger : colors.textPrimary}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  leftCol: {
    width: 300,
    gap: spacing.xl,
  },
  rightCol: {
    flex: 1,
    gap: spacing.xl,
  },
  profile: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  guestCard: {
    gap: spacing.md,
  },
  guestType: {
    gap: 2,
    marginBottom: spacing.xs,
  },
  guestText: {
    lineHeight: 26,
  },
  section: {
    gap: spacing.sm,
  },
  likedLoading: {
    paddingVertical: spacing.xl,
  },
  likedEmpty: {
    paddingVertical: spacing.base,
    lineHeight: 26,
  },
  fontCard: {
    gap: spacing.md,
  },
  fontRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fontChip: {
    flex: 1,
  },
  fontHint: {
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  settingPressed: {
    opacity: 0.6,
  },
  deleteCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBody: {
    lineHeight: 26,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  deleteActionItem: {
    flex: 1,
  },
});
