/**
 * 지도 딥링크 (0단계). 카카오맵 장소 검색을 연다 — 앱이 있으면 카카오맵 앱, 없으면 웹.
 * 좌표 없이 이름/지역으로 검색하므로 lat/lng 컬럼이 없어도 동작한다.
 * 임베드 지도(정적/인터랙티브)는 이후 단계에서 이 유틸 옆에 추가한다.
 */
import { Linking } from 'react-native';

export function kakaoMapSearchUrl(query: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
}

export async function openKakaoMapSearch(query: string): Promise<void> {
  const q = query.trim();
  if (!q) return;
  try {
    await Linking.openURL(kakaoMapSearchUrl(q));
  } catch {
    // 열기 실패는 조용히 무시(지도 앱/브라우저 없음 등)
  }
}
