/**
 * user_consents 기록. 이력 무결성을 위해 append-only(수정/삭제 없이 신규 행만 insert).
 * 철회도 granted=false 행을 새로 추가한다. 로그인 사용자만 기록 가능(RLS).
 */
import type { ConsentKind } from '@/config/legal';

import { getSupabase } from './supabase';

export interface ConsentInput {
  kind: ConsentKind;
  granted: boolean;
  docVersion: string;
}

export async function recordConsents(
  inputs: ConsentInput[],
  method: 'signup_gate' | 'settings' = 'signup_gate',
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid || inputs.length === 0) return;

  const rows = inputs.map((i) => ({
    user_id: uid,
    kind: i.kind,
    granted: i.granted,
    doc_version: i.docVersion,
    method,
  }));

  const { error } = await sb.from('user_consents').insert(rows);
  if (error) throw error;
}
