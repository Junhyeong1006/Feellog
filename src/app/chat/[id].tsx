/**
 * 채팅방 — 1:1/그룹 대화 (Figma 559-3563 정본).
 * 헤더(원형 뒤로 + 상대 아바타 + 닉네임) · 날짜 칩 · 좌우 말풍선(사진 첨부 포함) · 하단 입력바.
 * 샘플 대화(SAMPLE_MESSAGES) 위에 내가 보낸 메시지(localChats)를 병합 — 서버 없이 전송 완결.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SAMPLE_FRIENDS, SAMPLE_MESSAGES, type SampleMessage } from '@/data/sampleSocial';
import {
  addLocalChatMessage,
  getLocalChatMessages,
  type LocalChatMessage,
} from '@/state/localChats';
import { colors, MIN_TOUCH_SIZE, palette, radius, spacing } from '@/tokens';
import { AppText, Button, Input, Screen } from '@/ui';

/** Figma 스펙 고정색(토큰에 없는 실측값 — 스펙 우선 규칙) */
const BUBBLE_BORDER = '#C2C6D4';
const INPUT_BAR_BORDER = '#E5E2DE';
const AVATAR_RING = '#EFE9DD';

type ChatItem = {
  id: string;
  senderId: string;
  body: string | null;
  image: number | null;
  timeLabel: string;
  dateLabel?: string;
};

function toItems(samples: SampleMessage[], locals: LocalChatMessage[]): ChatItem[] {
  return [
    ...samples.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      image: m.image,
      timeLabel: m.timeLabel,
      dateLabel: m.dateLabel,
    })),
    ...locals.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body as string | null,
      image: null,
      timeLabel: m.timeLabel,
      dateLabel: m.dateLabel,
    })),
  ];
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = typeof id === 'string' ? id : '';
  const friend = SAMPLE_FRIENDS.find((f) => f.chatId === chatId) ?? null;

  const [locals, setLocals] = useState<LocalChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    if (chatId) {
      getLocalChatMessages(chatId).then((msgs) => {
        if (alive) setLocals(msgs);
      });
    }
    return () => {
      alive = false;
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [chatId]);

  const samples = useMemo(() => SAMPLE_MESSAGES.filter((m) => m.chatId === chatId), [chatId]);
  const items = useMemo(() => toItems(samples, locals), [samples, locals]);

  const showNotice = (text: string) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2000);
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || !chatId) return;
    setDraft('');
    const next = await addLocalChatMessage(chatId, body);
    setLocals(next);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!friend) {
    return (
      <Screen>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
          <AppText variant="bodyLg" center>
            대화를 찾을 수 없어요
          </AppText>
          <AppText muted center>
            목록으로 돌아가 다시 선택해 주세요.
          </AppText>
          <Button label="돌아가기" variant="secondary" size="md" onPress={handleBack} />
        </View>
      </Screen>
    );
  }

  let lastDateShown: string | null = null;

  return (
    <Screen noPadding>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더: 원형 뒤로 + 아바타 + 닉네임 */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>

          {friend.avatar != null ? (
            <Image
              source={friend.avatar}
              style={styles.avatar}
              contentFit="cover"
              accessibilityLabel={`${friend.nickname} 프로필 사진`}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
          )}

          <AppText variant="body2" numberOfLines={1} style={styles.flexShrink}>
            {friend.nickname}
          </AppText>
        </View>
        <View style={styles.headerDivider} />

        {/* 메시지 목록 */}
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {items.map((msg) => {
            const isMe = msg.senderId === 'me';
            const showDate = msg.dateLabel != null && msg.dateLabel !== lastDateShown;
            if (showDate) lastDateShown = msg.dateLabel ?? null;

            return (
              <View key={msg.id}>
                {showDate && (
                  <View style={styles.dateChipWrap}>
                    <View style={styles.dateChip}>
                      <AppText variant="caption">{msg.dateLabel}</AppText>
                    </View>
                  </View>
                )}

                <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                  {isMe && (
                    <AppText variant="small" color={palette.black} style={styles.timeLabel}>
                      {msg.timeLabel}
                    </AppText>
                  )}

                  {msg.image != null ? (
                    <View style={[styles.bubble, styles.photoBubble, styles.bubbleOther]}>
                      <Image
                        source={msg.image}
                        style={styles.photo}
                        contentFit="cover"
                        accessibilityLabel="첨부 사진"
                      />
                      {msg.body != null && (
                        <AppText style={styles.photoCaption}>{msg.body}</AppText>
                      )}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : [styles.bubbleWhite, styles.bubbleOther],
                      ]}
                    >
                      <AppText color={isMe ? palette.neutral0 : colors.textPrimary}>
                        {msg.body}
                      </AppText>
                    </View>
                  )}

                  {!isMe && (
                    <AppText variant="small" color={palette.black} style={styles.timeLabel}>
                      {msg.timeLabel}
                    </AppText>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* 준비 중 안내(토스트) */}
        {notice != null && (
          <View style={styles.noticeWrap} pointerEvents="none">
            <View style={styles.notice}>
              <AppText variant="caption" color={palette.neutral0}>
                {notice}
              </AppText>
            </View>
          </View>
        )}

        {/* 입력바 */}
        <View style={styles.inputBar}>
          <Pressable
            onPress={() => showNotice('사진 첨부는 준비 중이에요')}
            accessibilityRole="button"
            accessibilityLabel="사진 첨부"
            style={({ pressed }) => [styles.attachBtn, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={28} color={colors.primary} />
          </Pressable>

          <Input
            value={draft}
            onChangeText={setDraft}
            placeholder="메시지 입력..."
            returnKeyType="send"
            onSubmitEditing={send}
            accessibilityLabel="메시지 입력"
            style={styles.msgInput}
          />

          <Pressable
            onPress={send}
            disabled={draft.trim().length === 0}
            accessibilityRole="button"
            accessibilityLabel="메시지 보내기"
            style={({ pressed }) => [
              styles.sendBtn,
              pressed && styles.pressed,
              draft.trim().length === 0 && styles.sendBtnIdle,
            ]}
          >
            <Ionicons name="send" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.huge,
  },

  // 헤더
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
  },
  backBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: AVATAR_RING,
  },
  avatarFallback: {
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // 메시지 목록
  messages: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  dateChipWrap: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  dateChip: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    marginBottom: spacing.base,
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  timeLabel: {
    marginBottom: spacing.xs,
  },
  bubble: {
    maxWidth: '72%',
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  bubbleOther: {
    borderTopLeftRadius: 0,
  },
  bubbleWhite: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: BUBBLE_BORDER,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 0,
  },
  photoBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: BUBBLE_BORDER,
    padding: spacing.xs,
    maxWidth: 200,
  },
  photo: {
    width: 175,
    height: 128,
    borderRadius: radius.lg,
  },
  photoCaption: {
    padding: spacing.sm,
  },

  // 안내 토스트
  noticeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 84,
    alignItems: 'center',
  },
  notice: {
    backgroundColor: colors.scrim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },

  // 입력바
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: INPUT_BAR_BORDER,
  },
  attachBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgInput: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  sendBtn: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnIdle: {
    opacity: 0.5,
  },
});
