/**
 * 성향테스트 진행 상태 로컬 저장(S2 DoD: 중도 이탈 시 이어하기).
 * 새로고침/뒤로가기로 이탈해도 답변이 남는다. 완료 시 삭제.
 * 문항 세트가 바뀌면(qids 불일치) 저장분을 버린다(엉뚱한 문항에 답 매핑 방지).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { QUESTIONS, type AnswerValue } from '@/core';

const KEY = 'feellog.testProgress';
/** 이어하기 유효 기간 — 너무 오래된 진행분은 새로 시작 */
const MAX_AGE_MS = 1000 * 60 * 60 * 48; // 48시간

export interface TestProgress {
  /** 문항별 응답(미응답 null), QUESTIONS 순서 */
  values: (AnswerValue | null)[];
  /** 현재 문항 인덱스 */
  idx: number;
  /** 저장 시점(ms) */
  savedAt: number;
  /** 저장 당시 문항 id 목록(문항 개편 감지용) */
  qids: (typeof QUESTIONS)[number]['id'][];
}

function currentQids() {
  return QUESTIONS.map((q) => q.id);
}

export async function getTestProgress(): Promise<TestProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as TestProgress;
    const qids = currentQids();
    const valid =
      Array.isArray(p.values) &&
      p.values.length === qids.length &&
      Array.isArray(p.qids) &&
      p.qids.length === qids.length &&
      p.qids.every((id, i) => id === qids[i]) &&
      typeof p.idx === 'number' &&
      p.idx >= 0 &&
      p.idx < qids.length &&
      typeof p.savedAt === 'number' &&
      Date.now() - p.savedAt < MAX_AGE_MS;
    if (!valid) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export async function setTestProgress(values: (AnswerValue | null)[], idx: number): Promise<void> {
  try {
    const p: TestProgress = { values, idx, savedAt: Date.now(), qids: currentQids() };
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // 저장 실패는 치명적이지 않음(이어하기만 안 될 뿐)
  }
}

export async function clearTestProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

/** 응답한 문항 수(이어하기 안내 문구용) */
export function answeredCount(p: TestProgress): number {
  return p.values.filter((v) => v != null).length;
}
