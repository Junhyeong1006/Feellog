/**
 * Supabase Storage 업로드(post-images 버킷).
 * 경로 규칙: <uid>/<타임스탬프>.jpg — RLS가 본인 폴더에만 쓰기 허용.
 * 업로드 전 리사이즈(긴 변 1280 초과일 때만 — 업스케일 금지)·JPEG 압축으로 무료 티어 용량을 아낀다.
 *
 * 플랫폼 분기: 웹은 Blob 업로드, 네이티브(RN)는 Blob이 0바이트로 올라가는
 * storage-js의 알려진 제약이 있어 base64 → ArrayBuffer로 업로드한다.
 */
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { getSupabase } from './supabase';

const BUCKET = 'post-images';
/** 긴 변 최대 픽셀(시니어 피드 카드에 충분 + 용량 절약) */
const MAX_DIMENSION = 1280;
const MAX_BYTES = 5 * 1024 * 1024;

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

/** base64 → ArrayBuffer (네이티브 업로드용 — atob 미보장 환경 대비 자체 디코더) */
function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = CHARS.indexOf(clean[i]);
    const b = CHARS.indexOf(clean[i + 1]);
    const c = CHARS.indexOf(clean[i + 2]);
    const d = CHARS.indexOf(clean[i + 3]);
    bytes[p++] = (a << 2) | (b >> 4);
    if (c >= 0) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (d >= 0) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes.buffer.slice(0, p);
}

export interface UploadImageInput {
  uri: string;
  /** 원본 크기(px) — 알면 긴 변 기준 리사이즈/스킵 판단에 사용(picker asset이 제공) */
  width?: number | null;
  height?: number | null;
}

/**
 * 로컬 이미지(갤러리 선택 결과)를 압축해 업로드하고 공개 URL을 반환.
 * 실패 시 사용자에게 보여줄 메시지로 throw.
 */
export async function uploadPostImage({ uri, width, height }: UploadImageInput): Promise<string> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) throw new Error('로그인이 필요해요.');

  // 긴 변 기준 리사이즈 액션 계산 — 1280 이하면 리사이즈 생략(업스케일 금지), JPEG 재인코딩만
  const actions: ImageManipulator.Action[] = [];
  if (width != null && height != null && width > 0 && height > 0) {
    const long = Math.max(width, height);
    if (long > MAX_DIMENSION) {
      actions.push(width >= height ? { resize: { width: MAX_DIMENSION } } : { resize: { height: MAX_DIMENSION } });
    }
  } else {
    // 크기를 모르면 가로 기준 축소(구형 브라우저 폴백 — 세로가 긴 사진은 다소 클 수 있음)
    actions.push({ resize: { width: MAX_DIMENSION } });
  }

  const wantBase64 = Platform.OS !== 'web';
  let processedUri = uri;
  let base64: string | null = null;
  try {
    const manipulated = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: 0.75,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: wantBase64,
    });
    processedUri = manipulated.uri;
    base64 = manipulated.base64 ?? null;
  } catch {
    // 압축 실패 → 원본 업로드 시도(버킷 5MB 제한이 최후 방어선)
  }

  let payload: Blob | ArrayBuffer;
  if (Platform.OS === 'web') {
    const res = await fetch(processedUri);
    payload = await res.blob();
    if (payload.size > MAX_BYTES) {
      throw new Error('사진이 너무 커요(5MB 이하). 다른 사진을 골라주세요.');
    }
  } else {
    // 네이티브: base64 → ArrayBuffer (Blob 업로드는 0바이트 버그)
    if (!base64) {
      const res = await fetch(processedUri);
      const blob = await res.blob();
      if (blob.size > MAX_BYTES) throw new Error('사진이 너무 커요(5MB 이하). 다른 사진을 골라주세요.');
      payload = await new Response(blob).arrayBuffer();
    } else {
      payload = base64ToArrayBuffer(base64);
      if (payload.byteLength > MAX_BYTES) {
        throw new Error('사진이 너무 커요(5MB 이하). 다른 사진을 골라주세요.');
      }
    }
  }

  const path = `${uid}/${Date.now()}.jpg`;
  const { error } = await sb.storage.from(BUCKET).upload(path, payload, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error('사진 업로드에 실패했어요. 잠시 후 다시 시도해주세요.');

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
