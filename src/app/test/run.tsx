/**
 * 성향 테스트 진행 (26.08 온보딩작업 v3 — Figma 641:1041~675:585).
 * 좌: 옵션 사진 카드 2장(위 A/아래 B, Q11·12는 시안대로 컬러 카드) +
 * 우: 세로 5단계 선호 스케일(선호/조금선호/비슷/조금선호/선호 = -25/-12.5/0/+12.5/+25).
 * 트랙 채움은 중앙(비슷)에서 선택 지점까지, 선택 방향 라벨은 블루로 강조.
 * '다음으로'로 진행(선택 전 비활성), 중도 이탈 대비 로컬 저장(이어하기), 12문 완료 시 diagnose → 결과.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { saveInitialPrefs } from '@/api/preferences';
import { figmaAssets } from '@/assets/figmaAssets';
import { FeellogLogo } from '@/components/FeellogLogo';
import { diagnose, QUESTIONS, type Answer, type AnswerValue } from '@/core';
import { savePrefsFromTest } from '@/hooks/usePrefs';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { clearTestProgress, getTestProgress, setTestProgress } from '@/state/testProgress';
import { colors, MIN_TOUCH_SIZE, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, Screen } from '@/ui';

const TOTAL = QUESTIONS.length;

/** 진행 트랙 두께/마커 지름 (시안 실측: 라인 w10, 원 30) */
const TRACK_HEIGHT = 10;
const MARKER_SIZE = 30;

/** 5단계 스케일 (위=A 방향 음수, 아래=B 방향 양수 — 기획 CSV·엔진 AnswerValue와 동일) */
const STEP_VALUES: readonly AnswerValue[] = [-25, -12.5, 0, 12.5, 25];
const STEP_LABELS = ['선호', '조금선호', '비슷', '조금선호', '선호'] as const;
/** 스케일 도트 지름·세로 트랙 두께 (시안: 도트 30, 라인 w5) */
const DOT_SIZE = 30;
const SCALE_TRACK_WIDTH = 5;

const P = figmaAssets.photos;

interface OptionMedia {
  photo?: number;
  /** 사진 미배치 문항(Q11·12) — 시안대로 컬러 카드 */
  color?: string;
}

/** 문항 id → 위(A)/아래(B) 카드 미디어 (시안 641:1041~675:585 실측) */
const QUESTION_MEDIA: Record<string, { a: OptionMedia; b: OptionMedia }> = {
  Q001: { a: { photo: P.testQ01A }, b: { photo: P.testQ01B } },
  Q002: { a: { photo: P.testQ02A }, b: { photo: P.testQ02B } },
  Q003: { a: { photo: P.testQ03A }, b: { photo: P.testQ03B } },
  Q004: { a: { photo: P.testQ04A }, b: { photo: P.testQ04B } },
  Q005: { a: { photo: P.testQ05A }, b: { photo: P.testQ05B } },
  Q006: { a: { photo: P.testQ06A }, b: { photo: P.testQ06B } },
  Q007: { a: { photo: P.testQ07A }, b: { photo: P.testQ07B } },
  Q008: { a: { photo: P.testQ08A }, b: { photo: P.testQ08B } },
  Q009: { a: { photo: P.testQ09A }, b: { photo: P.testQ09B } },
  Q010: { a: { photo: P.testQ10A }, b: { photo: P.testQ10B } },
  Q011: { a: { color: palette.purple }, b: { color: palette.coral } },
  Q012: { a: { color: palette.brown }, b: { color: colors.primary } },
};

