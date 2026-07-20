/**
 * 마이 탭 — Figma v6 블루 (334-1043).
 * [헤더(로고+카트)] [프로필 섹션 카드: 아바타+이름+성별·생일 서브카드 / 소개글 / 성향 유형 카드]
 * [설정 리스트 4행: 알림·공지·로그아웃·회원탈퇴].
 * 프로필 정보는 로컬 초안(profileDraft)이 정본, 이름은 서버 표시 이름 폴백.
 * 로그아웃/탈퇴는 확인 시트를 거친다(탈퇴는 게스트에게 숨김).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { deleteMyAccount, displayNameOf } from '@/api/profiles';
// NOTE: '@/assets/*'는 tsconfig에서 루트 assets/로 매핑되어 src/assets는 상대경로로 가져온다
import { figmaAssets } from '../../assets/figmaAssets';
import { HomeHeader } from '@/components/HomeHeader';
import { TYPE_PROFILES } from '@/core';
import { usePrefs } from '@/hooks/usePrefs';
import { useAuth } from '@/providers/AuthProvider';
import { getProfileDraft, type ProfileDraft } from '@/state/profileDraft';
import { colors, MAX_CONTENT_WIDTH, MIN_TOUCH_SIZE, radius, shadows, spacing } from '@/tokens';
import { AppText, Button, Divider, Screen } from '@/ui';

/** 타 화면 소유/신규 라우트 — typed routes 생성 전일 수 있어 문자열 캐스트로 이동 */
const toHref = (path: string) => path as unknown as Href;

const GENDER_LABELS: Record<string, string> = {
  female: '여성',
  male: '남성',
};

/** 'YYYY-MM-DD' → 'YYYY.MM.DD' */
const formatBirth = (birthDate: string) => birthDate.replaceAll('-', '.');

/** 설정 리스트 행 — 레이블 SUIT 600 18 + 우측 셰브론 */
function MenuRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      <AppText variant="bodyLg">{label}</AppText>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

