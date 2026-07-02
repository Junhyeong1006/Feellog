/**
 * LegalDocument — 약관/방침 전문 화면 공통 레이아웃.
 * 헤더(뒤로가기) + 제목/버전/시행일 + 섹션 목록. 내용은 페이지에서 주입.
 * ⚠️ 현재 문안은 초안(draft) — 법무 확인 후 최종본으로 교체.
 */
import { ScrollView, StyleSheet, View } from 'react-native';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, CONTENT_WIDTH, spacing } from '@/tokens';
import { AppText, Badge, Screen, ScreenHeader } from '@/ui';

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocumentProps {
  title: string;
  version: string;
  effectiveDate: string;
  draft?: boolean;
  sections: LegalSection[];
}

export function LegalDocument({
  title,
  version,
  effectiveDate,
  draft = true,
  sections,
}: LegalDocumentProps) {
  const { isDesktop } = useBreakpoint();

  return (
    <Screen edges={['top', 'bottom']} noPadding maxWidth={isDesktop ? CONTENT_WIDTH.reading : undefined}>
      <ScreenHeader title={title} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <AppText variant="caption" muted>
            시행일 {effectiveDate} · {version}
          </AppText>
          {draft && <Badge label="초안" tone="coral" size="sm" />}
        </View>

        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <AppText variant="title" style={styles.heading}>
              {s.heading}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.body}>
              {s.body}
            </AppText>
          </View>
        ))}

        <AppText variant="caption" muted style={styles.footerNote}>
          본 문서는 초안이며, 정식 서비스 오픈 전 최종본으로 갱신됩니다.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  heading: {
    lineHeight: 28,
  },
  body: {
    lineHeight: 28,
  },
  footerNote: {
    marginTop: spacing.md,
  },
});