/** 카드 표시용 라벨 개행(시안 각 프레임 텍스트 노드 원문 — 고아줄 방지). 스크린리더는 CSV 원문 낭독 */
const LABEL_BREAKS: Record<string, { a: string; b: string }> = {
  Q001: { a: '마음이 차분해지는\n조용한 활동', b: '에너지가 생기는\n활동적인 활동' },
  Q002: { a: '앉아서 한 일에\n집중하는 장면', b: '돌아다니거나\n몸을 움직이는 장면' },
  Q003: { a: '혼자서 또는\n소수로 조용히 해보기', b: '비슷한 관심사를\n가진 여러사람들' },
  Q004: { a: '각자 속도대로\n편하게 즐기는 분위기', b: '서로 자연스럽게\n알아가는 분위기' },
  Q005: { a: '보고 듣고 느끼며\n감상하는 순간', b: '직접 만들어보고\n연습하고 해보는 순간' },
  Q006: { a: '해설이 있는 전시\n또는 음악감상', b: '직접 만들거나\n연습하는 워크숍' },
  Q007: { a: '하는 동안의\n시간 과정이 좋았다', b: '만든 뚜렷한 결과물을\n얻어 좋았다' },
  Q008: { a: '활동하는 동안\n편안하게 몰입하는', b: '보이는 발전과\n완성물을 얻는 것' },
  Q009: { a: '감정과 취향\n나만의 분위기를 채운', b: '실생활에 바로\n도움이 되는' },
  Q010: { a: '꽃, 향, 미술, 음악 같은\n감성을 채우는', b: '요리, 디지털, 건강,\n집 관리 같은 실용적인' },
  Q011: { a: '익숙한 활동을\n조금 새롭게 즐기는', b: '한 번도 해보지 않은\n활동 경험하기' },
  Q012: { a: '부담없이 한번\n가볍게 체험하기', b: '꾸준히 배우며\n깊게 즐기기' },
};

