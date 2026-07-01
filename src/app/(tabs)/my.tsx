/**
 * 마이 탭 — 프로필 + 좋아요한 활동 + 설정(약관/로그아웃/계정삭제).
 * 계정삭제는 잊혀질 권리(RPC). 게스트는 로그인 유도.
 */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { deleteMyAccount, displayNameOf } from '@/api/profiles';
import { ActivityListItem } from '@/components/ActivityListItem';
import { TYPE_META } from '@/core';
import { useLikedActivities } from '@/hooks/useLikedActivities';
import { useTaste } from '@/hooks/useTaste';
import { useAuth } from '@/providers/AuthProvider';
import { clearLocalTaste } from '@/state/tasteCache';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Divider, Screen } from '@/ui';

export default function MyScreen() {
  const { profile, session, guest, signOut } = useAuth();
  const { taste } = useTaste();
  const { items: liked, loading: likedLoading } = useLikedActivities();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = session ? displayNameOf(profile) : '회원님';
  const type = taste?.mainType ? TYPE_META[taste.mainType] : null;
  const initial = name.charAt(0);

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

  return (
    <Screen edges={['top']} scroll contentStyle={styles.content}>
      {/* 프로필 */}
      <View style={styles.profile}>
        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <AppText variant="h1" color={colors.primary}>
              {initial}
            </AppText>
          )}
        </View>
        <AppText variant="h2">{name}</AppText>
        {type && <Badge label={type.label} tone="primary" />}
      </View>

      {guest && !session && (
        <Card padding="lg" style={styles.guestCard}>
          <AppText variant="body" muted center style={styles.guestText}>
            로그인하면 좋아요한 활동과 성향 결과가 저장돼요.
          </AppText>
          <Button label="로그인하기" onPress={() => router.replace('/login')} />
        </Card>
      )}

      {/* 좋아요한 활동 */}
      {session && (
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
      )}

      {/* 설정 */}
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

      {/* 계정 삭제 확인 */}
      {confirmingDelete && (
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
      )}
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
      <AppText style={styles.chevron} color={colors.textMuted}>
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  settingPressed: {
    opacity: 0.6,
  },
  chevron: {
    fontSize: 26,
    lineHeight: 30,
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
