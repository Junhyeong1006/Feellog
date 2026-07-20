/**
 * 마이 > 공지사항 읽기 — Figma v6 (593-4249).
 * 아코디언 리스트: 첫 항목(점검 안내 + 중요) 기본 펼침, 나머지(이벤트/안내) 접힘.
 * 배지 색: 점검=블루 · 중요=코랄(핀) · 이벤트=옐로 · 안내=퍼플. 로컬 샘플 데이터로 완결.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, palette, radius, shadows, spacing } from '@/tokens';
import { AppText, Divider, Screen, ScreenHeader } from '@/ui';

interface NoticeTag {
  label: string;
  color: string;
  /** 중요 배지의 핀 아이콘 */
  pin?: boolean;
}

interface Notice {
  id: string;
  tags: NoticeTag[];
  date: string;
  title: string;
  body: string;
}

const NOTICES: Notice[] = [
  {
    id: 'maintenance-0722',
    tags: [
      { label: '점검 안내', color: palette.blue },
      { label: '중요', color: palette.coral, pin: true },
    ],
    date: '2027년 07월 20일',
    title: '7월 22일 새벽 서버 점검 안내',
    body:
      '안녕하세요, Feellog입니다.\n더 안정적인 서비스 제공을 위해 아래 일정으로 서버 점검을 진행합니다.\n\n· 일시: 7월 22일(수) 오전 2시 ~ 4시\n· 영향: 점검 시간 동안 예약 및 결제 이용이 일시 중단됩니다.\n\n이용에 불편을 드려 죄송합니다. 더 나은 모습으로 찾아뵙겠습니다.',
  },
  {
    id: 'event-summer-coupon',
    tags: [{ label: '이벤트', color: palette.yellow }],
    date: '2027년 07월 16일',
    title: '여름맞이 클래스 20% 할인 쿠폰',
    body:
      '여름을 맞아 전 클래스에 쓸 수 있는 20% 할인 쿠폰을 드려요.\n예약 결제 화면에서 자동으로 적용됩니다. (7월 31일까지)',
  },
  {
    id: 'privacy-update',
    tags: [{ label: '안내', color: palette.purple }],
    date: '2027년 07월 15일',
    title: '개인정보 처리방침 개정 사전 안내',
    body:
      '8월 1일자로 개인정보 처리방침이 개정될 예정입니다.\n주요 변경: 보관 기간 명확화, 위탁 업체 목록 최신화.\n자세한 내용은 마이 > 개인정보처리방침에서 확인하실 수 있어요.',
  },
  {
    id: 'notification-guide',
    tags: [{ label: '안내', color: palette.purple }],
    date: '2027년 07월 15일',
    title: '알림 설정 안내',
    body:
      '마이 > 알림 끄고 켜기에서 활동 알림을 켜시면\n예약 추천과 이벤트 소식을 앱 상단에서 받아 보실 수 있어요.',
  },
];

/** 스펙: 원색 필 배지(r9999, 흰 라벨) — 공용 Badge는 틴트 배경이라 전용으로 그림 */
function NoticeBadge({ tag }: { tag: NoticeTag }) {
  return (
    <View style={[styles.badge, { backgroundColor: tag.color }]}>
      {tag.pin && <Ionicons name="pin" size={11} color={colors.onPrimary} />}
      <AppText variant="small" weight="bold" color={colors.onPrimary}>
        {tag.label}
      </AppText>
    </View>
  );
}

function NoticeItem({
  notice,
  expanded,
  onToggle,
}: {
  notice: Notice;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`공지 ${notice.title}, ${expanded ? '접기' : '펼치기'}`}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View style={styles.itemTop}>
        <View style={styles.tags}>
          {notice.tags.map((tag) => (
            <NoticeBadge key={tag.label} tag={tag} />
          ))}
        </View>
        <AppText variant="caption" muted tabular>
          {notice.date}
        </AppText>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={expanded ? colors.primary : colors.textMuted}
        />
      </View>

      <AppText variant="title">{notice.title}</AppText>

      {expanded && (
        <AppText variant="bodyLg" style={styles.body}>
          {notice.body}
        </AppText>
      )}
    </Pressable>
  );
}

export default function NoticesScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(NOTICES[0].id);

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
      <ScreenHeader title="공지사항 읽기" />

      <View style={styles.list}>
        {NOTICES.map((notice, i) => (
          <View key={notice.id}>
            {i > 0 && <Divider color={colors.divider} />}
            <NoticeItem
              notice={notice}
              expanded={expandedId === notice.id}
              onToggle={() => setExpandedId((cur) => (cur === notice.id ? null : notice.id))}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  item: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  itemPressed: {
    backgroundColor: colors.surfaceInset,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tags: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  body: {
    // 스펙: 본문 SUIT 600 18 lh28.8 #1C1C1A
    lineHeight: 29,
  },
});
