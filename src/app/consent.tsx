/**
 * 동의 게이트 — 로그인 후 최초 1회. 필수(이용약관/개인정보) + 선택(마케팅).
 * 동의 이력은 user_consents에 append, profiles.consented_at 기록 후 디사이더로 복귀.
 */
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { recordConsents } from '@/api/consents';
import { markConsented } from '@/api/profiles';
import { CONSENT_ITEMS, type ConsentKind } from '@/config/legal';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/tokens';
import { AppText, Button, Card, Checkbox, Divider, Screen } from '@/ui';

type ConsentState = Record<ConsentKind, boolean>;

const initialState = (): ConsentState =>
  CONSENT_ITEMS.reduce((acc, item) => {
    acc[item.kind] = false;
    return acc;
  }, {} as ConsentState);

export default function ConsentScreen() {
  const { refreshProfile } = useAuth();
  const [state, setState] = useState<ConsentState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = CONSENT_ITEMS.every((i) => state[i.kind]);
  const requiredMet = useMemo(
    () => CONSENT_ITEMS.filter((i) => i.required).every((i) => state[i.kind]),
    [state],
  );

  const toggle = (kind: ConsentKind) => setState((s) => ({ ...s, [kind]: !s[kind] }));

  const toggleAll = () => {
    const next = !allChecked;
    setState(
      CONSENT_ITEMS.reduce((acc, item) => {
        acc[item.kind] = next;
        return acc;
      }, {} as ConsentState),
    );
  };

  const submit = async () => {
    if (!requiredMet || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await recordConsents(
        CONSENT_ITEMS.map((i) => ({ kind: i.kind, granted: state[i.kind], docVersion: i.docVersion })),
      );
      await markConsented();
      await refreshProfile();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '동의 저장에 실패했어요. 다시 시도해주세요.');
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={
        <Button
          label="동의하고 시작하기"
          onPress={submit}
          loading={submitting}
          disabled={!requiredMet}
        />
      }
    >
      <View style={styles.head}>
        <AppText variant="h2">서비스 이용 동의</AppText>
        <AppText variant="bodyLg" muted style={styles.sub}>
          안전한 이용을 위해 아래 내용에 동의해주세요.
        </AppText>
      </View>

      <Card padding="lg">
        <Checkbox
          checked={allChecked}
          onChange={toggleAll}
          label={
            <AppText variant="bodyLg" weight="semibold">
              약관 전체 동의
            </AppText>
          }
          accessibilityLabel="약관 전체 동의"
        />
        <Divider gap="md" />
        <View style={styles.items}>
          {CONSENT_ITEMS.map((item) => (
            <View key={item.kind} style={styles.itemRow}>
              <Checkbox
                checked={state[item.kind]}
                onChange={() => toggle(item.kind)}
                style={styles.itemCheckbox}
                label={
                  <AppText variant="body">
                    <AppText variant="body" color={item.required ? colors.primary : colors.textMuted} weight="semibold">
                      {item.required ? '[필수] ' : '[선택] '}
                    </AppText>
                    {item.title}
                  </AppText>
                }
              />
              {item.href != null && (
                <Link href={item.href as never} style={styles.viewLink}>
                  보기
                </Link>
              )}
            </View>
          ))}
        </View>
      </Card>

      {error != null && (
        <AppText variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  head: {
    gap: spacing.sm,
  },
  sub: {
    lineHeight: 27,
  },
  items: {
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemCheckbox: {
    flex: 1,
  },
  viewLink: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  error: {
    paddingHorizontal: spacing.sm,
  },
});