/** 확인 바텀 시트(로그아웃/회원탈퇴 공용) */
function ConfirmSheet({
  title,
  body,
  confirmLabel,
  danger,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={busy ? undefined : onClose} accessibilityLabel="닫기" />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <AppText variant="h3" center>
            {title}
          </AppText>
          <AppText variant="body" muted center style={styles.sheetBody}>
            {body}
          </AppText>
          {error != null && (
            <AppText variant="caption" color={colors.danger} center>
              {error}
            </AppText>
          )}
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            loading={busy}
            style={danger ? styles.dangerBtn : undefined}
          />
          <Button label="취소" variant="secondary" onPress={onClose} disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}

export default function MyScreen() {
  const { profile, session, guest, signOut } = useAuth();
  const { prefs } = usePrefs();

  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프로필 수정에서 돌아올 때마다 초안 갱신
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getProfileDraft().then((d) => {
        if (alive) setDraft(d);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const isGuest = guest && !session;
  const nickname = draft?.nickname?.trim() || (session ? displayNameOf(profile) : '');
  const hasProfile = Boolean(nickname);

  const genderLabel = draft?.gender ? GENDER_LABELS[draft.gender] : undefined;
  const birthLabel = draft?.birthDate ? formatBirth(draft.birthDate) : undefined;
  const bio = draft?.bio?.trim();

  const avatarUri = draft?.photoUri ?? profile?.avatar_url ?? null;
  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : hasProfile
      ? figmaAssets.photos.avatarMypage
      : null;
  const initial = nickname.charAt(0);

  const typeLabel = prefs?.mainType ? TYPE_PROFILES[prefs.mainType].label : null;

  const closeConfirm = () => {
    setConfirm(null);
    setError(null);
  };

  const onLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
      router.replace('/login');
    } catch {
      setError('로그아웃에 실패했어요. 다시 시도해주세요.');
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await deleteMyAccount();
      await signOut();
      router.replace('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : '계정 삭제에 실패했어요. 다시 시도해주세요.');
      setBusy(false);
    }
  };

  return (
    <Screen scroll edges={['top']} contentStyle={styles.content}>
      <HomeHeader />

      {/* 프로필 섹션 카드 (스펙 2: 흰 r20 + 옅은 그림자) */}
      <View style={styles.profileCard}>
        {/* 2a. 아바타 + 이름 서브카드 */}
        <View style={styles.subCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <AppText variant="h1" color={colors.primary}>
                  {initial || '?'}
                </AppText>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={colors.primary} />
            </View>
          </View>

          <View style={styles.identity}>
            {hasProfile ? (
              <>
                <AppText variant="title" color={colors.primary} numberOfLines={1}>
                  {nickname}
                </AppText>
                {(genderLabel != null || birthLabel != null) && (
                  <View style={styles.metaRow}>
                    {genderLabel != null && <AppText variant="body">{genderLabel}</AppText>}
                    {genderLabel != null && birthLabel != null && <View style={styles.metaDot} />}
                    {birthLabel != null && (
                      <AppText variant="body" tabular>
                        {birthLabel}
                      </AppText>
                    )}
                  </View>
                )}
              </>
            ) : (
              <AppText variant="bodyLg" muted>
                프로필을 설정해보세요
              </AppText>
            )}

            <Pressable
              onPress={() => router.push(toHref('/my/profile-edit'))}
              accessibilityRole="button"
              accessibilityLabel="프로필 수정하기"
              hitSlop={spacing.xs}
              style={({ pressed }) => [styles.editBtn, pressed && styles.pressedDim]}
            >
              <AppText variant="body" muted>
                프로필 수정하기
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* 2b. 소개글 */}
        {bio != null && bio !== '' && (
          <AppText variant="body" muted style={styles.bio}>
            {bio}
          </AppText>
        )}

        {/* 2c. 성향 유형 카드 (블루 r20) */}
        <Pressable
          onPress={() => router.push(toHref(typeLabel ? '/result' : '/test'))}
          accessibilityRole="button"
          accessibilityLabel={typeLabel ? `나의 유형 ${typeLabel} 보기` : '나의 스타일 찾기'}
          style={({ pressed }) => [styles.typeCard, pressed && styles.pressedDim]}
        >
          <View style={styles.typeTexts}>
            {typeLabel ? (
              <>
                <AppText variant="bodyLg" color={colors.onPrimary}>
                  나는야
                </AppText>
                <AppText variant="title" color={colors.onPrimary}>
                  {typeLabel}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="bodyLg" color={colors.onPrimary}>
                  아직 유형이 없어요
                </AppText>
                <AppText variant="title" color={colors.onPrimary}>
                  나의 스타일 찾기
                </AppText>
              </>
            )}
          </View>
          <Image
            source={typeLabel ? figmaAssets.icons.arrowCircle : figmaAssets.icons.wishlist}
            style={styles.typeIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>

      <View style={styles.grow} />

      {/* 설정 리스트 (스펙 3: neutral100 컨테이너 r20) */}
      <View style={styles.menu}>
        <MenuRow label="알림 끄고 켜기" onPress={() => router.push(toHref('/my/notifications'))} />
        <Divider color={colors.divider} />
        <MenuRow label="공지사항 읽기" onPress={() => router.push(toHref('/my/notices'))} />
        <Divider color={colors.divider} />
        <MenuRow label="로그아웃 하기" onPress={() => setConfirm('logout')} />
        {!isGuest && (
          <>
            <Divider color={colors.divider} />
            <MenuRow label="회원 탈퇴하기" onPress={() => setConfirm('delete')} />
          </>
        )}
      </View>

      {confirm === 'logout' && (
        <ConfirmSheet
          title="로그아웃 할까요?"
          body="다시 로그인하면 이어서 이용하실 수 있어요."
          confirmLabel="로그아웃 하기"
          busy={busy}
          error={error}
          onConfirm={() => void onLogout()}
          onClose={closeConfirm}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmSheet
          title="정말 탈퇴할까요?"
          body="프로필, 성향 결과, 기록이 모두 삭제되며 되돌릴 수 없어요."
          confirmLabel="회원 탈퇴하기"
          danger
          busy={busy}
          error={error}
          onConfirm={() => void onDelete()}
          onClose={closeConfirm}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  pressedDim: {
    opacity: 0.85,
  },
  // ── 프로필 섹션 카드 ──
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.card,
  },
  subCard: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  avatarWrap: {
    width: 116,
    height: 116,
  },
  avatarCircle: {
    width: 116,
    height: 116,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: colors.surfaceInset,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  editBtn: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  bio: {
    paddingHorizontal: spacing.xs,
  },
  typeCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
    ...shadows.cta,
  },
  typeTexts: {
    flex: 1,
    gap: 2,
  },
  typeIcon: {
    width: 52,
    height: 52,
  },
  // ── 설정 리스트 ──
  menu: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  menuRow: {
    minHeight: MIN_TOUCH_SIZE + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuRowPressed: {
    opacity: 0.6,
  },
  // ── 확인 시트 ──
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    ...shadows.floating,
  },
  sheetBody: {
    marginBottom: spacing.xs,
  },
  dangerBtn: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
});
