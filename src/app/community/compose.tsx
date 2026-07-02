/**
 * 커뮤니티 글쓰기 — 본문(필수) + 카테고리(선택). 작성자 정보는 서버 트리거가 스냅샷.
 * 이미지 첨부는 후속(스토리지 연동). 로그인 사용자만 진입.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { createPost } from '@/api/community';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useFontScale } from '@/providers/FontScaleProvider';
import { colors, CONTENT_WIDTH, fontFamily, MIN_TOUCH_SIZE, radius, spacing, typography } from '@/tokens';
import { AppText, Button, Screen, ScreenHeader } from '@/ui';

const MAX = 2000;
const CATEGORY_OPTIONS = [
  '등산', '라이딩', '공예', '목공', '캘리그라피', '음악',
  '요리', '사진', '요가', '전시', '클래식', '텃밭',
];

export default function ComposeScreen() {
  const { isDesktop } = useBreakpoint();
  const { scale } = useFontScale();
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await createPost({ body: trimmed, category });
      track('post_create', { hasCategory: category != null });
      setSubmitting(false);
      setBody('');
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

      <View style={styles.body}>
        <TextInput
          value={body}
          onChangeText={(t) => setBody(t.slice(0, MAX))}
          placeholder="오늘의 취미 이야기를 들려주세요"
          placeholderTextColor={colors.textMuted}
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
          {CATEGORY_OPTIONS.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(active ? null : c)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
              >
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={active ? colors.onPrimary : colors.textSecondary}
                >
                  {c}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {error != null && (
          <AppText variant="caption" color={colors.danger} style={styles.error}>
            {error}
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
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
  chip: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    // primaryPressed: 흰 라벨과 WCAG AA(4.7:1) — primary는 3.2:1로 미달
    backgroundColor: colors.primaryPressed,
  },
  chipInactive: {
    backgroundColor: colors.surfaceInset,
  },
  error: {
    marginTop: spacing.xs,
  },
});
