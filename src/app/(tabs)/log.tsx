/**
 * 기록 탭 (Figma 474-1139 데이터 있음 / 559-3366 빈 상태 정본).
 * [로고+장바구니 헤더] → [코랄 캘린더 카드(월 이동·기록 배지·날짜 시트)]
 * → [활동 변화: 최근 4개월 점 그래프 + 이번달 카테고리 도넛]
 * → [맞춤/기본 추천 가로 카드]. 모든 데이터는 로컬(useRecords/usePrefs/useCart) 기반.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { FeellogLogo } from '@/components/FeellogLogo';
import { RecordCalendar, dateKeyOf } from '@/components/RecordCalendar';
import { rankActivities, type Activity } from '@/core';
import { demoPhoto } from '@/data/activityDisplay';
import { ACTIVITY_SEED } from '@/data/activitySeed';
import { useCart, useRecords } from '@/hooks/useCollections';
import { usePrefs } from '@/hooks/usePrefs';
import type { LocalRecord } from '@/state/localCollections';
import {
  categoryColors,
  colors,
  MAX_CONTENT_WIDTH,
  MIN_TOUCH_SIZE,
  palette,
  radius,
  shadows,
  spacing,
} from '@/tokens';
import { AppText, Button, Card, Screen, Stars } from '@/ui';

/** 월별 점 색(스펙 474-1139: 코랄/퍼플/옐로/블루) */
const TREND_DOT_COLORS = [palette.coral, palette.purple, palette.yellow, palette.blue] as const;

function ymKeyOf(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → '7월 16일' */
function koreanDateOf(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

// ── 활동 변화: 최근 4개월 점 그래프 ──────────────────────────────
function MonthTrendChart({ labels, counts }: { labels: string[]; counts: number[] }) {
  const [width, setWidth] = useState(0);
  const H = 76;
  const PAD = 12;
  const max = Math.max(1, ...counts);
  const points = counts.map((c, i) => ({
    x: width * ((i + 0.5) / counts.length),
    y: H - PAD - (c / max) * (H - PAD * 2),
  }));
  const hasAny = counts.some((c) => c > 0);
  const a11y = labels.map((l, i) => `${l} ${counts[i]}건`).join(', ');

  return (
    <View
      style={styles.trendChart}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`최근 4개월 기록 수 — ${a11y}`}
    >
      <View style={styles.legendRow}>
        {TREND_DOT_COLORS.map((c) => (
          <View key={c} style={[styles.legendDot, { backgroundColor: c }]} />
        ))}
      </View>
      {width > 0 && (
        <Svg width={width} height={H}>
          {[0.25, 0.5, 0.75].map((t) => (
            <Line
              key={t}
              x1={0}
              y1={H * t}
              x2={width}
              y2={H * t}
              stroke={colors.divider}
              strokeWidth={0.5}
            />
          ))}
          {hasAny && (
            <Polyline
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2}
            />
          )}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={TREND_DOT_COLORS[i % TREND_DOT_COLORS.length]} />
          ))}
        </Svg>
      )}
      <View style={styles.trendLabels}>
        {labels.map((l) => (
          <AppText key={l} variant="small" muted center style={styles.trendLabel}>
            {l}
          </AppText>
        ))}
      </View>
    </View>
  );
}

