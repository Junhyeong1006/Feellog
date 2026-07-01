/**
 * reactions 접근 계층 — 카드 좋아요/관심없어요.
 * 활동당 최종 1개(변경 시 upsert). 로컬 샘플 활동(sample-*)은 저장하지 않는다.
 */
import { getSupabase } from './supabase';
import { isSampleActivity } from './activities';

export type ReactionKind = 'like' | 'dislike';

export interface Reaction {
  activityId: string;
  kind: ReactionKind;
}

export async function fetchMyReactions(): Promise<Reaction[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];
  const { data, error } = await sb
    .from('reactions')
    .select('activity_id, kind')
    .eq('user_id', uid);
  if (error) throw error;
  return (data ?? []).map((r) => ({ activityId: r.activity_id as string, kind: r.kind as ReactionKind }));
}

export async function upsertReaction(activityId: string, kind: ReactionKind): Promise<void> {
  const sb = getSupabase();
  if (!sb || isSampleActivity(activityId)) return;
  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  // reactions에는 UPDATE 정책이 없다(이력 append/delete 모델). 따라서 upsert(ON CONFLICT DO UPDATE)는
  // RLS에 막힌다 → 기존 반응을 지우고 새로 넣어 변경한다(insert/delete 둘 다 RLS 허용).
  const { error: delError } = await sb
    .from('reactions')
    .delete()
    .eq('user_id', uid)
    .eq('activity_id', activityId);
  if (delError) throw delError;
  const { error: insError } = await sb
    .from('reactions')
    .insert({ user_id: uid, activity_id: activityId, kind });
  if (insError) throw insError;
}

/** 좋아요한 활동 id 목록(마이페이지 등). */
export async function fetchLikedActivityIds(): Promise<string[]> {
  const reactions = await fetchMyReactions();
  return reactions.filter((r) => r.kind === 'like').map((r) => r.activityId);
}
