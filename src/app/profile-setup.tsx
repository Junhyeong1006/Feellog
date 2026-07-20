/**
 * 프로필 설정 — 단일 라우트 안에서 5단계 진행 (v6 블루 DS).
 * Figma: 302-765(사진) / 302-801·475-1267(이름) / 302-907(생년월일) / 302-848·475-1304(성별) / 302-890(소개).
 *
 * 각 단계 [나중에 하기] = 해당 항목 건너뛰고 다음 단계로(마지막 단계는 완료).
 * [완료하기] → 로컬 초안(profileDraft) 저장 + 세션 있으면 profiles 반영 → 홈.
 * 게스트도 전 단계 사용 가능(전부 로컬 저장).
 */
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { updateMyProfile } from '@/api/profiles';
import { getSupabase } from '@/api/supabase';
// NOTE: '@/assets/*'는 tsconfig에서 루트 assets/로 매핑되어 src/assets는 상대경로로 가져온다
import { figmaAssets } from '../assets/figmaAssets';
import { FeellogLogo } from '@/components/FeellogLogo';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { saveProfileDraft, type ProfileGender } from '@/state/profileDraft';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '@/tokens';
import { AppText, Button, Dots, Input, Screen } from '@/ui';

const TOTAL_STEPS = 5;

const GENDER_OPTIONS: { value: ProfileGender; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'none', label: '없음' },
];

