/**
 * analytics — 핵심 퍼널 이벤트 수집(S8).
 * PostHog HTTP capture API로 직접 전송(별도 SDK 의존성 없음, 웹·네이티브 공용).
 * EXPO_PUBLIC_POSTHOG_KEY 미설정 시 no-op(개발 중엔 콘솔 디버그만) — 계정 없이도 앱은 그대로 동작.
 *
 * 개인정보: 이벤트에 이름/프로필 내용·성향 유형 등 개인 특성을 싣지 않는다. 식별자는 익명 UUID,
 * 로그인 시 Supabase user id로 연결(identify). 마케팅 동의와 무관한 서비스 품질 측정 목적.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const ANON_ID_KEY = 'feellog.anonId';

let anonIdPromise: Promise<string> | null = null;
let userId: string | null = null;

async function anonId(): Promise<string> {
  if (!anonIdPromise) {
    anonIdPromise = (async () => {
      try {
        const existing = await AsyncStorage.getItem(ANON_ID_KEY);
        if (existing) return existing;
        const fresh = Crypto.randomUUID();
        await AsyncStorage.setItem(ANON_ID_KEY, fresh);
        return fresh;
      } catch {
        return 'anon';
      }
    })();
  }
  return anonIdPromise;
}

/** 로그인/로그아웃 시 식별자 연결. session?.user.id 또는 null. */
export function identify(id: string | null): void {
  const prev = userId;
  userId = id;
  // 익명 → 로그인 전환 시 PostHog에 병합 이벤트($identify)를 보내 퍼널이 끊기지 않게 한다
  if (id && id !== prev) {
    void (async () => {
      try {
        const anon = await anonId();
        if (anon !== id) await capture('$identify', id, { $anon_distinct_id: anon });
      } catch {
        // 병합 실패해도 이후 이벤트는 user id로 계속 적재된다
      }
    })();
  }
}

export type AnalyticsEvent =
  | 'page_view'
  | 'login_click'
  | 'guest_enter'
  | 'test_start'
  | 'test_complete'
  | 'reco_react'
  | 'activity_view'
  | 'booking_click'
  | 'map_open'
  | 'post_create'
  | 'comment_create'
  | 'result_share';

async function capture(
  event: string,
  distinctId: string,
  props?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!KEY) {
    if (__DEV__) console.debug(`[analytics] ${event}`, props ?? {});
    return;
  }
  await fetch(`${HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // keepalive: OAuth 풀페이지 리다이렉트 직전 이벤트(login_click)가 유실되지 않게.
    // RN fetch는 이 옵션을 무해하게 무시한다.
    keepalive: true,
    body: JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: distinctId,
      properties: { ...props },
      timestamp: new Date().toISOString(),
    }),
  });
}

/** 이벤트 전송(비동기 fire-and-forget — UI를 절대 막지 않는다). */
export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  void (async () => {
    try {
      const distinctId = userId ?? (await anonId());
      await capture(event, distinctId, props);
    } catch {
      // 수집 실패는 무시(서비스 동작과 무관)
    }
  })();
}
