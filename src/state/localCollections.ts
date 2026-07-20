/**
 * 찜(위시리스트)·장바구니·기록 로컬 저장(AsyncStorage).
 * 게스트/오프라인에서도 전 기능이 동작하고, 로그인 시 서버 테이블이 정본이 된다
 * (동기화는 api 계층에서 — 이 모듈은 순수 로컬 저장만 담당).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_KEY = 'feellog.wishlist';
const CART_KEY = 'feellog.cart';
const RECORDS_KEY = 'feellog.records';

async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function setJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

// ── 찜 ──
export const getLocalWishlist = () => getJson<string[]>(WISHLIST_KEY, []);
export async function toggleLocalWishlist(activityId: string): Promise<string[]> {
  const cur = await getLocalWishlist();
  const next = cur.includes(activityId) ? cur.filter((id) => id !== activityId) : [...cur, activityId];
  await setJson(WISHLIST_KEY, next);
  return next;
}

// ── 장바구니 ──
export interface CartItem {
  activityId: string;
  qty: number;
  addedAt: number;
}
export const getLocalCart = () => getJson<CartItem[]>(CART_KEY, []);
export async function addToLocalCart(activityId: string): Promise<CartItem[]> {
  const cur = await getLocalCart();
  const exists = cur.find((c) => c.activityId === activityId);
  const next = exists
    ? cur.map((c) => (c.activityId === activityId ? { ...c, qty: c.qty + 1 } : c))
    : [...cur, { activityId, qty: 1, addedAt: Date.now() }];
  await setJson(CART_KEY, next);
  return next;
}
export async function removeFromLocalCart(activityId: string): Promise<CartItem[]> {
  const next = (await getLocalCart()).filter((c) => c.activityId !== activityId);
  await setJson(CART_KEY, next);
  return next;
}

// ── 기록(캘린더) ──
export interface LocalRecord {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  body: string;
  /** 활동 카테고리(캘린더 점 색) */
  category: string | null;
  activityId: string | null;
  /** 만족도 1~5 */
  satisfaction: number | null;
  tags: string[];
  createdAt: number;
}
export const getLocalRecords = () => getJson<LocalRecord[]>(RECORDS_KEY, []);
export async function addLocalRecord(record: Omit<LocalRecord, 'id' | 'createdAt'>): Promise<LocalRecord[]> {
  const cur = await getLocalRecords();
  const next = [
    ...cur,
    { ...record, id: `r-${Date.now()}-${cur.length}`, createdAt: Date.now() },
  ];
  await setJson(RECORDS_KEY, next);
  return next;
}
export async function removeLocalRecord(id: string): Promise<LocalRecord[]> {
  const next = (await getLocalRecords()).filter((r) => r.id !== id);
  await setJson(RECORDS_KEY, next);
  return next;
}

/** 로그아웃 시 로컬 개인 데이터 일괄 제거 */
export async function clearLocalCollections(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(WISHLIST_KEY).catch(() => {}),
    AsyncStorage.removeItem(CART_KEY).catch(() => {}),
    AsyncStorage.removeItem(RECORDS_KEY).catch(() => {}),
  ]);
}
