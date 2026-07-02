/**
 * useCommunity — 커뮤니티 글/좋아요 상태 관리.
 * 로드: 전체 글 + (로그인 시) 내 좋아요. 탭 재진입/글쓰기 복귀 시(useFocusEffect) 새로고침.
 * 좋아요: 낙관적 토글 + (실글·로그인) 서버 반영. 샘플/게스트는 로컬만.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import {
  deletePost,
  fetchAllPosts,
  fetchMyLikedPostIds,
  setPostLike,
  type Post,
} from '@/api/community';
import { useAuth } from '@/providers/AuthProvider';

export function useCommunity() {
  const { session } = useAuth();
  const hasSession = Boolean(session);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSample, setIsSample] = useState(true);
  const [loading, setLoading] = useState(true);
  /** 마지막 로드가 실패했는지(보여줄 게 없을 때 재시도 UI용) */
  const [error, setError] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const initialLiked = useRef<Set<string>>(new Set());
  const gen = useRef(0);
  /** 서버 반영이 진행 중인 좋아요 의도(id→liked). 재로드가 이 낙관적 상태를 덮어쓰지 않게 보존. */
  const pending = useRef<Map<string, boolean>>(new Map());

  const load = useCallback(async () => {
    const g = ++gen.current;
    try {
      const [result, likedIds] = await Promise.all([
        fetchAllPosts(),
        hasSession ? fetchMyLikedPostIds().catch(() => []) : Promise.resolve([]),
      ]);
      if (g !== gen.current) return;
      setPosts(result.posts);
      setIsSample(result.isSample);
      setError(false);
      if (hasSession) {
        const server = new Set(likedIds);
        initialLiked.current = new Set(server);
        // 진행 중인 좋아요 의도를 서버 스냅샷 위에 덮어써 in-flight 쓰기가 유실되지 않게 한다.
        const merged = new Set(server);
        pending.current.forEach((intended, id) => {
          if (intended) merged.add(id);
          else merged.delete(id);
        });
        setLiked(merged);
      }
      // 게스트: 서버 스냅샷이 없으므로 로컬 좋아요 상태를 유지(재방문마다 초기화되지 않게)
    } catch {
      if (g === gen.current) {
        // 일시 오류로 이미 보고 있던 피드를 지우지 않는다(빈 화면 + '글이 없어요' 오안내 방지)
        setPosts((prev) => prev);
        setError(true);
      }
    } finally {
      if (g === gen.current) setLoading(false);
    }
  }, [hasSession]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        gen.current++;
      };
    }, [load]),
  );

  const isLiked = useCallback((id: string) => liked.has(id), [liked]);

  const likeCountOf = useCallback(
    (post: Post) =>
      post.likeCount + (liked.has(post.id) ? 1 : 0) - (initialLiked.current.has(post.id) ? 1 : 0),
    [liked],
  );

  const toggleLike = useCallback(
    async (post: Post) => {
      const id = post.id;
      const nowLiked = !liked.has(id);
      setLiked((prev) => {
        const next = new Set(prev);
        if (nowLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      if (post.isSample || !hasSession) return; // 샘플/게스트는 로컬만
      pending.current.set(id, nowLiked);
      try {
        await setPostLike(id, nowLiked);
      } catch {
        // 실패해도 로컬 상태 유지(다음 새로고침에 서버와 재동기화)
      } finally {
        pending.current.delete(id);
      }
    },
    [liked, hasSession],
  );

  const removePost = useCallback(
    async (postId: string) => {
      setPosts((prev) => prev.filter((p) => p.id !== postId)); // 낙관적 제거
      try {
        await deletePost(postId);
      } catch {
        void load(); // 실패 시 재로드로 복구
      }
    },
    [load],
  );

  return { posts, isSample, loading, error, isLiked, likeCountOf, toggleLike, removePost, reload: load };
}
