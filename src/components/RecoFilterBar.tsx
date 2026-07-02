/**
 * RecoFilterBar — 추천 하드필터(지역/참가비) 선택 UI (S5).
 * 칩 2개 → 큰 옵션 시트(모달). 시니어 UX: 옵션당 56px 행, 현재 선택 ✓ 표시, 옵션 수 최소화.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PRICE_OPTIONS, priceLabelOf, type StoredRecoFilter } from '@/state/recoFilter';
import { colors, MIN_TOUCH_SIZE, radius, shadows, spacing } from '@/tokens';
import { AppText } from '@/ui';

export interface RecoFilterBarProps {
  filter: StoredRecoFilter;
  regions: string[];
  onChange: (next: StoredRecoFilter) => void;
}

type SheetKind = 'region' | 'price' | null;

export function RecoFilterBar({ filter, regions, onChange }: RecoFilterBarProps) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const { isDesktop } = useBreakpoint();

  const regionActive = filter.regionSido != null;
  const priceActive = filter.maxPrice != null;

  const close = () => setSheet(null);

  return (
    <View style={styles.row}>
      <FilterChip
        label={`지역 · ${filter.regionSido ?? '전체'}`}
        active={regionActive}
        onPress={() => setSheet('region')}
        accessibilityLabel={`지역 필터, 현재 ${filter.regionSido ?? '전체'}`}
      />
      <FilterChip
        label={`참가비 · ${priceLabelOf(filter.maxPrice)}`}
        active={priceActive}
        onPress={() => setSheet('price')}
        accessibilityLabel={`참가비 필터, 현재 ${priceLabelOf(filter.maxPrice)}`}
      />

      <Modal visible={sheet != null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="필터 닫기">
          <Pressable
            style={[styles.sheet, isDesktop ? styles.sheetDesktop : styles.sheetMobile]}
            // 시트 내부 탭이 backdrop 닫기로 전파되지 않게
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHead}>
              <AppText variant="title">{sheet === 'region' ? '지역 선택' : '참가비 선택'}</AppText>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="닫기" style={styles.closeBtn}>
                <AppText style={styles.closeIcon} color={colors.textMuted}>
                  ✕
                </AppText>
              </Pressable>
            </View>

            <ScrollView style={styles.optionScroll} showsVerticalScrollIndicator={false}>
              {sheet === 'region' && (
                <>
                  <OptionRow
                    label="전체 지역"
                    selected={filter.regionSido == null}
                    onPress={() => {
                      onChange({ ...filter, regionSido: null });
                      close();
                    }}
                  />
                  {regions.map((r) => (
                    <OptionRow
                      key={r}
                      label={r}
                      selected={filter.regionSido === r}
                      onPress={() => {
                        onChange({ ...filter, regionSido: r });
                        close();
                      }}
                    />
                  ))}
                </>
              )}

              {sheet === 'price' &&
                PRICE_OPTIONS.map((o) => (
                  <OptionRow
                    key={String(o.value)}
                    label={o.label}
                    selected={filter.maxPrice === o.value}
                    onPress={() => {
                      onChange({ ...filter, maxPrice: o.value });
                      close();
                    }}
                  />
                ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <AppText
        variant="body"
        weight="semibold"
        color={active ? colors.primaryInk : colors.textSecondary}
      >
        {label}
      </AppText>
      <AppText variant="caption" color={active ? colors.primaryInk : colors.textMuted}>
        ▾
      </AppText>
    </Pressable>
  );
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
    >
      <AppText variant="body" weight={selected ? 'bold' : 'regular'} color={selected ? colors.primaryInk : colors.textPrimary}>
        {label}
      </AppText>
      {selected && (
        <AppText variant="body" weight="bold" color={colors.primaryInk}>
          ✓
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.75,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.raised,
  },
  sheetMobile: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '75%',
  },
  sheetDesktop: {
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    width: 420,
    borderRadius: radius.xxl,
    maxHeight: '80%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  closeBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  optionScroll: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionPressed: {
    backgroundColor: colors.surfaceInset,
  },
});
