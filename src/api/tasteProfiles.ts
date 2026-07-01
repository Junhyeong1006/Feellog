/**
 * taste_profiles 접근 계층. base_*(고정 기준) / cur_*(피드백으로 보정되는 현재) 분리.
 * 피드백 보정 시 cur_*와 feedback_count만 갱신한다(base는 재검사 때만 바뀜).
 */
import type { AxisVector, MainType, SubTrait } from '@/core';

import { getSupabase } from './supabase';

/** 화면·추천에 쓰는 취향 스냅샷(서버/로컬 공통 형태) */
export interface TasteSnapshot {
  vector: AxisVector; // 현재(cur) 벡터
  base: AxisVector; // 기준(base) 벡터
  mainType: MainType | null;
  subTrait: SubTrait | null;
  trendScore: number;
  recoveryScore: number;
  feedbackCount: number;
}

interface TasteRow {
  base_rhythm: number;
  base_relation: number;
  base_experience: number;
  base_participation: number;
  base_reward: number;
  cur_rhythm: number;
  cur_relation: number;
  cur_experience: number;
  cur_participation: number;
  cur_reward: number;
  main_type: MainType | null;
  sub_trait: SubTrait | null;
  trend_score: number;
  recovery_score: number;
  feedback_count: number;
}

function mapTaste(r: TasteRow): TasteSnapshot {
  return {
    vector: {
      rhythm: r.cur_rhythm,
      relation: r.cur_relation,
      experience: r.cur_experience,
      participation: r.cur_participation,
      reward: r.cur_reward,
    },
    base: {
      rhythm: r.base_rhythm,
      relation: r.base_relation,
      experience: r.base_experience,
      participation: r.base_participation,
      reward: r.base_reward,
    },
    mainType: r.main_type,
    subTrait: r.sub_trait,
    trendScore: r.trend_score,
    recoveryScore: r.recovery_score,
    feedbackCount: r.feedback_count,
  };
}

export async function fetchMyTaste(): Promise<TasteSnapshot | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await sb
    .from('taste_profiles')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTaste(data as TasteRow) : null;
}

/**
 * 취향 스냅샷을 서버에 저장(upsert). 피드백 보정 후 호출.
 * update가 아닌 upsert라 taste_profiles 행이 아직 없어도(테스트 저장 실패/게스트→로그인 등)
 * 로컬 base로 행을 생성해 자가치유한다. base_*는 스냅샷의 기준값을 그대로 유지한다.
 */
export async function persistTaste(snapshot: TasteSnapshot): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  const { vector: cur, base } = snapshot;
  const { error } = await sb.from('taste_profiles').upsert(
    {
      user_id: uid,
      base_rhythm: base.rhythm,
      base_relation: base.relation,
      base_experience: base.experience,
      base_participation: base.participation,
      base_reward: base.reward,
      cur_rhythm: cur.rhythm,
      cur_relation: cur.relation,
      cur_experience: cur.experience,
      cur_participation: cur.participation,
      cur_reward: cur.reward,
      main_type: snapshot.mainType,
      sub_trait: snapshot.subTrait,
      trend_score: snapshot.trendScore,
      recovery_score: snapshot.recoveryScore,
      feedback_count: snapshot.feedbackCount,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}
