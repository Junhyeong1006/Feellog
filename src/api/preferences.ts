/**
 * 7축 선호 서버 저장(preference_scores) — 로그인 사용자용.
 * 로컬(prefsCache)이 항상 1차 동작 경로이고, 세션이 있으면 서버에 미러링한다.
 * 실패해도 앱 동작에는 지장 없음(다음 기회에 재시도).
 */
import type { AxisVector, FeedbackAction, MainType } from '@/core';

import { getSupabase } from './supabase';

const AXES7 = ['physical', 'relation', 'experience', 'satisfaction', 'value', 'novelty', 'depth'] as const;

function toColumns(prefix: 'initial' | 'current', v: AxisVector): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of AXES7) out[`${prefix}_${a}`] = v[a];
  return out;
}

function fromColumns(prefix: 'initial' | 'current', row: Record<string, unknown>): AxisVector {
  const out = {} as AxisVector;
  for (const a of AXES7) out[a] = Number(row[`${prefix}_${a}`] ?? 0);
  return out;
}

export interface ServerPrefs {
  initial: AxisVector;
  current: AxisVector;
  mainType: MainType | null;
  feedbackCount: number;
}

/** 내 선호 조회(없으면 null) */
export async function fetchMyPrefs(): Promise<ServerPrefs | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: userData } = await sb.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;
  const { data, error } = await sb.from('preference_scores').select('*').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    initial: fromColumns('initial', row),
    current: fromColumns('current', row),
    mainType: (row.main_type as MainType | null) ?? null,
    feedbackCount: Number(row.feedback_count ?? 0),
  };
}

/** 테스트 완료 저장 — initial과 current를 함께 리셋 */
export async function saveInitialPrefs(vector: AxisVector, mainType: MainType): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: userData } = await sb.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;
  const { error } = await sb.from('preference_scores').upsert({
    user_id: uid,
    ...toColumns('initial', vector),
    ...toColumns('current', vector),
    main_type: mainType,
    feedback_count: 0,
  });
  if (error) throw error;
}

/** 피드백 반영 저장 — current만 갱신 + 이력 기록 */
export async function saveCurrentPrefs(
  current: AxisVector,
  mainType: MainType,
  feedbackCount: number,
  history?: { activityId: string; action: FeedbackAction },
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: userData } = await sb.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;
  const { error } = await sb
    .from('preference_scores')
    .update({ ...toColumns('current', current), main_type: mainType, feedback_count: feedbackCount })
    .eq('user_id', uid);
  if (error) throw error;
  if (history) {
    try {
      await sb
        .from('preference_update_history')
        .insert({ user_id: uid, activity_id: history.activityId, action: history.action, axis_deltas: current });
    } catch {
      // 이력 실패는 무시(핵심 아님)
    }
  }
}
