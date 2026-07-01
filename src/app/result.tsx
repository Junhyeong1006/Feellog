/**
 * 성향 분석 결과 — 유형 + 보조성향 배지 + 5축 프로필(AxisChart) + [활동 추천 받기].
 * 답변(values)을 쿼리로 받아 순수 함수 diagnose로 재계산(무상태·딥링크 안전).
 */
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AxisChart } from '@/components/AxisChart';
import {
  diagnose,
  QUESTIONS,
  SUB_TRAIT_META,
  TYPE_META,
  type Answer,
  type AnswerValue,
} from '@/core';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/tokens';
import { AppText, Badge, Button, Card, Screen } from '@/ui';

function toAnswerValue(n: number): AnswerValue {
  if (Number.isNaN(n)) return 0;
  const c = Math.max(-2, Math.min(2, Math.round(n)));
  return c as AnswerValue;
}

export default function ResultScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ v?: string | string[] }>();
  const raw = Array.isArray(params.v) ? params.v[0] : params.v;

  if (!raw) return <Redirect href="/test" />;

  const parts = raw.split(',');
  const answers: Answer[] = QUESTIONS.map((q, i) => ({ q: q.id, value: toAnswerValue(Number(parts[i])) }));
  const result = diagnose(answers);

  const type = TYPE_META[result.mainType];
  const sub = result.subTrait ? SUB_TRAIT_META[result.subTrait] : null;

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button label="활동 추천 받기" onPress={() => router.replace('/reco')} />
          <Button
            label="다시 검사하기"
            variant="ghost"
            onPress={() => router.replace('/test/run')}
          />
        </View>
      }
    >
      <View style={styles.hero}>
        <AppText variant="body" muted>
          나의 여가 유형
        </AppText>
        <AppText variant="h1" center style={styles.typeName}>
          {type.label}
        </AppText>
        {sub && <Badge label={`보조 성향 · ${sub.label}`} tone="mint" />}
        <AppText variant="bodyLg" muted center style={styles.tagline}>
          {type.tagline}
        </AppText>
      </View>

      <Card padding="lg" style={styles.chartCard}>
        <AppText variant="title" style={styles.chartTitle}>
          나의 성향 프로필
        </AppText>
        <AxisChart vector={result.vector} />
      </Card>

      {sub && (
        <Card padding="lg" elevation="soft">
          <AppText variant="title">{sub.label}</AppText>
          <AppText variant="body" muted style={styles.subBody}>
            {sub.tagline}
          </AppText>
        </Card>
      )}

      {!session && (
        <AppText variant="caption" muted center style={styles.guestNote}>
          로그인하면 이 결과가 저장되고, 좋아요에 따라 추천이 더 정확해져요.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  typeName: {
    lineHeight: 40,
  },
  tagline: {
    lineHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  chartCard: {
    gap: spacing.lg,
  },
  chartTitle: {
    marginBottom: spacing.xs,
  },
  subBody: {
    lineHeight: 26,
    marginTop: spacing.xs,
  },
  guestNote: {
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  footer: {
    gap: spacing.xs,
  },
});
