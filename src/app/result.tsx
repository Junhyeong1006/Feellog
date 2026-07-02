/**
 * 성향 분석 결과 — 유형 히어로 + 레이더(한눈 요약) + 5축 막대(자세히) + 공유(S4).
 * 답변(values)을 쿼리로 받아 순수 함수 diagnose로 재계산(무상태·딥링크 안전) → 그대로 공유 링크가 된다.
 * 데스크탑: 히어로 아래 [레이더 카드 | 막대+보조성향 카드] 2컬럼.
 */
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AxisChart } from '@/components/AxisChart';
import { RadarChart } from '@/components/RadarChart';
import {
  diagnose,
  QUESTIONS,
  SUB_TRAIT_META,
  TYPE_META,
  type Answer,
  type AnswerValue,
} from '@/core';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, CONTENT_WIDTH, MAX_CONTENT_WIDTH, spacing } from '@/tokens';
import { absoluteUrl, shareContent } from '@/utils/share';
import { AppText, Badge, Button, Card, Screen } from '@/ui';

function toAnswerValue(n: number): AnswerValue {
  if (Number.isNaN(n)) return 0;
  const c = Math.max(-2, Math.min(2, Math.round(n)));
  return c as AnswerValue;
}

export default function ResultScreen() {
  const { session } = useAuth();
  const { isDesktop, width } = useBreakpoint();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const params = useLocalSearchParams<{ v?: string | string[] }>();
  const raw = Array.isArray(params.v) ? params.v[0] : params.v;

  if (!raw) return <Redirect href="/test" />;

  const parts = raw.split(',');
  const answers: Answer[] = QUESTIONS.map((q, i) => ({ q: q.id, value: toAnswerValue(Number(parts[i])) }));
  const result = diagnose(answers);

  const type = TYPE_META[result.mainType];
  const sub = result.subTrait ? SUB_TRAIT_META[result.subTrait] : null;

  // 레이더가 카드 내부 폭을 넘지 않게 렌더 폭 제한.
  // 데스크탑 2컬럼: 컬럼 = (wide 920 - 화면패딩 48 - 컬럼갭 24)/2, 카드 패딩(lg) 40 제외 ≈ 384
  const radarMaxWidth = isDesktop
    ? (CONTENT_WIDTH.wide - spacing.xl * 2 - spacing.xl) / 2 - spacing.lg * 2
    : Math.min(width, MAX_CONTENT_WIDTH) - spacing.xl * 2 - spacing.lg * 2;

  const onShare = async () => {
    track('result_share');
    const outcome = await shareContent({
      title: `나는 ${type.label}!`,
      message: `Feellog 성향 테스트 결과, 나는 "${type.label}"이에요. 당신의 여가 유형도 알아보세요!`,
      url: absoluteUrl(`/result?v=${raw}`),
    });
    if (outcome === 'copied') setShareNote('링크를 복사했어요. 원하는 곳에 붙여넣어 공유해 보세요!');
    else if (outcome === 'failed') setShareNote('이 환경에서는 공유하기가 지원되지 않아요.');
    else setShareNote(null); // shared/dismissed(시트 닫음)는 안내 불필요
  };

  const radarCard = (
    <Card padding="lg" style={styles.chartCard}>
      <AppText variant="title">한눈에 보기</AppText>
      <RadarChart vector={result.vector} maxWidth={radarMaxWidth} />
    </Card>
  );

  const detailCards = (
    <View style={styles.detailCol}>
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
    </View>
  );

  const guestNote = !session && (
    <AppText variant="caption" muted center style={styles.guestNote}>
      로그인하면 이 결과가 저장되고, 좋아요에 따라 추천이 더 정확해져요.
    </AppText>
  );

  return (
    <Screen
      scroll
      maxWidth={isDesktop ? CONTENT_WIDTH.wide : undefined}
      contentStyle={styles.content}
      footer={
        isDesktop ? undefined : (
          <View style={styles.footer}>
            <Button label="활동 추천 받기" onPress={() => router.replace('/reco')} />
            <Button label="결과 공유하기" variant="outline" onPress={onShare} />
            <Button label="다시 검사하기" variant="ghost" onPress={() => router.replace('/test/run')} />
          </View>
        )
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

      {isDesktop ? (
        <View style={styles.columns}>
          <View style={styles.col}>{radarCard}</View>
          <View style={styles.col}>{detailCards}</View>
        </View>
      ) : (
        <>
          {radarCard}
          {detailCards}
        </>
      )}

      {shareNote && (
        <AppText variant="caption" center color={colors.primaryInk} style={styles.shareNote}>
          {shareNote}
        </AppText>
      )}
      {guestNote}

      {isDesktop && (
        <View style={styles.deskActions}>
          <Button
            label="활동 추천 받기"
            fullWidth={false}
            style={styles.deskAction}
            onPress={() => router.replace('/reco')}
          />
          <Button
            label="결과 공유하기"
            variant="outline"
            fullWidth={false}
            style={styles.deskAction}
            onPress={onShare}
          />
          <Button
            label="다시 검사하기"
            variant="ghost"
            fullWidth={false}
            style={styles.deskAction}
            onPress={() => router.replace('/test/run')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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
  columns: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  detailCol: {
    gap: spacing.xl,
  },
  chartCard: {
    gap: spacing.lg,
    alignItems: 'stretch',
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
  shareNote: {
    lineHeight: 22,
  },
  deskActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  deskAction: {
    minWidth: 200,
  },
  footer: {
    gap: spacing.xs,
  },
});
