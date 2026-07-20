/**
 * RecordCalendar — 기록 탭 코랄 캘린더 카드 (Figma 474-1139 / 559-3366 정본).
 * 상단 코랄 밴드 '< 2026.07 >' 월 이동 + 요일 행(일~토, 오늘 요일만 블루) + 날짜 그리드.
 * 기록이 있는 날짜는 카테고리 색(categoryColors[category].main) 원형 배지로 채운다.
 * 오늘은 블루 틴트 링, 선택일은 뉴트럴 음영(시안의 27일)으로 표시.
 */
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { LocalRecord } from '@/state/localCollections';
import { categoryColors, colors, fontFamily, radius, shadows, spacing } from '@/tokens';
import { AppText } from '@/ui';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 'YYYY-MM-DD' 키 (LocalRecord.date와 동일 포맷) */
export function dateKeyOf(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** 기록 → 캘린더 배지 색 (카테고리 없으면 브랜드 블루) */
function recordColor(record: LocalRecord): string {
  if (record.category && categoryColors[record.category]) {
    return categoryColors[record.category].main;
  }
  return colors.primary;
}

export interface RecordCalendarProps {
  /** 표시 연도 */
  year: number;
  /** 표시 월(1~12) */
  month: number;
  records: readonly LocalRecord[];
  /** 선택된 날짜('YYYY-MM-DD') — 음영 표시 */
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}

export function RecordCalendar({
  year,
  month,
  records,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: RecordCalendarProps) {
  const now = new Date();
  const todayKey = dateKeyOf(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const viewingCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  // 날짜 → 그 날의 기록 목록
  const byDate = useMemo(() => {
    const map = new Map<string, LocalRecord[]>();
    for (const r of records) {
      const list = map.get(r.date);
      if (list) list.push(r);
      else map.set(r.date, [r]);
    }
    return map;
  }, [records]);

  // 앞쪽 빈 칸(null) + 1~말일
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const list: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    return list;
  }, [year, month]);

  const goPrev = () => {
    if (month === 1) onChangeMonth(year - 1, 12);
    else onChangeMonth(year, month - 1);
  };
  const goNext = () => {
    if (month === 12) onChangeMonth(year + 1, 1);
    else onChangeMonth(year, month + 1);
  };

  return (
    <View style={styles.card}>
      {/* 코랄 헤더 밴드 */}
      <View style={styles.band}>
        <Pressable
          onPress={goPrev}
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.bandBtn, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.onPrimary} />
        </Pressable>
        <AppText
          tabular
          color={colors.onPrimary}
          style={styles.bandTitle}
          accessibilityRole="header"
          accessibilityLabel={`${year}년 ${month}월`}
        >
          {`${year}.${pad2(month)}`}
        </AppText>
        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.bandBtn, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {/* 요일 행 */}
      <View style={styles.weekRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {WEEKDAYS.map((w, i) => {
          const isTodayCol = viewingCurrentMonth && now.getDay() === i;
          return (
            <View key={w} style={styles.cell}>
              <AppText
                variant="caption"
                weight="medium"
                color={isTodayCol ? colors.primary : colors.textSecondary}
              >
                {w}
              </AppText>
            </View>
          );
        })}
      </View>

      {/* 날짜 그리드 */}
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d == null) return <View key={`empty-${i}`} style={styles.cell} />;
          const key = dateKeyOf(year, month, d);
          const dayRecords = byDate.get(key) ?? [];
          const fill = dayRecords.length > 0 ? recordColor(dayRecords[0]) : null;
          const isSelected = selectedDate === key;
          const isToday = todayKey === key;
          const label =
            `${month}월 ${d}일` +
            (dayRecords.length > 0 ? `, 기록 ${dayRecords.length}건` : ', 기록 없음');
          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(key)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.dayCircle,
                  fill != null && { backgroundColor: fill },
                  fill == null && isSelected && styles.selectedCircle,
                  fill == null && !isSelected && isToday && styles.todayCircle,
                ]}
              >
                <AppText
                  variant="bodyLg"
                  weight="bold"
                  tabular
                  color={
                    fill != null
                      ? colors.onPrimary
                      : isToday
                        ? colors.primary
                        : colors.textPrimary
                  }
                >
                  {d}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    paddingBottom: spacing.md,
    ...shadows.card,
  },
  band: {
    backgroundColor: colors.accentCoral,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bandTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    lineHeight: 30,
    minWidth: 104,
    textAlign: 'center',
  },
  bandBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
  },
  cell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: colors.surfaceInset,
  },
  todayCircle: {
    backgroundColor: colors.primaryTint,
  },
  pressed: {
    opacity: 0.7,
  },
});