/** 상단 진행 트랙 — 회색 라인 + 파랑 채움 + 파랑 원형 마커 */
function ProgressTrack({ fraction }: { fraction: number }) {
  const [width, setWidth] = useState(0);
  const usable = Math.max(0, width - MARKER_SIZE);
  const markerLeft = usable * fraction;
  return (
    // 장식용 — 진행률은 'N / 12' 텍스트가 이미 낭독하므로 보조기술에서 숨김
    <View
      style={styles.trackWrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      aria-hidden
    >
      <View style={styles.trackLine} />
      {width > 0 && (
        <>
          <View style={[styles.trackFill, { width: markerLeft + MARKER_SIZE / 2 }]} />
          <View style={[styles.trackMarker, { left: markerLeft }]} />
        </>
      )}
    </View>
  );
}

/** 옵션 카드 — 사진 r20(컬러 카드는 시안대로 r32) + 흰 라벨 오버레이(좌측 스크림으로 가독 확보) */
function OptionCard({ media, label, display }: { media: OptionMedia; label: string; display?: string }) {
  return (
    <View
      style={[
        styles.optionCard,
        media.color != null && { backgroundColor: media.color, borderRadius: radius.xxxl },
      ]}
      accessibilityLabel={label}
    >
      {media.photo != null && (
        <>
          <Image source={media.photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          {/* 밝은 사진에서도 흰 라벨이 읽히게 좌→우 스크림 */}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.95, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      <AppText variant="bodyLg" color={palette.white} style={styles.optionLabel}>
        {display ?? label}
      </AppText>
    </View>
  );
}

interface ScaleProps {
  /** 선택 스텝 인덱스(0~4), 미선택 null */
  value: number | null;
  onChange: (index: number) => void;
  /** 위/아래 선택지 라벨(스크린리더 안내용) */
  labelA: string;
  labelB: string;
}

/** 세로 5단계 선호 스케일 — 트랙 + 도트 5개 + 우측 라벨, 채움은 중앙↔선택 구간 */
function PreferenceScale({ value, onChange, labelA, labelB }: ScaleProps) {
  const [height, setHeight] = useState(0);
  // 도트 중심 간격: 첫/마지막 도트를 스텝 행 중앙에 두고 균등 분배
  const stepH = height / STEP_LABELS.length;
  const centerOf = (i: number) => stepH * i + stepH / 2;
  const mid = 2;
  const fillTop = value == null ? 0 : Math.min(centerOf(value), centerOf(mid));
  const fillHeight = value == null ? 0 : Math.abs(centerOf(value) - centerOf(mid));

  const a11yOf = (i: number) =>
    i === 2
      ? '두 선택지가 비슷해요'
      : `${i < 2 ? labelA : labelB} ${STEP_LABELS[i] === '선호' ? '선호' : '조금 선호'}`;

  return (
    <View
      style={styles.scale}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      role="radiogroup"
      accessibilityLabel={`${labelA} / ${labelB} 선호도 선택`}
    >
      {height > 0 && (
        <>
          <View
            style={[
              styles.scaleTrack,
              { top: centerOf(0), height: centerOf(STEP_LABELS.length - 1) - centerOf(0) },
            ]}
          />
          {value != null && value !== mid && (
            <View style={[styles.scaleFill, { top: fillTop, height: fillHeight }]} />
          )}
        </>
      )}
      {STEP_LABELS.map((label, i) => {
        const selected = value === i;
        // 선택 방향(위/아래) 라벨을 블루로 — 시안 641:1041/675:585 상태 실측
        const directionActive =
          value != null && ((value < mid && i < mid) || (value > mid && i > mid) || (value === mid && i === mid));
        // 채움 경로 위 중간 도트(±25 선택 시 조금선호)는 블루 외곽선 — 시안 675:585
        const midDot =
          value != null && ((value < mid && i > value && i < mid) || (value > mid && i < value && i > mid));
        return (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            role="radio"
            aria-checked={selected}
            accessibilityLabel={a11yOf(i)}
            style={styles.scaleStep}
          >
            <View
              style={[styles.scaleDot, midDot && styles.scaleDotMid, selected && styles.scaleDotSelected]}
            />
            <AppText
              variant="bodyLg"
              color={directionActive ? colors.primaryText : colors.textSecondary}
              weight={selected ? 'bold' : 'regular'}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  const selectedStep = selected == null ? null : STEP_VALUES.indexOf(selected);
  const media = QUESTION_MEDIA[question.id] ?? { a: { color: colors.primary }, b: { color: palette.coral } };

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

  const select = (step: number) => {
    if (submitting.current) return;
    const next = [...values];
    next[idx] = STEP_VALUES[step];
    setValues(next);
    void setTestProgress(next, idx); // 이탈 대비 저장(현재 문항 유지)
  };

  /** '다음으로' — 선택 후에만 진행, 마지막 문항이면 제출 */
  const goNext = () => {
    if (submitting.current || selected == null) return;
    if (idx < TOTAL - 1) {
      setIdx(idx + 1);
      void setTestProgress(values, idx + 1);
    } else {
      void finish(values);
    }
  };

  const exitTest = () => {
    if (submitting.current) return;
    // 진행분은 로컬에 남아 있어 다음에 이어서 할 수 있다
    router.replace('/test');
  };

  if (restoring) {
    return (
      <Screen>
        <View style={styles.restoring}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const canNext = selected != null && !submitting.current;

  return (
    <Screen>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* 로고(탭 = 테스트 나가기 — 시안엔 별도 닫기 없음) */}
        <Pressable
          onPress={exitTest}
          accessibilityRole="button"
          accessibilityLabel="테스트 나가기"
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.logoBtn, pressed && styles.pressedDim]}
        >
          <FeellogLogo width={106} />
        </Pressable>

        {/* 진행 라벨: N / 12 (좌) · QN (우) */}
        <View style={styles.progressLabelRow}>
          <AppText variant="bodyLg" color={colors.primaryText} tabular>
            {idx + 1} / {TOTAL}
          </AppText>
          <AppText variant="bodyLg" color={colors.primaryText} tabular>
            Q{idx + 1}
          </AppText>
        </View>

        <ProgressTrack fraction={TOTAL > 1 ? idx / (TOTAL - 1) : 0} />

        {/* 질문 */}
        <AppText variant="h3" style={styles.prompt}>
          {question.prompt}?
        </AppText>

        <View style={styles.spacerSm} />

        {/* 좌: 옵션 카드 2장 / 우: 5단계 선호 스케일 */}
        <View style={styles.answerRow}>
          <View style={styles.optionsCol}>
            <OptionCard media={media.a} label={question.choiceA} display={LABEL_BREAKS[question.id]?.a} />
            <OptionCard media={media.b} label={question.choiceB} display={LABEL_BREAKS[question.id]?.b} />
          </View>
          <PreferenceScale
            value={selectedStep === -1 ? null : selectedStep}
            onChange={select}
            labelA={question.choiceA}
            labelB={question.choiceB}
          />
        </View>

        <View style={styles.spacerLg} />

        {/* 다음으로 — 선택 전 연블루 비활성(시안 State=Disabled) */}
        <Pressable
          onPress={goNext}
          disabled={!canNext}
          accessibilityRole="button"
          accessibilityLabel={idx < TOTAL - 1 ? '다음 문항으로' : '테스트 완료'}
          accessibilityState={{ disabled: !canNext }}
          style={({ pressed }) => [
            styles.nextBtn,
            canNext ? styles.nextBtnEnabled : styles.nextBtnDisabled,
            pressed && canNext && styles.nextBtnPressed,
          ]}
        >
          {/* 비활성일 때도 '다음 단계' 존재가 읽히게 — 연블루 위 흰 글자 대신 딥블루 */}
          <AppText variant="titleW" color={canNext ? palette.white : colors.primaryText}>
            다음으로
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
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
  body: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  logoBtn: {
    alignSelf: 'flex-start',
    minHeight: MIN_TOUCH_SIZE, // 웹은 hitSlop 미적용 — 실터치 48 확보
    justifyContent: 'center',
    marginVertical: -spacing.sm, // 늘어난 세로 공간 상쇄(시안 간격 유지)
  },
  pressedDim: {
    opacity: 0.7,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  // ── 상단 진행 트랙 ──
  trackWrap: {
    height: MARKER_SIZE,
    justifyContent: 'center',
    marginTop: spacing.base,
  },
  trackLine: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  trackMarker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  prompt: {
    paddingTop: spacing.xxl,
    maxWidth: 320,
  },
  spacerSm: {
    flexGrow: 1,
    // 질문-선택지가 한 덩어리로 읽히게 간격 상한(긴 화면에서 과도 이격 방지)
    maxHeight: spacing.huge + spacing.sm,
    minHeight: spacing.lg,
  },
  spacerLg: {
    flexGrow: 1.4,
    minHeight: spacing.xxl,
  },
  // ── 응답 영역 ──
  answerRow: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'stretch',
  },
  optionsCol: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  optionCard: {
    aspectRatio: 208 / 116,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInset,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    ...shadows.card,
  },
  optionLabel: {
    maxWidth: 190,
    // 사진 위 흰 글자 가독 보강(시안엔 별도 스크림 없음)
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // ── 세로 5단계 스케일 ──
  scale: {
    width: 120, // 도트 30 + 라벨 18px('조금선호') 한 줄 수용
    justifyContent: 'space-between',
  },
  scaleTrack: {
    position: 'absolute',
    left: DOT_SIZE / 2 - SCALE_TRACK_WIDTH / 2,
    width: SCALE_TRACK_WIDTH,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
  },
  scaleFill: {
    position: 'absolute',
    left: DOT_SIZE / 2 - SCALE_TRACK_WIDTH / 2,
    width: SCALE_TRACK_WIDTH,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  scaleStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
  },
  scaleDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary, // 시안 #A8A7A3 — 흰 배경 위 경계 3:1 확보 위해 보정
  },
  scaleDotMid: {
    borderColor: colors.primary,
  },
  scaleDotSelected: {
    // 배경(#F8F8F8) 위 상태 표시 3:1 확보 — 브랜드 블루(2.87:1) 대신 다크블루
    backgroundColor: colors.primaryPressed,
    borderColor: colors.primaryPressed,
  },
  // ── 다음으로 ──
  nextBtn: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    // 시안 364 프레임 좌우 44 인셋(276x56) — Screen 패딩 20 + 24
    marginHorizontal: spacing.xl,
  },
  nextBtnEnabled: {
    backgroundColor: colors.primary,
    ...shadows.cta,
  },
  nextBtnDisabled: {
    backgroundColor: colors.primaryTint,
  },
  nextBtnPressed: {
    backgroundColor: colors.primaryPressed,
  },
});
