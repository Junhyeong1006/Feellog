/**
 * 채팅 로컬 저장 — 방별로 "내가 보낸 메시지"를 AsyncStorage에 보관.
 * 샘플 대화(SAMPLE_MESSAGES) 위에 병합되어, 서버 없이도 전송이 완결된다.
 * 서버 연동 시 이 저장소는 전송 큐/캐시 역할로 전환된다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHATS_KEY = 'feellog.localChats';

export interface LocalChatMessage {
  id: string;
  chatId: string;
  /** 항상 내가 보낸 메시지('me') */
  senderId: 'me';
  body: string;
  /** '오후 2:01' 형식 */
  timeLabel: string;
  /** '2026년 7월 20일' 형식 — 날짜 구분 칩 비교용 */
  dateLabel: string;
  createdAt: number;
}

/** '오후 2:01' — SAMPLE_MESSAGES timeLabel과 동일 포맷 */
export function formatTimeLabel(d: Date): string {
  const hours = d.getHours();
  const meridiem = hours < 12 ? '오전' : '오후';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${meridiem} ${h12}:${mm}`;
}

/** '2026년 7월 20일' — SAMPLE_MESSAGES dateLabel과 동일 포맷 */
export function formatDateLabel(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

async function getAll(): Promise<LocalChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(CHATS_KEY);
    return raw ? (JSON.parse(raw) as LocalChatMessage[]) : [];
  } catch {
    return [];
  }
}

async function setAll(value: LocalChatMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(value));
  } catch {
    // no-op(저장 실패 시에도 화면 상태는 유지)
  }
}

/** 특정 방의 내 메시지(보낸 순) */
export async function getLocalChatMessages(chatId: string): Promise<LocalChatMessage[]> {
  const all = await getAll();
  return all.filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt - b.createdAt);
}

/** 메시지 저장 후 해당 방의 최신 목록 반환 */
export async function addLocalChatMessage(chatId: string, body: string): Promise<LocalChatMessage[]> {
  const all = await getAll();
  const now = new Date();
  const message: LocalChatMessage = {
    id: `lc-${now.getTime()}-${all.length}`,
    chatId,
    senderId: 'me',
    body,
    timeLabel: formatTimeLabel(now),
    dateLabel: formatDateLabel(now),
    createdAt: now.getTime(),
  };
  await setAll([...all, message]);
  return getLocalChatMessages(chatId);
}

/** 로그아웃 등에서 로컬 채팅 일괄 제거 */
export async function clearLocalChats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHATS_KEY);
  } catch {
    // no-op
  }
}
