/**
 * 마이 > 프로필 수정 — Figma 334-1299 리스킨(v6 블루 토큰).
 * 아바타(사진 변경) + 닉네임/성별/생년월일/소개 폼 → 저장.
 * 저장은 로컬 초안(profileDraft)이 정본, 세션이 있으면 profiles에도 반영(실패해도 진행).
 */
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { updateMyProfile } from '@/api/profiles';
import { getSupabase } from '@/api/supabase';
// NOTE: '@/assets/*'는 tsconfig에서 루트 assets/로 매핑되어 src/assets는 상대경로로 가져온다
import { figmaAssets } from '../../assets/figmaAssets';
import { useAuth } from '@/providers/AuthProvider';
import { getProfileDraft, saveProfileDraft, type ProfileGender } from '@/state/profileDraft';
import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';
import { AppText, Button, Input, Screen, ScreenHeader } from '@/ui';

const GENDER_OPTIONS: { value: ProfileGender; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'none', label: '없음' },
];

/** 성별 알약(선택 시 파랑 채움) — profile-setup과 동일한 시각 언어 */
function GenderPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`성별 ${label}`}
      style={({ pressed }) => [
        styles.genderPill,
        selected && styles.genderPillSelected,
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="bodyLg" color={selected ? colors.onPrimary : colors.textPrimary}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function ProfileEditScreen() {
  const { session, profile } = useAuth();

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [bio, setBio] = useState('');

  // 기존 값 프리필: 로컬 초안 우선, 닉네임은 서버 표시 이름 폴백
  useEffect(() => {
    let alive = true;
    (async () => {
      const draft = await getProfileDraft();
      if (!alive) return;
      if (draft) {
        setPhotoUri(draft.photoUri ?? null);
        setNickname(draft.nickname ?? '');
        setGender(draft.gender ?? null);
        setBio(draft.bio ?? '');
        if (draft.birthDate) {
          const [y, m, d] = draft.birthDate.split('-');
          setYear(y ?? '');
          setMonth(m ?? '');
          setDay(d ?? '');
        }
      }
      if (!draft?.nickname && profile?.display_name) setNickname(profile.display_name);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
    // 최초 1회만 프리필(입력 중 서버 갱신으로 덮어쓰지 않게)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 유효한 값일 때만 YYYY-MM-DD (아니면 저장 생략) */
  const birthDate = useMemo(() => {
    const y = Number.parseInt(year, 10);
    const m = Number.parseInt(month, 10);
    const d = Number.parseInt(day, 10);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    if (y < 1900 || y > new Date().getFullYear()) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)}`;
  }, [year, month, day]);

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
    } catch {
      // 선택 취소/미지원 환경은 조용히 무시
    }
  };

  const save = async () => {
    if (saving || !loaded) return;
    setSaving(true);
    const trimmedName = nickname.trim();
    const draft = {
      nickname: trimmedName || undefined,
      birthDate: birthDate ?? undefined,
      gender: gender ?? undefined,
      bio: bio.trim() || undefined,
      photoUri: photoUri ?? undefined,
    };
    await saveProfileDraft(draft);

    if (session) {
      // 표시 이름은 확정 스키마(display_name)로 반영
      if (draft.nickname) {
        try {
          await updateMyProfile({ display_name: draft.nickname });
        } catch {
          // 로컬 초안이 남아 있어 유실되지 않는다
        }
      }
      // 확장 필드는 컬럼이 준비된 환경에서만 반영(없으면 조용히 실패 — 로컬 초안이 정본)
      try {
        const sb = getSupabase();
        if (sb) {
          await sb
            .from('profiles')
            .update({
              nickname: draft.nickname ?? null,
              gender: draft.gender ?? null,
              birth_date: draft.birthDate ?? null,
              bio: draft.bio ?? null,
            })
            .eq('id', session.user.id);
        }
      } catch {
        // no-op
      }
    }

    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/my');
  };

  const avatarSource = photoUri
    ? { uri: photoUri }
    : profile?.avatar_url
      ? { uri: profile.avatar_url }
      : figmaAssets.photos.avatarProfileEdit;

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      footer={<Button label="저장하기" onPress={() => void save()} loading={saving} />}
    >
      <ScreenHeader title="프로필 수정" />

      {/* 프로필 사진 */}
      <View style={styles.photoSection}>
        <Pressable
          onPress={() => void pickPhoto()}
          accessibilityRole="button"
          accessibilityLabel="프로필 사진 변경"
          style={({ pressed }) => [styles.photoWrap, pressed && styles.pressed]}
        >
          <View style={styles.photoCircle}>
            <Image source={avatarSource} style={styles.photo} contentFit="cover" />
          </View>
          <Image
            source={figmaAssets.icons.profileCamera}
            style={styles.cameraBtn}
            contentFit="contain"
          />
        </Pressable>
        <AppText variant="caption" muted>
          프로필 사진 변경
        </AppText>
      </View>

      {/* 폼 */}
      <View style={styles.field}>
        <AppText variant="body2">닉네임</AppText>
        <Input
          value={nickname}
          onChangeText={setNickname}
          placeholder="예) 열정둥이"
          maxLength={12}
          autoCapitalize="none"
          accessibilityLabel="닉네임 입력"
        />
      </View>

      <View style={styles.field}>
        <AppText variant="body2">성별</AppText>
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((opt) => (
            <GenderPill
              key={opt.value}
              label={opt.label}
              selected={gender === opt.value}
              onPress={() => setGender(opt.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="body2">생년월일</AppText>
        <View style={styles.birthRow}>
          <Input
            value={year}
            onChangeText={setYear}
            placeholder="1965"
            keyboardType="number-pad"
            maxLength={4}
            accessibilityLabel="태어난 연도"
            style={styles.birthInput}
          />
          <Input
            value={month}
            onChangeText={setMonth}
            placeholder="7"
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel="태어난 월"
            style={styles.birthInput}
          />
          <Input
            value={day}
            onChangeText={setDay}
            placeholder="4"
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel="태어난 일"
            style={styles.birthInput}
          />
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="body2">소개</AppText>
        <Input
          value={bio}
          onChangeText={setBio}
          multiline
          placeholder="나를 표현하는 소개글을 자유롭게 적어주세요."
          maxLength={200}
          accessibilityLabel="자기소개 입력"
          style={styles.bioInput}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
  },
  photoSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  photoWrap: {
    width: 128,
    height: 132,
  },
  photoCircle: {
    width: 128,
    height: 128,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
    borderWidth: 3,
    borderColor: colors.surface,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    position: 'absolute',
    right: -4,
    bottom: 0,
    width: 44,
    height: 44,
  },
  field: {
    gap: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  genderPill: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillSelected: {
    backgroundColor: colors.primary,
  },
  birthRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  birthInput: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  bioInput: {
    minHeight: 152,
    borderRadius: radius.md,
  },
});
