/**
 * 최근 검색어 로컬 저장(AsyncStorage) — 최대 10개, 최신순.
 * 검색 실행 시 addRecentSearch로 맨 앞에 추가(중복은 앞으로 끌어올림).
 * 서버 없는 로컬 완결 기능 — 로그인 여부와 무관하게 동작한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'feellog.recentSearches';

/** 보관 최대 개수 */
export const RECENT_SEARCHES_MAX = 10;

async function read(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

async function write(list: string[]): Promise<string[]> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 저장 실패는 조용히 무시(다음 세션에서만 유실)
  }
  return list;
}

/** 최근 검색어 목록(최신순) */
export const getRecentSearches = read;

/** 검색어 추가 — 공백 트림, 중복은 맨 앞으로, 최대 10개 유지. 갱신된 목록 반환 */
export async function addRecentSearch(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return read();
  const cur = await read();
  const next = [q, ...cur.filter((s) => s !== q)].slice(0, RECENT_SEARCHES_MAX);
  return write(next);
}

/** 개별 삭제. 갱신된 목록 반환 */
export async function removeRecentSearch(query: string): Promise<string[]> {
  const cur = await read();
  return write(cur.filter((s) => s !== query));
}

/** 전체 삭제 */
export async function clearRecentSearches(): Promise<string[]> {
  return write([]);
}
