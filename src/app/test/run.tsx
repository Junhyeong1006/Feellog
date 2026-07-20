/**
 * 성향 테스트 진행 (v6 블루 — Figma 50:6668).
 * 파랑 배경 + 상단 진행바(N/12) + 질문 헤드라인 + 사진 선택 카드 2장(세로 스택).
 * 카드 선택 = A(-25)/B(+25) 기록 후 다음 문항. 뒤로가기로 이전 문항 수정 가능.
 * 중도 이탈 대비 응답을 로컬 저장(이어하기), 12문 완료 시 diagnose → 결과로 이동.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { saveInitialPrefs } from '@/api/preferences';
import { diagnose, QUESTIONS, type Answer, type AnswerValue } from '@/core';
import { savePrefsFromTest } from '@/hooks/usePrefs';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { clearTestProgress, getTestProgress, setTestProgress } from '@/state/testProgress';
import { colors, MIN_TOUCH_SIZE, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, ProgressBar, Screen } from '@/ui';

import { figmaAssets } from '@/assets/figmaAssets';

const TOTAL = QUESTIONS.length;

/** 스펙 50-6668: 진행바 트랙 흰색 반투명(#FFFFFF@0.2 근사) */
const TRACK_WHITE = 'rgba(255, 255, 255, 0.25)';
/** 카드 하단 라벨 가독용 검정 그라데이션 */
const LABEL_GRADIENT = ['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)'] as const;

const P = figmaAssets.photos;
/** 카테고리 사진(assets/photos) — figmaAssets에 없는 문항 보충 */
const CAT = {
  exhibition: require('../../../assets/photos/category-exhibition.jpg'),
  pottery: require('../../../assets/photos/category-pottery.jpg'),
  classic: require('../../../assets/photos/category-classic.jpg'),
  cooking: require('../../../assets/photos/category-cooking.jpg'),
  calligraphy: require('../../../assets/photos/category-calligraphy.jpg'),
  music: require('../../../assets/photos/category-music.jpg'),
  hiking: require('../../../assets/photos/category-hiking.jpg'),
  yoga: require('../../../assets/photos/category-yoga.jpg'),
} as const;

/** 문항 id → [A 이미지, B 이미지] (선택지 의미와 결이 맞게 결정적 매핑) */
const QUESTION_IMAGES: Record<string, [number, number]> = {
  Q001: [P.testCalm, P.testActive],
  Q002: [P.testHealing, P.testActive],
  Q003: [P.testAlone, P.testTogether],
  Q004: [P.testCalm, P.testTogether],
  Q005: [P.testQ5A, P.testQ5B],
  Q006: [CAT.exhibition, CAT.pottery],
  Q007: [CAT.classic, CAT.cooking],
  Q008: [P.testGarden, P.testCraft],
  Q009: [CAT.calligraphy, CAT.cooking],
  Q010: [P.testQ10A, P.testQ10B],
  Q011: [CAT.music, CAT.hiking],
  Q012: [P.testHealing, CAT.yoga],
};

export default function TestRunScreen() {
  const { session } = useAuth();
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<(AnswerValue | null)[]>(() => Array(TOTAL).fill(null));
  /** 저장된 진행분 복원 중(첫 문항 깜빡임 방지) */
  const [restoring, setRestoring] = useState(true);
  const submitting = useRef(false);

  // 이어하기: 저장된 진행분 복원(48시간 내, 문항 세트 동일할 때만)
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await getTestProgress();
      if (alive && saved) {
        setValues(saved.values);
        setIdx(saved.idx);
      }
      if (alive) setRestoring(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const question = QUESTIONS[idx];
  const selected = values[idx];
  const [imgA, imgB] = QUESTION_IMAGES[question.id] ?? [P.testCalm, P.testActive];

  const finish = async (finalValues: (AnswerValue | null)[]) => {
    if (submitting.current) return;
    submitting.current = true;
    const answers: Answer[] = QUESTIONS.map((q, i) => ({ q: q.id, value: finalValues[i] ?? 0 }));
    const result = diagnose(answers);
    track('test_complete');

    // 로컬이 1차 저장소 — 게스트/오프라인도 추천 동작
    await savePrefsFromTest(result.vector);

    try {
      if (session) await saveInitialPrefs(result.vector, result.mainType);
    } catch {
      // 서버 저장 실패해도 결과는 보여준다(로컬 우선)
    }

    await clearTestProgress(); // 완료 — 이어하기 진행분 제거
    router.replace('/result');
  };

  const select = (val: AnswerValue) => {
    if (submitting.current) return; // 제출 중 중복 입력 방지
    const next = [...values];
    next[idx] = val;
    setValues(next);
    if (idx < TOTAL - 1) {
      setIdx(idx + 1);
      void setTestProgress(next, idx + 1); // 이탈 대비 저장
    } else {
      void finish(next);
    }
  };

  const goBack = () => {
    if (submitting.current) return;
    if (idx > 0) {
      setIdx(idx - 1);
      void setTestProgress(values, idx - 1);
    } else if (router.canGoBack()) router.back();
    else router.replace('/test');
  };

  const closeTest = () => {
    if (submitting.current) return;
    // 진행분은 로컬에 남아 있어 다음에 이어서 할 수 있다
    router.replace('/test');
  };

  if (restoring) {
    return (
      <Screen background={colors.primaryPressed}>
        <View style={styles.restoring}>
          <ActivityIndicator color={palette.white} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen background={colors.primaryPressed}>
      {/* 헤더: 뒤로 + 진행바 + 카운터 + 닫기 */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={idx > 0 ? '이전 문항으로' : '테스트 시작 화면으로'}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedDim]}
        >
          <Ionicons name="arrow-back" size={24} color={palette.white} />
        </Pressable>

        <View style={styles.progressWrap}>
          <ProgressBar
            value={(idx + 1) / TOTAL}
            height={8}
            trackColor={TRACK_WHITE}
            fillColor={colors.accentYellow}
            accessibilityLabel={`${idx + 1}번째 문항, 총 ${TOTAL}문항`}
          />
        </View>
        <AppText variant="caption" weight="medium" color={palette.white} tabular>
          {idx + 1} / {TOTAL}
        </AppText>

        <Pressable
          onPress={closeTest}
          accessibilityRole="button"
          accessibilityLabel="테스트 닫기"
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedDim]}
        >
          <Ionicons name="close" size={24} color={palette.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* 질문 헤드라인 */}
        <AppText variant="h2" color={palette.white} style={styles.prompt}>
          {question.prompt}?
        </AppText>

        {/* 사진 선택 카드 2장 */}
        <View style={styles.options}>
          <PhotoOption
            image={imgA}
            label={question.choiceA}
            selected={selected === -25}
            onPress={() => select(-25)}
          />
          <PhotoOption
            image={imgB}
            label={question.choiceB}
            selected={selected === 25}
            onPress={() => select(25)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

interface PhotoOptionProps {
  image: number;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function PhotoOption({ image, label, selected, onPress }: PhotoOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.cardPressed]}
    >
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      <LinearGradient colors={LABEL_GRADIENT} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.cardLabelWrap}>
        <AppText variant="bodyLg" color={palette.white}>
          {label}
        </AppText>
      </View>
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  restoring: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  iconBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    flex: 1,
  },
  pressedDim: {
    opacity: 0.7,
  },
  body: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  prompt: {
    lineHeight: 38,
    maxWidth: 334,
    paddingBottom: spacing.xxxl,
  },
  options: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  card: {
    height: 220,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInset,
    ...shadows.card,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: colors.accentYellow,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardLabelWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.base,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
