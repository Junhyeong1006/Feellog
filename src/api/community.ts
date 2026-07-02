/**
 * community_posts / post_likes 접근 계층.
 * profiles가 self-select RLS라 작성자 정보는 글에 스냅샷(author_name/avatar/main_type)돼 있어 조인 불필요.
 * DB에 글이 없으면(초기) 로컬 샘플로 폴백 → 커뮤니티 데모가 바로 동작.
 */
import type { MainType } from '@/core';
import { SAMPLE_POSTS } from '@/data/samplePosts';
import { formatTimeAgo } from '@/utils/format';

import { getSupabase } from './supabase';

/** 화면 공용 글 모델(서버/샘플 통합) */
export interface Post {
  id: string;
  userId: string; // 본인 글 판별용(샘플은 '')
  authorName: string;
  authorType: MainType | null;
  authorAvatarUrl: string | null;
  body: string;
  category: string | null;
  imageUrl: string | null;
  hasPhoto: boolean;
  likeCount: number;
  commentCount: number;
  createdAtLabel: string;
  isSample: boolean;
}

interface PostRow {
  id: string;
  user_id: string;
  body: string;
  category: string | null;
  image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  main_type: MainType | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

function mapRow(r: PostRow): Post {
  return {
    id: r.id,
    userId: r.user_id,
    authorName: r.author_name?.trim() || '회원님',
    authorType: r.main_type,
    authorAvatarUrl: r.author_avatar_url,
    body: r.body,
    category: r.category,
    imageUrl: r.image_url,
    hasPhoto: r.image_url != null,
    likeCount: r.like_count,
    commentCount: r.comment_count,
    createdAtLabel: formatTimeAgo(r.created_at),
    isSample: false,
  };
}

function sampleAsPosts(): Post[] {
  return SAMPLE_POSTS.map((s) => ({
    id: s.id,
    userId: '',
    authorName: s.authorName,
    authorType: s.authorType,
    authorAvatarUrl: null,
    body: s.body,
    category: s.category,
    imageUrl: null,
    hasPhoto: s.hasPhoto,
    likeCount: s.likeCount,
    commentCount: s.commentCount,
    createdAtLabel: s.timeAgo,
    isSample: true,
  }));
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

/** 전체 글(최신순, 최대 50). 비었거나 미설정이면 샘플 폴백. */
export async function fetchAllPosts(): Promise<{ posts: Post[]; isSample: boolean }> {
  const sb = getSupabase();
  if (!sb) return { posts: sampleAsPosts(), isSample: true };
  const { data, error } = await sb
    .from('community_posts')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = (data as PostRow[] | null)?.map(mapRow) ?? [];
  if (rows.length === 0) return { posts: sampleAsPosts(), isSample: true };
  return { posts: rows, isSample: false };
}

/** 내가 좋아요한 글 id 목록(로그인 전용). */
export async function fetchMyLikedPostIds(): Promise<string[]> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) return [];
  const { data, error } = await sb.from('post_likes').select('post_id').eq('user_id', uid);
  if (error) throw error;
  return (data ?? []).map((r) => r.post_id as string);
}

/** 좋아요 설정/해제(중복 insert는 무시). */
export async function setPostLike(postId: string, liked: boolean): Promise<void> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) return;
  if (liked) {
    const { error } = await sb.from('post_likes').insert({ user_id: uid, post_id: postId });
    if (error && error.code !== '23505') throw error; // 23505=중복 → 이미 좋아요, 무시
  } else {
    const { error } = await sb
      .from('post_likes')
      .delete()
      .eq('user_id', uid)
      .eq('post_id', postId);
    if (error) throw error;
  }
}

/** 글 작성(작성자 정보는 트리거가 스냅샷). */
export async function createPost(input: {
  body: string;
  category?: string | null;
  imageUrl?: string | null;
}): Promise<void> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) throw new Error('로그인이 필요해요.');
  const body = input.body.trim();
  if (!body) throw new Error('내용을 입력해주세요.');
  const { error } = await sb.from('community_posts').insert({
    user_id: uid,
    body,
    category: input.category ?? null,
    image_url: input.imageUrl ?? null,
  });
  if (error) throw error;
}

/** 내 글 삭제(소프트 삭제). */
export async function deletePost(postId: string): Promise<void> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) return;
  const { error } = await sb
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId);
  if (error) throw error;
}

/** 글 1건 조회(상세 화면). 샘플 id면 샘플에서, 아니면 서버에서. 없으면 null. */
export async function fetchPost(postId: string): Promise<Post | null> {
  const sample = sampleAsPosts().find((p) => p.id === postId);
  if (sample) return sample;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('community_posts')
    .select('*')
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as PostRow) : null;
}

// ─────────────────────────── 댓글(post_comments) ───────────────────────────

/** 화면 공용 댓글 모델 */
export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAtLabel: string;
}

interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  author_name: string | null;
  author_avatar_url: string | null;
  created_at: string;
}

function mapCommentRow(r: CommentRow): Comment {
  return {
    id: r.id,
    userId: r.user_id,
    authorName: r.author_name?.trim() || '회원님',
    authorAvatarUrl: r.author_avatar_url,
    body: r.body,
    createdAtLabel: formatTimeAgo(r.created_at),
  };
}

/** 글의 댓글 목록(오래된 순 — 대화 흐름대로). */
export async function fetchComments(postId: string): Promise<Comment[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return ((data as CommentRow[] | null) ?? []).map(mapCommentRow);
}

/** 댓글 작성(작성자 정보는 트리거가 스냅샷). 등록된 댓글을 반환. */
export async function createComment(postId: string, body: string): Promise<Comment> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) throw new Error('로그인이 필요해요.');
  const trimmed = body.trim();
  if (!trimmed) throw new Error('내용을 입력해주세요.');
  const { data, error } = await sb
    .from('post_comments')
    .insert({ post_id: postId, user_id: uid, body: trimmed })
    .select('*')
    .single();
  if (error) throw error;
  return mapCommentRow(data as CommentRow);
}

/** 내 댓글 삭제(하드 삭제 — 카운터는 트리거가 감소). */
export async function deleteComment(commentId: string): Promise<void> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) return;
  const { error } = await sb.from('post_comments').delete().eq('id', commentId);
  if (error) throw error;
}
