/**
 * 소통 글쓰기 (Figma 593-4297).
 * 본문 카드(사진 + 배경색 팔레트) → 태깅 카드(기본 칩 + 커스텀 추가) → 만족도(별점, 선택)
 * → 완료하기 → 로컬 저장(localPosts) 후 소통 피드로 복귀.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { displayNameOf } from '@/api/profiles';
import { figmaAssets } from '@/assets/figmaAssets';
import {
  CommunityComposeBodyCard,
  type PostBgTone,
} from '@/components/community_ComposeBodyCard';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { useLocalPosts } from '@/state/localPosts';
import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/tokens';
import { AppText, Button, Chip, Input, Screen, ScreenHeader, Stars } from '@/ui';

const DEFAULT_TAGS = ['공방', '자유', '경험'];
const MAX_BODY = 2000;

function goBackToFeed() {
  if (router.canGoBack()) router.back();
  else router.replace('/community');
}

export default function ComposeScreen() {
  const { session, profile } = useAuth();
  const { add } = useLocalPosts();

  const [body, setBody] = useState('');
  const [bgTone, setBgTone] = useState<PostBgTone>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tagOptions, setTagOptions] = useState<string[]>(DEFAULT_TAGS);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = body.slice(0, MAX_BODY).trim();
  const canSubmit = trimmed.length > 0 && !saving;

  const toggleTag = (t: string) =>
    setSelectedTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const addCustomTag = () => {
    const t = tagDraft.trim().replace(/^#\s*/, '');
    if (!t) return;
    if (!tagOptions.includes(t)) setTagOptions((cur) => [...cur, t]);
    setSelectedTags((cur) => (cur.includes(t) ? cur : [...cur, t]));
    setTagDraft('');
    setAddingTag(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await add({
        authorName: session ? displayNameOf(profile) : '나',
        avatar: figmaAssets.photos.avatarUser,
        categoryLabel: null,
        body: trimmed,
        bgTone,
        tags: selectedTags,
        rating: rating > 0 ? rating : null,
        imageUri,
      });
      track('post_create', { local: true, hasPhoto: imageUri != null, tagCount: selectedTags.length });
      goBackToFeed();
    } catch {
      setError('글을 저장하지 못했어요. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      scroll
      contentStyle={styles.content}
    >
      <View style={styles.headerBleed}>
        <ScreenHeader title="글쓰기" right={<CloseButton />} />
      </View>

      <CommunityComposeBodyCard
        value={body}
        onChangeText={(t) => setBody(t.slice(0, MAX_BODY))}
        bgTone={bgTone}
        onChangeBgTone={setBgTone}
        imageUri={imageUri}
        onChangeImageUri={setImageUri}
        onPickError={() => setError('사진을 불러오지 못했어요. 다시 시도해주세요.')}
      />

      <View style={styles.sectionCard}>
        <AppText variant="bodyLg">태깅</AppText>
        <View style={styles.chipRow}>
          {tagOptions.map((t) => (
            <Chip
              key={t}
              label={`# ${t}`}
              size="md"
              selected={selectedTags.includes(t)}
              onPress={() => toggleTag(t)}
            />
          ))}
          <Pressable
            onPress={() => setAddingTag((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="태그 직접 추가"
            accessibilityState={{ expanded: addingTag }}
            hitSlop={spacing.xs}
            style={({ pressed }) => [styles.addCircle, pressed && styles.pressed]}
          >
            <Ionicons name={addingTag ? 'remove' : 'add'} size={20} color={colors.primary} />
          </Pressable>
        </View>

        {addingTag && (
          <View style={styles.addTagRow}>
            <Input
              value={tagDraft}
              onChangeText={setTagDraft}
              placeholder="새 태그 입력"
              accessibilityLabel="새 태그 입력"
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
              style={styles.addTagInput}
            />
            <Button
              label="추가"
              size="md"
              fullWidth={false}
              onPress={addCustomTag}
              disabled={tagDraft.trim().length === 0}
            />
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <AppText variant="bodyLg">만족도</AppText>
        <Stars value={rating} onChange={setRating} size={40} />
      </View>

      {error != null && (
        <AppText variant="caption" color={colors.danger} center>
          {error}
        </AppText>
      )}

      {/* 완료하기 — Figma 593-4297: 고정 푸터가 아니라 콘텐츠 바로 아래 */}
      <Button label="완료하기" onPress={submit} loading={saving} disabled={!canSubmit} />
    </Screen>
  );
}

/** 헤더 우측 X 닫기(파랑) */
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
    // Screen 좌우 패딩(20) 안에서 ScreenHeader 자체 패딩(8)을 상쇄
    marginHorizontal: -spacing.sm,
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
  addCircle: {
    width: MIN_TOUCH_SIZE - spacing.sm,
    height: MIN_TOUCH_SIZE - spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addTagInput: {
    flex: 1,
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
