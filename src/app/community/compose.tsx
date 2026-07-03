/**
 * 커뮤니티 글쓰기 — 본문(필수) + 카테고리(선택) + 사진(선택, Storage 업로드).
 * 작성자 정보는 서버 트리거가 스냅샷. 로그인 사용자만 진입.
 * 사진은 등록 시점에 압축·업로드(post-images 버킷) 후 공개 URL을 글에 저장.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { createPost } from '@/api/community';
import { uploadPostImage } from '@/api/storage';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { useFontScale } from '@/providers/FontScaleProvider';
import {
  colors,
  CONTENT_WIDTH,
  fontFamily,
  MIN_TOUCH_SIZE,
  palette,
  radius,
  spacing,
  typography,
} from '@/tokens';
import { AppText, Button, Chip, Screen, ScreenHeader } from '@/ui';

const MAX = 2000;
const CATEGORY_OPTIONS = [
  '등산', '라이딩', '공예', '목공', '캘리그라피', '음악',
  '요리', '사진', '요가', '전시', '클래식', '텃밭',
];

export default function ComposeScreen() {
  const { isDesktop } = useBreakpoint();
  const { scale } = useFontScale();
  const { loading, session } = useAuth();
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ uri: string; width: number | null; height: number | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 업로드 성공 캐시(uri→url) — createPost 실패 후 재시도 시 같은 사진을 다시 올리지 않는다(고아 파일 방지) */
  const uploaded = useRef<{ uri: string; url: string } | null>(null);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  // 로그인 전용 화면 — 딥링크/새로고침 직접 진입 가드
  if (!loading && !session) return <Redirect href="/login" />;

  const pickPhoto = async () => {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setPhoto({ uri: a.uri, width: a.width ?? null, height: a.height ?? null });
      }
    } catch {
      setError('사진을 불러오지 못했어요. 다시 시도해주세요.');
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      // 사진은 등록 시점에 업로드(중도 취소 시 고아 파일 방지). 재시도면 캐시 재사용.
      let imageUrl: string | null = null;
      if (photo) {
        if (uploaded.current?.uri === photo.uri) {
          imageUrl = uploaded.current.url;
        } else {
          imageUrl = await uploadPostImage(photo);
          uploaded.current = { uri: photo.uri, url: imageUrl };
        }
      }
      await createPost({ body: trimmed, category, imageUrl });
      track('post_create', { hasCategory: category != null, hasPhoto: photo != null });
      setSubmitting(false);
      setBody('');
      setPhoto(null);
      uploaded.current = null;
      // 히스토리가 없을 수 있으니(딥링크/새로고침 진입) 안전하게 복귀. 커뮤니티는 포커스 시 새로고침.
      if (router.canGoBack()) router.back();
      else router.replace('/community');
    } catch (e) {
      setError(e instanceof Error ? e.message : '글 등록에 실패했어요. 다시 시도해주세요.');
      setSubmitting(false);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      noPadding
      maxWidth={isDesktop ? CONTENT_WIDTH.reading : undefined}
      footer={<Button label="올리기" onPress={submit} loading={submitting} disabled={!canSubmit} />}
    >
      <ScreenHeader title="글쓰기" />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={body}
          onChangeText={(t) => setBody(t.slice(0, MAX))}
          placeholder="오늘의 취미 이야기를 들려주세요"
          placeholderTextColor={palette.gray500}
          multiline
          textAlignVertical="top"
          // TextInput은 AppText 스케일링을 못 받으므로 글씨 크기 토글을 직접 반영
          style={[
            styles.input,
            scale !== 1 && {
              fontSize: Math.round(typography.body.fontSize * scale),
              lineHeight: Math.round(typography.body.lineHeight * scale),
            },
          ]}
          accessibilityLabel="글 내용"
        />
        <AppText variant="caption" muted style={styles.counter}>
          {trimmed.length} / {MAX}
        </AppText>

        <AppText variant="body" weight="semibold" style={styles.catLabel}>
          카테고리 (선택)
        </AppText>
        <View style={styles.chips}>
          {CATEGORY_OPTIONS.map((c) => (
            <Chip
              key={c}
              label={c}
              size="sm"
              selected={c === category}
              onPress={() => setCategory(c === category ? null : c)}
            />
          ))}
        </View>

        <AppText variant="body" weight="semibold" style={styles.catLabel}>
          사진 (선택)
        </AppText>
        {photo ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} contentFit="cover" />
            <Pressable
              onPress={() => setPhoto(null)}
              accessibilityRole="button"
              accessibilityLabel="사진 제거"
              style={styles.photoRemove}
            >
              <View style={styles.photoRemoveInner}>
                <Ionicons name="close" size={18} color={colors.onPrimary} />
                <AppText variant="caption" weight="bold" color={colors.onPrimary}>
                  제거
                </AppText>
              </View>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="사진 추가"
            style={({ pressed }) => [styles.photoAdd, pressed && styles.photoAddPressed]}
          >
            <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
            <AppText variant="body" weight="semibold" color={colors.textSecondary}>
              앨범에서 사진 고르기
            </AppText>
          </Pressable>
        )}

        {error != null && (
          <AppText variant="caption" color={colors.danger} style={styles.error}>
            {error}
          </AppText>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  input: {
    minHeight: 160,
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...typography.body,
    fontFamily: fontFamily.base,
    color: colors.textPrimary,
  },
  counter: {
    alignSelf: 'flex-end',
  },
  catLabel: {
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    marginTop: spacing.xs,
  },
  photoAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceInset,
  },
  photoAddPressed: {
    opacity: 0.7,
  },
  photoWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
  },
  photoRemoveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.scrimStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
});
