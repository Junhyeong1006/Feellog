/**
 * share — 결과 공유(S4). /result?v=… 딥링크는 stateless라 그대로 공유 가능.
 * 웹: navigator.share(모바일 브라우저) → 클립보드 복사 폴백(데스크탑).
 * 네이티브: RN Share 시트.
 * 반환값: 사용자에게 보여줄 피드백('shared' | 'copied' | 'dismissed' | 'failed').
 * dismissed = 사용자가 공유 시트를 닫음(정상 동작 — 안내 문구를 띄우지 않는다).
 */
import { Platform, Share } from 'react-native';

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

export interface ShareResultInput {
  /** 공유 문구 제목(예: '나는 감성 힐링형!') */
  title: string;
  /** 함께 보낼 설명 문구 */
  message: string;
  /** 결과 딥링크(절대 URL) */
  url: string;
}

export async function shareContent({ title, message, url }: ShareResultInput): Promise<ShareOutcome> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    // 모바일 브라우저 공유 시트
    if (nav?.share) {
      try {
        await nav.share({ title, text: message, url });
        return 'shared';
      } catch (e) {
        // 사용자가 시트를 닫은 경우(AbortError)는 실패가 아니다 — 조용히 종료
        if (e instanceof Error && e.name === 'AbortError') return 'dismissed';
        // 그 외(권한 등)는 클립보드 폴백으로 진행
      }
    }
    // Clipboard API는 보안 컨텍스트 전용(구형 웹뷰/http에서는 없음) — 없으면 실패로 정직하게 보고
    if (!nav?.clipboard?.writeText) return 'failed';
    try {
      await nav.clipboard.writeText(`${message}\n${url}`);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  try {
    // iOS는 url 필드를, Android는 message만 사용 → message에 URL 포함
    const result = await Share.share({ title, message: `${message}\n${url}`, url });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    return 'failed';
  }
}

/** 현재 origin 기준 절대 URL 생성(웹). 네이티브는 배포 웹 도메인으로 고정. */
export function absoluteUrl(path: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  // 네이티브 공유는 웹 링크가 받는 사람에게 가장 안전하다
  return `https://feellog.pages.dev${path}`;
}
