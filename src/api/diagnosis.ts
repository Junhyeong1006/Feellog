/**
 * 성향 진단 결과 저장.
 * - test_responses: 원응답 + 계산결과 스냅샷(분석/재튜닝)
 * - taste_profiles: base_*(고정 기준) = cur_*(현재) 로 초기화 + 유형/보조성향/점수
 * - profiles.onboarded = true (홈 진입 분기)
 * 비로그인(게스트)은 저장하지 않고 결과 화면만 보여준다.
 */
import type { Answer, DiagnosisResult } from '@/core';

import { getSupabase } from './supabase';

export async function saveDiagnosis(answers: Answer[], result: DiagnosisResult): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return;

  const v = result.vector;

  // 1) 원응답 스냅샷
  const { error: respErr } = await sb.from('test_responses').insert({
    user_id: uid,
    answers,
    computed: {
      vector: v,
      main_type: result.mainType,
      sub_trait: result.subTrait,
      trend_score: result.trendScore,
      recovery_score: result.recoveryScore,
    },
  });
  if (respErr) throw respErr;

  // 2) 취향 프로필 upsert (base = cur = 진단 벡터)
  const { error: tasteErr } = await sb.from('taste_profiles').upsert(
    {
      user_id: uid,
      base_rhythm: v.rhythm,
      base_relation: v.relation,
      base_experience: v.experience,
      base_participation: v.participation,
      base_reward: v.reward,
      cur_rhythm: v.rhythm,
      cur_relation: v.relation,
      cur_experience: v.experience,
      cur_participation: v.participation,
      cur_reward: v.reward,
      main_type: result.mainType,
      sub_trait: result.subTrait,
      trend_score: result.trendScore,
      recovery_score: result.recoveryScore,
      feedback_count: 0,
    },
    { onConflict: 'user_id' },
  );
  if (tasteErr) throw tasteErr;

  // 3) 온보딩 완료 표시
  const { error: profErr } = await sb.from('profiles').update({ onboarded: true }).eq('id', uid);
  if (profErr) throw profErr;
}
