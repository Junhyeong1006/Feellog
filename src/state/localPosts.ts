/**
 * 소통 탭 로컬 저장(AsyncStorage) — 내가 쓴 글/후기 + 좋아요 토글 + 댓글.
 * SamplePost 호환 형태로 저장해 피드에서 SAMPLE_POSTS와 그대로 병합 렌더된다.
 * 모듈 캐시 + 구독 패턴(useCollections와 동일)으로 전 화면 동기화.
 * 서버(community_posts) 연동 시 api 계층이 정본이 된다 — UI는 이 모듈만 바라본다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { SamplePost } from '@/data/sampleSocial';

const POSTS_KEY = 'feellog.community.localPosts';
const LIKES_KEY = 'feellog.community.likedPostIds';
const COMMENTS_KEY = 'feellog.community.localComments';

// ── 타입 ──

/** 내가 쓴 글 — SamplePost 호환 + 로컬 전용 필드 */
export interface LocalPost extends SamplePost {
  createdAt: number;
  /** 갤러리에서 고른 사진(로컬 uri). SamplePost.image(require 번들)와 별개 */
  imageUri: string | null;
  isLocal: true;
}

/** 피드에 흐르는 글(샘플 | 로컬) 공용 타입 */
export type FeedPost = SamplePost & Partial<Pick<LocalPost, 'createdAt' | 'imageUri' | 'isLocal'>>;

export interface LocalPostInput {
  authorName: string;
  /** require 반환값(figmaAssets) 또는 null */
  avatar: number | null;
  categoryLabel: string | null;
  body: string;
  bgTone: SamplePost['bgTone'];
  tags: string[];
  /** 만족도 1~5(없으면 null) */
  rating: number | null;
  imageUri?: string | null;
}

export interface LocalComment {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  createdAt: number;
}

// ── 시간 라벨 ──

/** createdAt → '방금 전'/'n분 전'/'n시간 전'/'n일 전'/'m월 d일' */
export function timeLabelOf(createdAt: number): string {
  const min = Math.floor((Date.now() - createdAt) / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const d = new Date(createdAt);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ── 저장 유틸 ──

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
    // 저장 실패는 조용히 무시(메모리 상태는 유지됨)
  }
}

// ── 모듈 스토어(구독) ──

type Store<T> = { value: T | undefined; listeners: Set<() => void> };

function makeStore<T>(): Store<T> {
  return { value: undefined, listeners: new Set() };
}

const postsStore = makeStore<LocalPost[]>();
const likesStore = makeStore<string[]>();
const commentsStore = makeStore<LocalComment[]>();

function useStore<T>(store: Store<T>, load: () => Promise<T>): [T | undefined, (v: T) => void] {
  const [, bump] = useState(0);

  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (alive) bump((b) => b + 1);
    };
    store.listeners.add(sync);
    if (store.value === undefined) {
      load().then((v) => {
        // 다른 화면이 먼저 채웠으면 덮어쓰지 않는다
        if (store.value === undefined) store.value = v;
        for (const l of store.listeners) l();
      });
    }
    return () => {
      alive = false;
      store.listeners.delete(sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback(
    (v: T) => {
      store.value = v;
      for (const l of store.listeners) l();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return [store.value, set];
}

// ── 글 ──

/** 내가 쓴 글(최신순). add는 만든 글을 반환한다. */
export function useLocalPosts() {
  const [posts, set] = useStore(postsStore, () => getJson<LocalPost[]>(POSTS_KEY, []));

  const add = useCallback(
    async (input: LocalPostInput): Promise<LocalPost> => {
      const cur = await getJson<LocalPost[]>(POSTS_KEY, []);
      const now = Date.now();
      const post: LocalPost = {
        id: `lp-${now}-${cur.length}`,
        authorId: 'me',
        authorName: input.authorName,
        authorTypeLabel: null,
        avatar: input.avatar,
        timeLabel: '방금 전', // 표시 시점에 createdAt으로 재계산
        categoryLabel: input.categoryLabel,
        body: input.body,
        bgTone: input.bgTone,
        tags: input.tags,
        rating: input.rating,
        likeCount: 0,
        commentCount: 0,
        image: null,
        createdAt: now,
        imageUri: input.imageUri ?? null,
        isLocal: true,
      };
      const next = [post, ...cur];
      await setJson(POSTS_KEY, next);
      set(next);
      return post;
    },
    [set],
  );

  const remove = useCallback(
    async (id: string) => {
      const next = (await getJson<LocalPost[]>(POSTS_KEY, [])).filter((p) => p.id !== id);
      await setJson(POSTS_KEY, next);
      set(next);
    },
    [set],
  );

  // timeLabel을 읽는 시점 기준으로 갱신해 돌려준다
  const withLabels = (posts ?? []).map((p) => ({ ...p, timeLabel: timeLabelOf(p.createdAt) }));

  return { posts: withLabels, loading: posts === undefined, add, remove };
}

// ── 좋아요 ──

/** 좋아요 토글(로컬). 표시 카운트 = post.likeCount + (isLiked ? 1 : 0). */
export function usePostLikes() {
  const [ids, set] = useStore(likesStore, () => getJson<string[]>(LIKES_KEY, []));

  const toggle = useCallback(
    async (postId: string) => {
      const cur = await getJson<string[]>(LIKES_KEY, []);
      const next = cur.includes(postId) ? cur.filter((id) => id !== postId) : [...cur, postId];
      await setJson(LIKES_KEY, next);
      set(next);
    },
    [set],
  );

  const isLiked = useCallback((postId: string) => (ids ?? []).includes(postId), [ids]);
  return { likedIds: ids ?? [], loading: ids === undefined, isLiked, toggle };
}

// ── 댓글 ──

/** 로컬 댓글(글별 오래된 순). countOf는 로컬 추가분만 센다. */
export function useLocalComments() {
  const [comments, set] = useStore(commentsStore, () => getJson<LocalComment[]>(COMMENTS_KEY, []));

  const add = useCallback(
    async (postId: string, authorName: string, body: string): Promise<LocalComment> => {
      const cur = await getJson<LocalComment[]>(COMMENTS_KEY, []);
      const comment: LocalComment = {
        id: `lc-${Date.now()}-${cur.length}`,
        postId,
        authorName,
        body,
        createdAt: Date.now(),
      };
      const next = [...cur, comment];
      await setJson(COMMENTS_KEY, next);
      set(next);
      return comment;
    },
    [set],
  );

  const listOf = useCallback(
    (postId: string) => (comments ?? []).filter((c) => c.postId === postId),
    [comments],
  );
  const countOf = useCallback((postId: string) => listOf(postId).length, [listOf]);

  return { comments: comments ?? [], loading: comments === undefined, add, listOf, countOf };
}

/** 로그아웃 등 로컬 소통 데이터 일괄 제거 */
export async function clearLocalPosts(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(POSTS_KEY).catch(() => {}),
    AsyncStorage.removeItem(LIKES_KEY).catch(() => {}),
    AsyncStorage.removeItem(COMMENTS_KEY).catch(() => {}),
  ]);
  postsStore.value = [];
  likesStore.value = [];
  commentsStore.value = [];
  for (const s of [postsStore, likesStore, commentsStore]) for (const l of s.listeners) l();
}
