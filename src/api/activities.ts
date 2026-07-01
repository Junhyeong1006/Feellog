/**
 * activities 카탈로그 접근 계층.
 * DB에 활동이 있으면 그걸, 없으면(초기/게스트) 로컬 샘플로 폴백 → 데모가 바로 동작.
 * RLS가 활성·미삭제 활동만 공개하므로 별도 권한 걱정 없음.
 */
import type { Activity, AxisVector } from '@/core';
import { SAMPLE_ACTIVITIES } from '@/data/sampleActivities';

import { getSupabase } from './supabase';

/** 코어 Activity(매칭 입력) + 화면 표시용 확장 필드 */
export interface AppActivity extends Activity {
  summary: string | null;
  keywords: string[];
  category: string | null;
  regionSigungu: string | null;
  imageUrl: string | null;
  bookingUrl: string | null;
  partnerName: string | null;
}

/** 로컬 샘플(가짜) 활동인지 — 이 id는 DB에 없으므로 reactions 저장을 건너뛴다. */
export function isSampleActivity(id: string): boolean {
  return id.startsWith('sample-');
}

interface ActivityRow {
  id: string;
  title: string;
  summary: string | null;
  keywords: string[] | null;
  category: string | null;
  region_sido: string | null;
  region_sigungu: string | null;
  price: number | null;
  duration_min: number | null;
  intensity: number | null;
  image_url: string | null;
  booking_url: string | null;
  partner_name: string | null;
  axis_rhythm: number;
  axis_relation: number;
  axis_experience: number;
  axis_participation: number;
  axis_reward: number;
}

function rowVector(r: ActivityRow): AxisVector {
  return {
    rhythm: r.axis_rhythm,
    relation: r.axis_relation,
    experience: r.axis_experience,
    participation: r.axis_participation,
    reward: r.axis_reward,
  };
}

function mapRow(r: ActivityRow): AppActivity {
  return {
    id: r.id,
    title: r.title,
    vector: rowVector(r),
    regionSido: r.region_sido,
    price: r.price,
    durationMin: r.duration_min,
    intensity: r.intensity,
    summary: r.summary,
    keywords: r.keywords ?? [],
    category: r.category,
    regionSigungu: r.region_sigungu,
    imageUrl: r.image_url,
    bookingUrl: r.booking_url,
    partnerName: r.partner_name,
  };
}

export async function fetchActivities(): Promise<AppActivity[]> {
  const sb = getSupabase();
  if (!sb) return SAMPLE_ACTIVITIES;
  const { data, error } = await sb
    .from('activities')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data as ActivityRow[] | null)?.map(mapRow) ?? [];
  return rows.length > 0 ? rows : SAMPLE_ACTIVITIES;
}

export async function fetchActivity(id: string): Promise<AppActivity | null> {
  const sb = getSupabase();
  if (!sb || isSampleActivity(id)) {
    return SAMPLE_ACTIVITIES.find((a) => a.id === id) ?? null;
  }
  const { data, error } = await sb.from('activities').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (data) return mapRow(data as ActivityRow);
  return SAMPLE_ACTIVITIES.find((a) => a.id === id) ?? null;
}
