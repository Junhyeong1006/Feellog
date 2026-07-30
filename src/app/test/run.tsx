/**
 * 성향 테스트 진행 (26.07 온보딩작업 시안 — Figma 641:1041/669:808).
 * 라이트 배경 + 상단 로고 + 진행 트랙(둥근 마커) + 질문 + 텍스트 선택 카드 2장 +
 * '다음으로' 버튼(선택 전 비활성 연블루). 카드 선택 = A(-25)/B(+25) 기록 후 버튼으로 진행.
 * 중도 이탈 대비 응답을 로컬 저장(이어하기), 12문 완료 시 diagnose → 결과로 이동.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { saveInitialPrefs } from '@/api/preferences';
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
/** 선택 카드 아이콘 원 지름 (시안: A 38 / B 36 — 공통 38로 통일) */
const OPTION_ICON_SIZE = 38;

/** 진행 트랙 — 회색 라인 + 파랑 채움 + 파랑 원형 마커(채움 끝) */
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

interface OptionCardProps {
  label: string;
  /** A=차분(민트 잎) / B=활동(파랑 사람) — 시안 고정 아이콘 */
  kind: 'calm' | 'active';
  selected: boolean;
  /** 다른 카드가 선택돼 이 카드가 흐려지는 상태 */
  dimmed: boolean;
  onPress: () => void;
}

/** 텍스트 선택 카드 — 흰 카드 + 컬러 아이콘 원, 선택 시 연블루 배경 + 파랑 보더 3 */
function OptionCard({ label, kind, selected, dimmed, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.cardIcon, kind === 'calm' ? styles.cardIconCalm : styles.cardIconActive]}>
        {/* 잎 아이콘: 시안은 연민트(#E0FAF2)지만 민트 원 위 1.35:1이라 AA 보정 딥민트 사용(todo.md 승인 항목) */}
        <Ionicons
          name={kind === 'calm' ? 'leaf' : 'walk'}
          size={20}
          color={kind === 'calm' ? palette.mintDeep : palette.white}
        />
      </View>
      <AppText
        variant="bodyLg"
        color={dimmed ? colors.textSecondary : colors.textPrimary}
        style={styles.cardLabel}
      >
        {label}
      </AppText>
    </Pressable>
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
    if (submitting.current) return;
    const next = [...values];
    next[idx] = val;
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

        {/* 선택 카드 2장 */}
        <View style={styles.options}>
          <OptionCard
            label={question.choiceA}
            kind="calm"
            selected={selected === -25}
            dimmed={selected != null && selected !== -25}
            onPress={() => select(-25)}
          />
          <OptionCard
            label={question.choiceB}
            kind="active"
            selected={selected === 25}
            dimmed={selected != null && selected !== 25}
            onPress={() => select(25)}
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
          {/* 비활성일 때도 '다음 단계' 존재가 읽히게 — 연블루 위 흰 글자(1.2:1) 대신 딥블루 */}
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
  // ── 진행 트랙 ──
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
  },
  spacerLg: {
    flexGrow: 1.4,
    minHeight: spacing.xxl,
  },
  // ── 선택 카드 ──
  options: {
    gap: spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 61,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardSelected: {
    backgroundColor: colors.primaryTint,
    borderWidth: 3,
    borderColor: colors.primary,
    // 보더 1→3 증가분 상쇄(레이아웃 흔들림 방지)
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm - 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardIcon: {
    width: OPTION_ICON_SIZE,
    height: OPTION_ICON_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconCalm: {
    backgroundColor: palette.mint,
  },
  cardIconActive: {
    backgroundColor: colors.primary,
  },
  cardLabel: {
    flex: 1,
  },
  // ── 다음으로 ──
  nextBtn: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
