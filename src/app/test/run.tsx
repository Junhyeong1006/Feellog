/**
 * 성향 테스트 진행 — 한 문항씩 두 장면 비교. 끌리는 쪽을 누르면 다음으로.
 * '비슷해요'는 중립(0). 뒤로가기로 이전 문항 수정 가능. 마지막에 진단→결과로 이동.
 * 로그인 상태면 결과를 저장(taste_profiles/test_responses/onboarded).
 */
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { saveDiagnosis } from '@/api/diagnosis';
import { diagnose, QUESTIONS, type Answer, type AnswerValue } from '@/core';
import { useAuth } from '@/providers/AuthProvider';
import { colors, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, ProgressBar, Screen, ScreenHeader } from '@/ui';

const TOTAL = QUESTIONS.length;

export default function TestRunScreen() {
  const { session, refreshProfile } = useAuth();
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<(AnswerValue | null)[]>(() => Array(TOTAL).fill(null));
  const submitting = useRef(false);

  const question = QUESTIONS[idx];
  const selected = values[idx];

  const buildAnswers = (vals: (AnswerValue | null)[]): Answer[] =>
    QUESTIONS.map((q, i) => ({ q: q.id, value: vals[i] ?? 0 }));

  const finish = async (finalValues: (AnswerValue | null)[]) => {
    if (submitting.current) return;
    submitting.current = true;
    const answers = buildAnswers(finalValues);
    const result = diagnose(answers);
    try {
      if (session) {
        await saveDiagnosis(answers, result);
        await refreshProfile();
      }
    } catch {
      // 저장 실패해도 결과는 보여준다(오프라인/게스트 대비)
    }
    router.replace({ pathname: '/result', params: { v: answers.map((a) => a.value).join(',') } });
  };

  const select = (val: AnswerValue) => {
    const next = [...values];
    next[idx] = val;
    setValues(next);
    if (idx < TOTAL - 1) setIdx(idx + 1);
    else void finish(next);
  };

  const goBack = () => {
    if (idx > 0) setIdx(idx - 1);
    else if (router.canGoBack()) router.back();
    else router.replace('/test');
  };

  return (
    <Screen edges={['top', 'bottom']} noPadding>
      <ScreenHeader
        onBack={goBack}
        right={
          <AppText variant="body" muted style={styles.counter}>
            {idx + 1} / {TOTAL}
          </AppText>
        }
      />

      <View style={styles.progressWrap}>
        <ProgressBar value={(idx + 1) / TOTAL} accessibilityLabel={`${idx + 1}번째 문항 / 총 ${TOTAL}`} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <AppText variant="h2" center style={styles.prompt}>
          {question.prompt}
        </AppText>
        <AppText variant="body" muted center style={styles.hint}>
          더 끌리는 쪽을 눌러주세요
        </AppText>

        <View style={styles.options}>
          <OptionCard
            poleLabel={question.leftAxisLabel}
            title={question.left.title}
            desc={question.left.desc}
            accent={colors.primaryTint}
            poleColor={colors.primaryPressed}
            selected={selected === -2}
            onPress={() => select(-2)}
          />
          <OptionCard
            poleLabel={question.rightAxisLabel}
            title={question.right.title}
            desc={question.right.desc}
            accent={palette.mint}
            poleColor={palette.mintDeep}
            selected={selected === 2}
            onPress={() => select(2)}
          />
        </View>

        <Pressable
          onPress={() => select(0)}
          accessibilityRole="button"
          accessibilityLabel="두 쪽이 비슷해요"
          style={({ pressed }) => [styles.neutral, pressed && styles.neutralPressed]}
        >
          <AppText variant="body" muted weight="semibold">
            비슷해요 / 잘 모르겠어요
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

interface OptionCardProps {
  poleLabel: string;
  title: string;
  desc: string;
  accent: string;
  poleColor: string;
  selected: boolean;
  onPress: () => void;
}

function OptionCard({ poleLabel, title, desc, accent, poleColor, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${desc}`}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.band, { backgroundColor: accent }]}>
        <AppText variant="title" weight="bold" color={poleColor}>
          {poleLabel}
        </AppText>
      </View>
      <View style={styles.cardBody}>
        <AppText variant="title">{title}</AppText>
        <AppText variant="body" muted style={styles.cardDesc}>
          {desc}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  counter: {
    paddingHorizontal: spacing.md,
  },
  progressWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  prompt: {
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  hint: {
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.card,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  band: {
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardDesc: {
    lineHeight: 26,
  },
  neutral: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
  },
  neutralPressed: {
    backgroundColor: colors.surfaceAlt,
  },
});
