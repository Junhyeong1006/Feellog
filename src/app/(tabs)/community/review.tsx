/**
 * 후기쓰기 2단계 플로우 (26.07 온보딩작업 시안 604:1086 → 631:506).
 * 1단계 '후기쓰기': '완료한 클래스' 선택 — 컬러 카드(코랄/블루/브라운 순환) + 흰 원형 화살표.
 * 2단계 '글쓰기': 본문 카드(사진·배경색) + 난이도(5단계 슬라이더) + 만족도(별점)
 *        → 완료하기(콘텐츠 흐름 내) → 로컬 저장(localPosts, rating 포함) 후 소통 피드로 복귀.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { figmaAssets } from '@/assets/figmaAssets';
import {
  CommunityComposeBodyCard,
  type PostBgTone,
} from '@/components/community_ComposeBodyCard';
import { DIFFICULTY_LEVELS, DifficultySlider } from '@/components/DifficultySlider';
import { ACTIVITY_SEED } from '@/data/activitySeed';
import { useRecords } from '@/hooks/useCollections';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { useLocalPosts } from '@/state/localPosts';
import { colors, MIN_TOUCH_SIZE, palette, radius, spacing } from '@/tokens';
import { AppText, Button, Screen, ScreenHeader, Stars } from '@/ui';

/** 완료 클래스 카드 색 순환(시안: 코랄 → 블루 → 브라운. 코랄은 흰 타이틀 3:1 미달이라 AA 딥코랄로 보정) */
const CLASS_CARD_TONES = [palette.coralDeep, colors.primary, palette.brown] as const;
const MAX_BODY = 2000;

/** 후기 대상 클래스(데모 1건 + 기록에서 온 것) */
interface DoneClass {
  key: string;
  title: string;
  activityId: string | null;
}

const DEMO_CLASS: DoneClass = { key: 'demo', title: '도자기 공방 클래스', activityId: null };

function goBackToFeed() {
  if (router.canGoBack()) router.back();
  else router.replace('/community');
}

export default function ReviewScreen() {
  const { records } = useRecords();
  const [target, setTarget] = useState<DoneClass | null>(null);

  const doneClasses: DoneClass[] = useMemo(() => {
    const fromRecords = records
      .filter((r) => r.activityId != null)
      .map((r) => {
        const act = ACTIVITY_SEED.find((a) => a.id === r.activityId);
        return { key: r.id, title: act?.title ?? r.title, activityId: r.activityId };
      });
    return [DEMO_CLASS, ...fromRecords];
  }, [records]);

  if (target == null) {
    return <SelectStep classes={doneClasses} onSelect={setTarget} />;
  }
  return <WriteStep target={target} onBackToSelect={() => setTarget(null)} />;
}

// ── 1단계: 완료한 클래스 선택 ──

function SelectStep({
  classes,
  onSelect,
}: {
  classes: DoneClass[];
  onSelect: (c: DoneClass) => void;
}) {
  return (
    <Screen edges={['top', 'bottom']} scroll contentStyle={styles.content}>
      <View style={styles.headerBleed}>
        <ScreenHeader title="후기쓰기" right={<CloseButton />} />
      </View>

      <AppText variant="title">완료한 클래스</AppText>

      {classes.map((c, i) => {
        const tone = CLASS_CARD_TONES[i % CLASS_CARD_TONES.length];
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(c)}
            accessibilityRole="button"
            accessibilityLabel={`${c.title} 후기 쓰기`}
            style={({ pressed }) => [
              styles.classCard,
              { backgroundColor: tone },
              pressed && styles.pressedCard,
            ]}
          >
            <AppText variant="title" color={palette.white} numberOfLines={2} style={styles.classTitle}>
              {c.title}
            </AppText>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={32} color={tone} />
            </View>
          </Pressable>
        );
      })}

      <AppText variant="caption" muted style={styles.hint}>
        기록 탭에서 완료한 클래스를 기록하면 이 목록에 추가돼요.
      </AppText>
    </Screen>
  );
}

// ── 2단계: 후기 작성 ──

function WriteStep({
  target,
  onBackToSelect,
}: {
  target: DoneClass;
  onBackToSelect: () => void;
}) {
  const { session, profile } = useAuth();
  const { add } = useLocalPosts();

  const [body, setBody] = useState('');
  const [bgTone, setBgTone] = useState<PostBgTone>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = body.slice(0, MAX_BODY).trim();
  const canSubmit = trimmed.length > 0 && rating > 0 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await add({
        authorName: session ? displayNameOf(profile) : '나',
        avatar: figmaAssets.photos.avatarUser,
        categoryLabel: target.title,
        body: trimmed,
        bgTone,
        tags: difficulty != null ? ['후기', `난이도 ${DIFFICULTY_LEVELS[difficulty]}`] : ['후기'],
        rating,
        imageUri,
      });
      track('post_create', { local: true, review: true, hasPhoto: imageUri != null });
      goBackToFeed();
    } catch {
      setError('후기를 저장하지 못했어요. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} scroll contentStyle={styles.content}>
      <View style={styles.headerBleed}>
        <ScreenHeader title="글쓰기" onBack={onBackToSelect} right={<CloseButton />} />
      </View>

      <View style={styles.targetRow}>
        <AppText variant="caption" muted>
          후기 쓸 클래스
        </AppText>
        <AppText variant="title" numberOfLines={2}>
          {target.title}
        </AppText>
      </View>

      <CommunityComposeBodyCard
        value={body}
        onChangeText={(t) => setBody(t.slice(0, MAX_BODY))}
        bgTone={bgTone}
        onChangeBgTone={setBgTone}
        imageUri={imageUri}
        onChangeImageUri={setImageUri}
        placeholder="클래스는 어떠셨나요? 경험을 들려주세요"
        onPickError={() => setError('사진을 불러오지 못했어요. 다시 시도해주세요.')}
      />

      <View style={styles.sectionCard}>
        <AppText variant="bodyLg">난이도</AppText>
        <DifficultySlider value={difficulty} onChange={setDifficulty} />
      </View>

      <View style={styles.sectionCard}>
        <AppText variant="bodyLg">만족도</AppText>
        <Stars value={rating} onChange={setRating} size={40} />
        {rating === 0 && (
          <AppText variant="caption" muted>
            별을 눌러 만족도를 남겨주세요.
          </AppText>
        )}
      </View>

      {error != null && (
        <AppText variant="caption" color={colors.danger} center>
          {error}
        </AppText>
      )}

      {/* 완료하기 — 시안 631:506: 고정 푸터가 아니라 콘텐츠 흐름 내 */}
      <Button label="완료하기" onPress={submit} loading={saving} disabled={!canSubmit} />
    </Screen>
  );
}

/** 헤더 우측 X 닫기 — 후기 플로우 전체 종료 */
function CloseButton() {
  return (
    <Pressable
      onPress={goBackToFeed}
      accessibilityRole="button"
      accessibilityLabel="닫기"
      style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
    >
      <Ionicons name="close" size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  headerBleed: {
    marginHorizontal: -spacing.sm,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    // 시안 604:1086: 타이틀 좌측 여백 48
    paddingLeft: spacing.xxl + spacing.base,
    paddingRight: spacing.lg,
    paddingVertical: spacing.base,
    minHeight: 97,
  },
  pressedCard: {
    opacity: 0.9,
  },
  classTitle: {
    flex: 1,
  },
  arrowCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    paddingTop: spacing.xs,
  },
  targetRow: {
    gap: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  closeBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
