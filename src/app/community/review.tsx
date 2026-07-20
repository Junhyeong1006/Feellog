/**
 * 후기쓰기 2단계 플로우 (Figma 604-1086 → 593-4367).
 * 1단계: '완료한 클래스' 선택 — 기록(useRecords, activityId 있는 것) + 데모 1건.
 * 2단계: 클래스명 표시 + 본문 카드(사진·배경색) + 난이도(하/중/상) + 만족도(별점)
 *        → 완료하기 → 로컬 저장(localPosts, rating 포함) 후 소통 피드로 복귀.
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
import { ACTIVITY_SEED } from '@/data/activitySeed';
import { useRecords } from '@/hooks/useCollections';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { useLocalPosts } from '@/state/localPosts';
import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';
import { AppText, Button, Chip, Screen, ScreenHeader, Stars } from '@/ui';

const DIFFICULTY_OPTIONS = ['하', '중', '상'] as const;
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

      {classes.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onSelect(c)}
          accessibilityRole="button"
          accessibilityLabel={`${c.title} 후기 쓰기`}
          style={({ pressed }) => [styles.classCard, pressed && styles.pressedCard]}
        >
          <AppText variant="title" numberOfLines={2} style={styles.classTitle}>
            {c.title}
          </AppText>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={26} color={colors.primary} />
          </View>
        </Pressable>
      ))}

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
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY_OPTIONS)[number] | null>(null);
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
        tags: difficulty != null ? ['후기', `난이도 ${difficulty}`] : ['후기'],
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
    <Screen
      edges={['top', 'bottom']}
      scroll
      contentStyle={styles.content}
      footer={
        <Button label="완료하기" onPress={submit} loading={saving} disabled={!canSubmit} />
      }
    >
      <View style={styles.headerBleed}>
        <ScreenHeader title="후기쓰기" onBack={onBackToSelect} right={<CloseButton />} />
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
        placeholder="ㅣ클래스는 어떠셨나요? 경험을 들려주세요"
        onPickError={() => setError('사진을 불러오지 못했어요. 다시 시도해주세요.')}
      />

      <View style={styles.sectionCard}>
        <AppText variant="bodyLg">난이도</AppText>
        <View style={styles.chipRow}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <Chip
              key={d}
              label={d}
              size="md"
              selected={difficulty === d}
              onPress={() => setDifficulty((cur) => (cur === d ? null : d))}
            />
          ))}
        </View>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 96,
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
    borderWidth: 1,
    borderColor: colors.primary,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
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
