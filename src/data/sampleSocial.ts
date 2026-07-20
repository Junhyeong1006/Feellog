/**
 * 소통/채팅 샘플 데이터(데모) — 서버 연결 전에도 전 기능이 체험되도록.
 * 실데이터가 생기면 해당 훅에서 서버 우선으로 대체된다.
 * 카피 규칙: 이모지 금지, 실사용자 톤(불균질 구어체).
 */
import { figmaAssets } from '@/assets/figmaAssets';

export interface SampleFriend {
  id: string;
  nickname: string;
  typeLabel: string | null;
  avatar: number | null;
  /** 채팅방 id(있으면 말풍선 진입 가능) */
  chatId: string | null;
  isGroup?: boolean;
  memberCount?: number;
}

export const SAMPLE_FRIENDS: SampleFriend[] = [
  { id: 'f1', nickname: '은빛바람', typeLabel: '만능 손재주형', avatar: figmaAssets.photos.avatarFriend1, chatId: 'c1' },
  { id: 'f2', nickname: '먹물스케치', typeLabel: '감성 충만형', avatar: figmaAssets.photos.avatarFriend2, chatId: 'c2' },
  { id: 'f3', nickname: '초록산책', typeLabel: '차분한 힐링형', avatar: figmaAssets.photos.avatarFriend3, chatId: 'c3' },
  { id: 'g1', nickname: '도자기 클래스 3반', typeLabel: null, avatar: null, chatId: 'c4', isGroup: true, memberCount: 5 },
];

export interface SampleMessage {
  id: string;
  chatId: string;
  /** 'me' | 친구 id */
  senderId: string;
  body: string | null;
  image: number | null;
  /** '오후 2:01' 형식 */
  timeLabel: string;
  /** 날짜 구분선(해당 메시지 앞에 표시) */
  dateLabel?: string;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  { id: 'm1', chatId: 'c1', senderId: 'f1', body: '안녕하세요! 오늘 오후 3시에 뵙기로 한 거 맞으시죠?', image: null, timeLabel: '오후 2:01', dateLabel: '2026년 7월 20일' },
  { id: 'm2', chatId: 'c1', senderId: 'me', body: '네 맞습니다 이따 오후에 뵙기로 했어요.', image: null, timeLabel: '오후 2:01' },
  { id: 'm3', chatId: 'c1', senderId: 'f1', body: '여기 입구로 들어오시면 됩니다.', image: figmaAssets.photos.chatCafe, timeLabel: '오후 2:05' },
  { id: 'm4', chatId: 'c1', senderId: 'me', body: '네 감사합니다.', image: null, timeLabel: '오후 2:07' },
  { id: 'm5', chatId: 'c2', senderId: 'f2', body: '지난번 민화 수업 그림 완성하셨어요? 저는 이제 배경 칠하는 중이에요.', image: null, timeLabel: '오전 11:20', dateLabel: '2026년 7월 19일' },
  { id: 'm6', chatId: 'c2', senderId: 'me', body: '아직요. 주말에 마저 하려고요. 완성되면 사진 올릴게요.', image: null, timeLabel: '오전 11:32' },
  { id: 'm7', chatId: 'c3', senderId: 'f3', body: '이번 주 토요일 둘레길 같이 걸으실래요? 날씨가 좋대요.', image: null, timeLabel: '오후 6:40', dateLabel: '2026년 7월 18일' },
  { id: 'm8', chatId: 'c4', senderId: 'f1', body: '다음 주 수업 준비물 공지 올라왔어요. 앞치마 챙겨오세요!', image: null, timeLabel: '오후 3:12', dateLabel: '2026년 7월 17일' },
];

export interface SamplePost {
  id: string;
  authorId: string;
  authorName: string;
  authorTypeLabel: string | null;
  avatar: number | null;
  timeLabel: string;
  /** 작성 카테고리 라벨(닉 옆 보조) */
  categoryLabel: string | null;
  body: string;
  /** 파스텔 배경 카드 색 키('pink'|'yellow'|'mint'|'purple'|'blue'|null=흰색) */
  bgTone: 'pink' | 'yellow' | 'mint' | 'purple' | 'blue' | null;
  tags: string[];
  /** 만족도 별점(후기 글이면 1~5, 일반 글이면 null) */
  rating: number | null;
  likeCount: number;
  commentCount: number;
  image: number | null;
}

export const SAMPLE_POSTS: SamplePost[] = [
  {
    id: 'p1',
    authorId: 'f1',
    authorName: '은빛바람',
    authorTypeLabel: '만능 손재주형',
    avatar: figmaAssets.photos.avatarFriend1,
    timeLabel: '10분 전',
    categoryLabel: '도자기 공방',
    body: '오랜만에 물레를 돌렸다. 흙이 손끝에서 미끄러지는 감각이 언제나처럼 마음을 차분하게 해준다. 이번에는 조금 더 깊은 국그릇을 만들어보려고 노력 중. 굽는 과정에서 색이 어떻게 나올지 벌써 기대된다.',
    bgTone: 'pink',
    tags: ['공방', '자유', '경험'],
    rating: 2,
    likeCount: 24,
    commentCount: 6,
    image: null,
  },
  {
    id: 'p2',
    authorId: 'f2',
    authorName: '먹물스케치',
    authorTypeLabel: '감성 충만형',
    avatar: figmaAssets.photos.avatarFriend2,
    timeLabel: '5시간 전',
    categoryLabel: '캘리그래피',
    body: '붓을 잡은 지 한 달째. 오늘은 좋아하는 시 한 구절을 썼다. 획이 아직 서툴러도 종이 위에 번지는 먹빛을 보고 있으면 시간 가는 줄 모르겠다.',
    bgTone: 'yellow',
    tags: ['캘리그래피', '몰입'],
    rating: 4,
    likeCount: 18,
    commentCount: 3,
    image: null,
  },
  {
    id: 'p3',
    authorId: 'f3',
    authorName: '초록산책',
    authorTypeLabel: '차분한 힐링형',
    avatar: figmaAssets.photos.avatarFriend3,
    timeLabel: '어제',
    categoryLabel: '가드닝',
    body: '베란다 텃밭 상추가 드디어 수확할 만큼 자랐다. 씨앗부터 키운 거라 더 뿌듯하다. 이웃과 나눠 먹을 생각에 벌써 즐겁다.',
    bgTone: 'mint',
    tags: ['가드닝', '일상'],
    rating: 5,
    likeCount: 31,
    commentCount: 9,
    image: null,
  },
];

/** 소통 피드 카드 배경 톤 → 팔레트 subtle 매핑 키(화면에서 tokens.categoryColors 대신 사용) */
export const POST_BG_TONES = {
  pink: '#FDEAE7',
  yellow: '#FEF3D7',
  mint: '#E0FAF2',
  purple: '#F0E8FD',
  blue: '#DBEAFE',
} as const;
