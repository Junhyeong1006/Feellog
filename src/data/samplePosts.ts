/**
 * 커뮤니티 샘플 포스트(미리보기용 로컬 데이터). 실제 글쓰기/DB 연동은 다음 단계.
 * authorType으로 '우리 유형' 필터, category로 번들 사진(categoryPhoto)을 고른다.
 * 카피 규칙: 이모지 금지, 구어체 불균질(실사용자 톤) — de-AI 리서치 반영.
 */
import type { MainType } from '@/core';

export interface CommunityPost {
  id: string;
  authorName: string;
  authorType: MainType;
  timeAgo: string;
  body: string;
  category: string;
  hasPhoto: boolean;
  likeCount: number;
  commentCount: number;
}

export const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    authorName: '김영자',
    authorType: 'handcraft_achiever',
    timeAgo: '10분 전',
    body: '도자기 공방에서 첫 컵을 완성했어요. 삐뚤빼뚤해도 세상에 하나뿐인 내 컵이라 얼마나 뿌듯한지 몰라요.',
    category: '공예',
    hasPhoto: true,
    likeCount: 24,
    commentCount: 6,
  },
  {
    id: 'post-2',
    authorName: '박정호',
    authorType: 'active_explorer',
    timeAgo: '32분 전',
    body: '오늘 북한산 둘레길 완주! 날씨가 선선해서 걷기 딱 좋았습니다. 다음엔 같이 가실 분 계신가요?',
    category: '등산',
    hasPhoto: true,
    likeCount: 41,
    commentCount: 12,
  },
  {
    id: 'post-3',
    authorName: '이순남',
    authorType: 'warm_social',
    timeAgo: '1시간 전',
    body: '동네 합창단 정기모임 다녀왔어요. 함께 노래하니 마음이 참 따뜻해집니다. 새 멤버도 환영이에요!',
    category: '음악',
    hasPhoto: false,
    likeCount: 18,
    commentCount: 4,
  },
  {
    id: 'post-4',
    authorName: '최미경',
    authorType: 'culture_enjoyer',
    timeAgo: '2시간 전',
    body: '미술관 도슨트 투어 강력 추천합니다. 해설을 들으니 그림이 완전히 다르게 보이더라고요.',
    category: '전시',
    hasPhoto: true,
    likeCount: 33,
    commentCount: 8,
  },
  {
    id: 'post-5',
    authorName: '정광수',
    authorType: 'life_upgrade',
    timeAgo: '3시간 전',
    body: '스마트폰 사진 클래스에서 배운 대로 손주 사진 찍어줬더니 다들 놀라네요 ㅎㅎ 배우길 잘했어요.',
    category: '사진',
    hasPhoto: true,
    likeCount: 52,
    commentCount: 15,
  },
  {
    id: 'post-6',
    authorName: '한서윤',
    authorType: 'calm_immersion',
    timeAgo: '5시간 전',
    body: '아침 요가로 하루를 시작한 지 한 달째. 몸도 마음도 한결 가벼워졌어요. 꾸준함의 힘을 느낍니다.',
    category: '요가',
    hasPhoto: false,
    likeCount: 27,
    commentCount: 3,
  },
  {
    id: 'post-7',
    authorName: '오현식',
    authorType: 'handcraft_achiever',
    timeAgo: '어제',
    body: '목공 클래스에서 만든 원목 도마입니다. 사포질만 두 시간… 그래도 결과물 보니 힘든 게 싹 잊히네요.',
    category: '목공',
    hasPhoto: true,
    likeCount: 46,
    commentCount: 9,
  },
  {
    id: 'post-8',
    authorName: '서명자',
    authorType: 'warm_social',
    timeAgo: '어제',
    body: '주말 텃밭에서 첫 상추를 수확했어요. 이웃들과 나눠 먹으니 두 배로 맛있네요.',
    category: '텃밭',
    hasPhoto: true,
    likeCount: 38,
    commentCount: 11,
  },
];