// ── 활동 변화: 이번달 카테고리 도넛 ──────────────────────────────
function CategoryDonut({ monthRecords }: { monthRecords: LocalRecord[] }) {
  const SIZE = 96;
  const STROKE = 14;
  const r = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * r;

  const { segments, label } = useMemo(() => {
    const total = monthRecords.length;
    if (total === 0) return { segments: [] as { color: string; frac: number }[], label: '미등록' };
    const byCat = new Map<string, number>();
    for (const rec of monthRecords) {
      const cat = rec.category ?? '기타';
      byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
    }
    const entries = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
    const segs = entries.map(([cat, count]) => ({
      color: categoryColors[cat]?.main ?? colors.textMuted,
      frac: count / total,
    }));
    const topShare = entries[0][1] / total;
    const centerLabel = entries.length >= 2 && topShare <= 0.5 ? '균형적인' : entries[0][0];
    return { segments: segs, label: centerLabel };
  }, [monthRecords]);

  let acc = 0;
  return (
    <View
      style={{ width: SIZE, height: SIZE }}
      accessible
      accessibilityLabel={`이번달 활동 분포: ${label}${monthRecords.length > 0 ? `, 기록 ${monthRecords.length}건` : ''}`}
    >
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke={palette.brownSubtle}
          strokeWidth={STROKE}
          fill="none"
        />
        {segments.map((s, i) => {
          const dash = s.frac * C;
          const offset = -acc * C;
          acc += s.frac;
          return (
            <Circle
              key={i}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              stroke={s.color}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${dash} ${C}`}
              strokeDashoffset={offset}
              rotation={-90}
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          );
        })}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <AppText variant="small" muted>
          이번달
        </AppText>
        <AppText variant="caption" weight="bold" center numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

// ── 화면 ─────────────────────────────────────────────────────────
export default function LogScreen() {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { records, remove } = useRecords();
  const { items: cartItems, count: cartCount, remove: removeFromCart } = useCart();
  const { prefs } = usePrefs();

  // 최근 4개월(이번달 포함) 라벨·기록 수
  const trend = useMemo(() => {
    const labels: string[] = [];
    const counts: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${d.getMonth() + 1}월`);
      const key = ymKeyOf(d.getFullYear(), d.getMonth() + 1);
      counts.push(records.filter((r) => r.date.startsWith(key)).length);
    }
    return { labels, counts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  const monthRecords = useMemo(() => {
    const key = ymKeyOf(now.getFullYear(), now.getMonth() + 1);
    return records.filter((r) => r.date.startsWith(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  // 맞춤(성향 있음) / 기본(없음) 추천 3종
  const hasPrefs = prefs != null;
  const recoTitle = hasPrefs ? '맞춤 활동 추천' : '기본 추천';
  const recos: Activity[] = useMemo(() => {
    if (prefs) return rankActivities(prefs.current, ACTIVITY_SEED).slice(0, 3).map((s) => s.activity);
    return ACTIVITY_SEED.slice(0, 3) as Activity[];
  }, [prefs]);

  const dayRecords = selectedDate == null ? [] : records.filter((r) => r.date === selectedDate);

  const openNewRecord = (date: string) => {
    setSelectedDate(null);
    router.push({ pathname: '/record/new', params: { date } });
  };

  return (
    <Screen scroll noPadding edges={['top']}>
      {/* 헤더: 로고 + 장바구니 */}
      <View style={styles.header}>
        <FeellogLogo width={108} />
        <Pressable
          onPress={() => setCartOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`장바구니, ${cartCount}개 담김`}
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.cartBtn, pressed && styles.pressed]}
        >
          <Ionicons name="cart-outline" size={20} color={colors.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <AppText variant="small" weight="bold" color={colors.onPrimary} tabular>
                {cartCount}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>

      {/* 캘린더 */}
      <View style={styles.section}>
        <RecordCalendar
          year={view.year}
          month={view.month}
          records={records}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={(year, month) => setView({ year, month })}
        />
      </View>

      {/* 활동 변화 — 제목은 카드 안 좌상단(Figma 474-1139) */}
      <View style={styles.section}>
        <Card cornerRadius="md" padding="base" style={styles.trendCard}>
          <AppText variant="bodyLg" accessibilityRole="header" style={styles.trendTitle}>
            활동 변화
          </AppText>
          <View style={styles.trendRow}>
            <MonthTrendChart labels={trend.labels} counts={trend.counts} />
            <CategoryDonut monthRecords={monthRecords} />
          </View>
        </Card>
      </View>

      {/* 맞춤/기본 추천 */}
      <View style={styles.recoHead}>
        <AppText variant="bodyLg" accessibilityRole="header">
          {recoTitle}
        </AppText>
      </View>
      <ScrollView
        style={styles.recoScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recoRow}
      >
        {recos.map((a) => (
          <Card
            key={a.id}
            onPress={() => router.push(`/activity/${a.id}`)}
            accessibilityLabel={`${a.title} 상세 보기`}
            cornerRadius="sm"
            padding="md"
            style={styles.recoCard}
          >
            <View style={styles.recoInner}>
              <Image
                source={demoPhoto(a)}
                style={styles.recoPhoto}
                contentFit="cover"
                accessibilityLabel={`${a.title} 사진`}
              />
              <View style={styles.recoTexts}>
                <AppText variant="caption" numberOfLines={1}>
                  {a.title}
                </AppText>
                <AppText variant="small" muted numberOfLines={2}>
                  {a.summary}
                </AppText>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.bottomSpace} />

      {/* 날짜 상세 시트 */}
      <Modal
        visible={selectedDate != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedDate(null)}
            accessibilityRole="button"
            accessibilityLabel="시트 닫기"
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <AppText variant="title" accessibilityRole="header">
              {selectedDate != null ? koreanDateOf(selectedDate) : ''}
            </AppText>
            {dayRecords.length === 0 ? (
              <AppText muted>이 날의 기록이 없어요.</AppText>
            ) : (
              dayRecords.map((r) => (
                <View key={r.id} style={styles.recordRow}>
                  <View
                    style={[
                      styles.recordDot,
                      {
                        backgroundColor:
                          r.category != null
                            ? (categoryColors[r.category]?.main ?? colors.primary)
                            : colors.primary,
                      },
                    ]}
                  />
                  <View style={styles.recordBody}>
                    <AppText variant="body2" numberOfLines={1}>
                      {r.title}
                    </AppText>
                    {r.satisfaction != null && r.satisfaction > 0 && (
                      <Stars value={r.satisfaction} size={16} />
                    )}
                  </View>
                  <Pressable
                    onPress={() => remove(r.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.title} 기록 삭제`}
                    style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))
            )}
            <Button
              label="이 날 기록 남기기"
              fullWidth
              onPress={() => {
                if (selectedDate != null) openNewRecord(selectedDate);
              }}
            />
          </View>
        </View>
      </Modal>

      {/* 장바구니 시트 */}
      <Modal
        visible={cartOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCartOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCartOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="장바구니 닫기"
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <AppText variant="title" accessibilityRole="header">
              장바구니
            </AppText>
            {cartItems.length === 0 ? (
              <AppText muted>아직 담은 클래스가 없어요.</AppText>
            ) : (
              cartItems.map((item) => {
                const act = ACTIVITY_SEED.find((a) => a.id === item.activityId);
                if (!act) return null;
                return (
                  <View key={item.activityId} style={styles.recordRow}>
                    <Pressable
                      style={styles.recordBody}
                      onPress={() => {
                        setCartOpen(false);
                        router.push(`/activity/${act.id}`);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${act.title} 상세 보기`}
                    >
                      <AppText variant="body2" numberOfLines={1}>
                        {act.title}
                      </AppText>
                      <AppText variant="small" muted tabular>
                        수량 {item.qty}
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() => removeFromCart(item.activityId)}
                      accessibilityRole="button"
                      accessibilityLabel={`${act.title} 장바구니에서 빼기`}
                      style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })
            )}
            <Button label="닫기" variant="secondary" fullWidth onPress={() => setCartOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  recoScroll: {
    flexGrow: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.accentCoral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  trendTitle: {
    marginBottom: spacing.sm,
  },
  trendCard: {
    marginTop: spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trendChart: {
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
  },
  trendLabels: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  trendLabel: {
    flex: 1,
  },
  donutCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoHead: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  recoRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  recoCard: {
    width: 303,
  },
  recoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recoPhoto: {
    width: 84,
    height: 73,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceInset,
  },
  recoTexts: {
    flex: 1,
    gap: 2,
  },
  bottomSpace: {
    height: spacing.xl,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    ...shadows.floating,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  recordDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  recordBody: {
    flex: 1,
    gap: 2,
  },
  deleteBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
