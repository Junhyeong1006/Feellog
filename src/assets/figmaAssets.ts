/**
 * Figma v6 블루 DS 에셋 맵 — assets/figma/* 의 require() SSOT.
 * SVG는 react-native-web에서 expo-image의 source로 그대로 렌더 가능.
 * 출처: assets/figma/SOURCES.md 참고.
 */

export const figmaAssets = {
  logos: {
    /** 워드마크 대 (로그인 히어로) — 180:709 */
    feellog: require('../../assets/figma/logo-feellog.svg'),
    /** 워드마크 소 (헤더) — 465:631 */
    feellogSm: require('../../assets/figma/logo-feellog-sm.svg'),
  },

  illustrations: {
    /** 온보딩 1 가위 일러스트 — 220:4731 */
    onboardingScissors: require('../../assets/figma/illust-onboarding-scissors.svg'),
    /** 온보딩 2 사람들 일러스트 — 220:4759 */
    onboardingPeople: require('../../assets/figma/illust-onboarding-people.svg'),
    /** 온보딩 3 연필 일러스트 — 220:4918 */
    onboardingPencil: require('../../assets/figma/illust-onboarding-pencil.svg'),
    /** 성향 테스트 시작 일러스트 — 50:6714 */
    testStart: require('../../assets/figma/illust-test-start.svg'),
  },

  /** 홈 카테고리 6종 아이콘 (activitySeed의 category와 1:1) */
  categoryIcons: {
    active: require('../../assets/figma/cat-active.svg'), // 활동 — 459:597
    food: require('../../assets/figma/cat-food.svg'), // 음식 — 459:598
    culture: require('../../assets/figma/cat-culture.svg'), // 문화·예술 — 459:599
    craft: require('../../assets/figma/cat-craft.svg'), // 공예 — 459:600
    nature: require('../../assets/figma/cat-nature.svg'), // 자연·힐링 — 459:601
    learning: require('../../assets/figma/cat-learning.svg'), // 배움 — 459:602
  },

  /** 하단 탭바 아이콘 (메인/기록/소통/마이 — 기록 탭 아이콘은 write 재사용) */
  tabIcons: {
    home: require('../../assets/figma/tab-home.svg'), // 471:969
    community: require('../../assets/figma/tab-community.svg'), // 471:974
    write: require('../../assets/figma/tab-write.svg'), // 471:979 (기록 탭)
    mypage: require('../../assets/figma/tab-mypage.svg'), // 471:984
  },

  icons: {
    cart: require('../../assets/figma/icon-cart.svg'), // 헤더 장바구니 — 465:644
    wishlist: require('../../assets/figma/icon-wishlist.svg'), // 찜 하트 — 563:4027
    star: require('../../assets/figma/icon-star.svg'), // 별점 채움 — 563:3928
    starOutline: require('../../assets/figma/icon-star-outline.svg'), // 별점 빈칸 — 537:1202
    back: require('../../assets/figma/icon-back.svg'), // 뒤로가기 — 555:2059
    plus: require('../../assets/figma/icon-plus.svg'), // 추가 — 559:3753
    chevronRight: require('../../assets/figma/icon-chevron-right.svg'), // 405:653
    dropdown: require('../../assets/figma/icon-dropdown.svg'), // 드롭다운 화살표 — 302:915
    profileCamera: require('../../assets/figma/icon-profile-camera.svg'), // 프로필 사진 카메라 — 302:777
    clock: require('../../assets/figma/icon-clock.svg'), // 소요시간 — 450:493
    heartOutline: require('../../assets/figma/icon-heart-outline.svg'), // 피드 좋아요 — 522:566
    comment: require('../../assets/figma/icon-comment.svg'), // 피드 댓글 — 522:571
    chatBubble: require('../../assets/figma/icon-chat-bubble.svg'), // 친구 목록 채팅 진입 — 533:1029
    send: require('../../assets/figma/icon-send.svg'), // 채팅 전송 — 559:3704
    location: require('../../assets/figma/icon-location.svg'), // 위치 핀 — 555:1831
    share: require('../../assets/figma/icon-share.svg'), // 결과 공유 — 334:1293
    bellOff: require('../../assets/figma/icon-bell-off.svg'), // 알림 OFF — 604:1396
    arrowCircle: require('../../assets/figma/icon-arrow-circle.svg'), // 후기쓰기 다음 — 604:1148
  },

  socialIcons: {
    kakao: require('../../assets/figma/social-kakao.svg'), // 265:542
    google: require('../../assets/figma/social-google.svg'), // 265:544
    apple: require('../../assets/figma/social-apple.svg'), // 220:4620
    naver: require('../../assets/figma/social-naver.svg'), // 265:516
  },

  photos: {
    /** 테스트 시작 화면 히어로("취미를 기록") — 50:6699 */
    testStartHero: require('../../assets/figma/photos/test-start-hero.png'),
    /** Q1/Q7 선택지 A — 고요한 공간 */
    testCalm: require('../../assets/figma/photos/test-calm.jpg'),
    /** Q1/Q7 선택지 B — 활동적 공간 */
    testActive: require('../../assets/figma/photos/test-active.jpg'),
    /** Q2 선택지 A — 정원 */
    testGarden: require('../../assets/figma/photos/test-garden.jpg'),
    /** Q2 선택지 B — 공예실 */
    testCraft: require('../../assets/figma/photos/test-craft.jpg'),
    /** Q3 선택지 A/B(디자인상 동일 이미지) — 힐링 */
    testHealing: require('../../assets/figma/photos/test-healing.jpg'),
    /** Q4 선택지 A — 혼자 */
    testAlone: require('../../assets/figma/photos/test-alone.jpg'),
    /** Q4 선택지 B — 함께 */
    testTogether: require('../../assets/figma/photos/test-together.jpg'),
    /** Q5 선택지 A — 50:6826 */
    testQ5A: require('../../assets/figma/photos/test-q5-a.jpg'),
    /** Q5 선택지 B — 50:6826 */
    testQ5B: require('../../assets/figma/photos/test-q5-b.jpg'),
    /** Q10 선택지 A — 65:9462 */
    testQ10A: require('../../assets/figma/photos/test-q10-a.jpg'),
    /** Q10 선택지 B — 65:9462 */
    testQ10B: require('../../assets/figma/photos/test-q10-b.jpg'),
    /** 결과 화면 캘리그래피 카드 — 334:1260 (ref 19e9a145ca53) */
    resultCalligraphy: require('../../assets/figma/photos/result-calligraphy.jpg'),
    /** 홈 오늘의 하루 픽 카드 썸네일 / 클래스 상세 하단 IMG — ref 3b77284547a9 */
    classThumb: require('../../assets/figma/photos/class-thumb.jpg'),
    /** 검색 결과·기록 탭 추천 카드 공용 사진 — ref ece298d0ec2c */
    classCard: require('../../assets/figma/photos/class-card.png'),
    /** 클래스 상세 히어로 사진 — 559:3774 */
    classDetailHero: require('../../assets/figma/photos/class-detail-hero.png'),
    /** 채팅방 전송된 카페 사진 — 559:3563 */
    chatCafe: require('../../assets/figma/photos/chat-cafe.png'),
    /** 아바타(플레이스홀더): 피드 상단 내 프로필 — 518:999 */
    avatarUser: require('../../assets/figma/photos/avatar-user.png'),
    avatarFriend1: require('../../assets/figma/photos/avatar-friend-1.png'),
    avatarFriend2: require('../../assets/figma/photos/avatar-friend-2.jpg'),
    avatarFriend3: require('../../assets/figma/photos/avatar-friend-3.jpg'),
    /** 마이페이지 프로필 사진 — 334:1043 */
    avatarMypage: require('../../assets/figma/photos/avatar-mypage.png'),
    /** 프로필 수정 화면 사진 — 334:1299 */
    avatarProfileEdit: require('../../assets/figma/photos/avatar-profile-edit.png'),
    /** 좋아요 맵 지도 배경(컨셉) — 334:1181 */
    mapWishlist: require('../../assets/figma/photos/map-wishlist.png'),
    mapCard1: require('../../assets/figma/photos/map-card-1.png'),
    mapCard2: require('../../assets/figma/photos/map-card-2.png'),
  },
} as const;

export type FigmaAssets = typeof figmaAssets;