/** 성별 알약(Figma 96x46 r9999 — 선택 시 파랑 채움). Chip은 라벨이 작아 전용으로 그림 */
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
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.genderPill,
        selected && styles.genderPillSelected,
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="h3" color={selected ? colors.onPrimary : colors.textPrimary}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function ProfileSetupScreen() {
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [bio, setBio] = useState('');

  const isLast = step === TOTAL_STEPS - 1;
  const trimmedName = nickname.trim();

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
      // 웹은 즉시 granted, 네이티브는 사진 라이브러리 권한 요청
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
      // 선택 취소/미지원 환경은 조용히 무시(스킵 가능 단계)
    }
  };

  /** 완료 — 로컬 초안 저장(정본) + 세션 있으면 서버 반영(실패해도 진행) */
  const finish = async (includeBio: boolean) => {
    if (saving) return;
    setSaving(true);
    const draft = {
      nickname: trimmedName || undefined,
      birthDate: birthDate ?? undefined,
      gender: gender ?? undefined,
      bio: includeBio && bio.trim() ? bio.trim() : undefined,
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

    track('profile_setup_done');
    router.replace('/');
  };

  const goNext = () => {
    if (isLast) {
      void finish(true);
      return;
    }
    setStep((s) => s + 1);
  };

  const skipStep = () => {
    if (isLast) {
      void finish(false);
      return;
    }
    setStep((s) => s + 1);
  };

  // ── 단계별 본문 ──
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepBody}>
            <AppText variant="display" center>
              안녕하세요 !
            </AppText>
            <Pressable
              onPress={() => void pickPhoto()}
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 선택"
              style={({ pressed }) => [styles.photoWrap, pressed && styles.pressed]}
            >
              <View style={styles.photoCircle}>
                {photoUri != null && (
                  <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
                )}
              </View>
              <Image
                source={figmaAssets.icons.profileCamera}
                style={styles.cameraBtn}
                contentFit="contain"
              />
            </Pressable>
            <View style={styles.textStack}>
              <AppText variant="display" center>
                사진을 선택해주세요
              </AppText>
              <AppText variant="bodyLg" muted center>
                사용하실 프로필에 등록될 사진이에요
              </AppText>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepBody}>
            <View style={styles.textStack}>
              <AppText variant="display" center>
                이름을 적어주세요
              </AppText>
              <AppText variant="bodyLg" muted center>
                {'아래 네모칸을 눌러서\n사용하실 이름이나 별명을 지어주세요.'}
              </AppText>
            </View>
            <View style={styles.fieldGroup}>
              <AppText variant="body">이름 (별명)</AppText>
              <Input
                value={nickname}
                onChangeText={setNickname}
                placeholder="예) 열정둥이"
                maxLength={12}
                autoCapitalize="none"
                accessibilityLabel="이름 또는 별명 입력"
                style={styles.nameInput}
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepBody}>
            <View style={styles.textStack}>
              <AppText variant="display" center>
                나이를 알려주세요
              </AppText>
              <AppText variant="bodyLg" muted center>
                {'네모칸에 생년월일 숫자를 적어\n나이를 알려주세요'}
              </AppText>
            </View>
            <View style={styles.fieldGroup}>
              <AppText variant="body">나이</AppText>
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
                  placeholder="3"
                  keyboardType="number-pad"
                  maxLength={2}
                  accessibilityLabel="태어난 월"
                  style={styles.birthInput}
                />
                <Input
                  value={day}
                  onChangeText={setDay}
                  placeholder="14"
                  keyboardType="number-pad"
                  maxLength={2}
                  accessibilityLabel="태어난 일"
                  style={styles.birthInput}
                />
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepBody}>
            <View style={styles.textStack}>
              <AppText variant="display" center>
                성별를 알려주세요
              </AppText>
              <AppText variant="bodyLg" muted center>
                {'해당 되시는 원안에 적힌 성별을\n선택해 주세요.'}
              </AppText>
            </View>
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
        );
      default:
        return (
          <View style={styles.stepBody}>
            <View style={styles.textStack}>
              <AppText variant="display" center>
                <AppText variant="display" color={colors.primary}>
                  {trimmedName || '회원'}
                </AppText>
                {' 님을\n소개 해주세요'}
              </AppText>
              <AppText variant="bodyLg" muted center>
                {'나를 표현하는 소개글을\n자유롭게 적어주세요.'}
              </AppText>
            </View>
            <Input
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder={
                '예) 저는 다시 새로운 것들과\n제 2의 취미 활동을 해보려 합니다.\n저는 꽃을 좋아해요'
              }
              maxLength={200}
              accessibilityLabel="자기소개 입력"
              style={styles.bioInput}
            />
          </View>
        );
    }
  };

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Dots count={TOTAL_STEPS} activeIndex={step} activeColor={colors.primaryPressed} />
          <View style={styles.buttons}>
            <Button
              label={isLast ? '완료하기' : '다음으로'}
              loading={saving && isLast}
              onPress={goNext}
            />
            <Button
              label="나중에 하기"
              variant="secondary"
              disabled={saving}
              onPress={skipStep}
            />
          </View>
        </View>
      }
    >
      <View style={styles.header}>
        <FeellogLogo width={108} />
      </View>
      <View style={styles.content}>{renderStep()}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  stepBody: {
    alignItems: 'center',
    gap: spacing.xxl,
    // Figma 콘텐츠 폭 267~322/360 — 화면 패딩(20) 위에 여백을 더해 근사
    paddingHorizontal: spacing.xs,
  },
  textStack: {
    gap: spacing.md,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  // ── 사진 단계 (Figma 302-765: 원 238 + 카메라 59 우하단) ──
  photoWrap: {
    width: 238,
    height: 246,
  },
  photoCircle: {
    width: 238,
    height: 238,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
    borderWidth: 1,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    position: 'absolute',
    right: 4,
    bottom: 0,
    width: 59,
    height: 59,
  },
  // ── 이름 단계 (Figma 475-1267: 입력 267x66 r8, 텍스트 SUIT 600/24) ──
  fieldGroup: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  nameInput: {
    minHeight: 66,
    borderColor: colors.primary,
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: typography.h3.fontWeight,
  },
  // ── 생년월일 단계 (Figma 302-907: 96x46 r4 x3, gap 16) ──
  birthRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  birthInput: {
    flex: 1,
    minWidth: 0,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: radius.sm / 2, // Figma 드롭다운만 r4로 각짐
    borderColor: colors.primary,
    textAlign: 'center',
    fontSize: typography.bodyLg.fontSize,
    lineHeight: typography.bodyLg.lineHeight,
    fontWeight: typography.bodyLg.fontWeight,
  },
  // ── 성별 단계 (Figma 302-848: 알약 96x46 r9999, gap 18) ──
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  genderPill: {
    minWidth: 96,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
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
  // ── 소개 단계 (Figma 302-890: 322x153 r12) ──
  bioInput: {
    alignSelf: 'stretch',
    minHeight: 153,
    borderRadius: radius.md,
    borderColor: colors.primary,
  },
  footer: {
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  buttons: {
    gap: spacing.base,
    // Figma 버튼 폭 276/360 — 좌우 여백을 더해 근사
    marginHorizontal: spacing.lg,
  },
});
