/**
 * Supabase 클라이언트 (웹·앱 공용)
 *
 * 환경변수(EXPO_PUBLIC_*)는 Expo가 빌드 시 클라이언트 번들에 주입한다.
 * anon key는 공개되어도 안전한 키다(민감 작업은 RLS 정책 + Edge Function이 막는다).
 * service_role 키는 절대 클라이언트에 두지 않는다.
 *
 * .env 파일에 아래 값을 채우면 연결된다(.env.example 참고):
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** .env에 Supabase 값이 채워졌는지 여부 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

/**
 * Supabase 클라이언트를 반환한다. 환경변수가 없으면 null을 반환하므로
 * 호출부에서 isSupabaseConfigured()로 가드한 뒤 사용한다.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        // 웹은 localStorage, 네이티브는 AsyncStorage로 세션 영속화
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return client;
}
