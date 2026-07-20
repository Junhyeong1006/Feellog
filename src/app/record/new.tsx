/**
 * 기록 작성 — /record/new?date=YYYY-MM-DD (기록 탭 캘린더에서 진입).
 * 날짜(파라미터 없으면 오늘) + 제목 + 본문 + 카테고리 칩(시드 9종) + 만족도 별점.
 * 완료하기 → useRecords.add(로컬 저장) → 뒤로. 서버 없이 완결(로컬 우선).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ACTIVITY_SEED } from '@/data/activitySeed';
import { useRecords } from '@/hooks/useCollections';
import { colors, radius, spacing } from '@/tokens';
import { AppText, Button, Chip, Input, Screen, ScreenHeader, Stars } from '@/ui';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayKey(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** 'YYYY-MM-DD' → '2026년 7월 16일 (목)' */
function koreanDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const week = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${week})`;
}

export default function RecordNewScreen() {
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const rawDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const date = rawDate != null && DATE_RE.test(rawDate) ? rawDate : todayKey();

  const { add } = useRecords();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [satisfaction, setSatisfaction] = useState(0);
  const [saving, setSaving] = useState(false);

  // 시드 카테고리 9종(등장 순서 유지)
  const categories = useMemo(
    () => Array.from(new Set(ACTIVITY_SEED.map((a) => a.category))),
    [],
  );

  const canSubmit = title.trim().length > 0 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await add({
        date,
        title: title.trim(),
        body: body.trim(),
        category,
        activityId: null,
        satisfaction: satisfaction > 0 ? satisfaction : null,
        tags: [],
      });
      if (router.canGoBack()) router.back();
      else router.replace('/log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label="완료하기"
          fullWidth
          disabled={!canSubmit}
          loading={saving}
          onPress={submit}
        />
      }
    >
      <ScreenHeader title="기록하기" />

      <View style={styles.field}>
        <AppText variant="bodyLg" accessibilityRole="header">
          날짜
        </AppText>
        <View style={styles.dateBox} accessible accessibilityLabel={`기록 날짜 ${koreanDateLabel(date)}`}>
          <AppText variant="body2" tabular>
            {koreanDateLabel(date)}
          </AppText>
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="bodyLg" accessibilityRole="header">
          제목
        </AppText>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="어떤 활동을 하셨나요?"
          maxLength={60}
          accessibilityLabel="기록 제목"
        />
      </View>

      <View style={styles.field}>
        <AppText variant="bodyLg" accessibilityRole="header">
          내용
        </AppText>
        <Input
          value={body}
          onChangeText={setBody}
          placeholder="오늘의 활동은 어땠는지 남겨 보세요"
          multiline
          maxLength={1000}
          accessibilityLabel="기록 내용"
        />
      </View>

      <View style={styles.field}>
        <AppText variant="bodyLg" accessibilityRole="header">
          카테고리
        </AppText>
        <View style={styles.chipWrap}>
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              size="md"
              selected={category === c}
              onPress={() => setCategory((prev) => (prev === c ? null : c))}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="bodyLg" accessibilityRole="header">
          만족도
        </AppText>
        <Stars
          value={satisfaction}
          onChange={setSatisfaction}
          accessibilityLabel={`만족도 선택, 현재 ${satisfaction}점`}
        />
      </View>

      <View style={styles.bottomSpace} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  dateBox: {
    alignSelf: 'stretch',
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceInset,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bottomSpace: {
    height: spacing.xl,
  },
});
