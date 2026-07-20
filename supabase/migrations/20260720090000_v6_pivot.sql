-- Feellog v6 피벗: 엔진 v2(7축·-25~+25·T01~T06) + 신규 기능(찜/장바구니/리뷰/친구/채팅/기록/공지)
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행(최초 1회). 이전 3개 마이그레이션 이후에 실행.
--
-- 설계 메모:
--  · 5축 legacy(activities·reactions·taste_profiles)는 v6에서 폐기 → drop 후 7축으로 재정의.
--    (기존 배포 DB에 실데이터 없음 전제 — 있다면 백업 후 실행할 것)
--  · 7축: physical relation experience satisfaction value novelty depth, 각 -25..+25 (정책 §2)
--  · 사용자 점수: initial_*(최초 테스트, 고정) / current_*(피드백 보정) 분리 + 이력(정책 §4.5)
--  · RLS 패턴은 기존 3개 파일과 동일: enable+FORCE, 본인 소유 정책, 컬럼 그랜트(위조 방지),
--    SECURITY DEFINER 트리거(스냅샷·카운터), btrim 체크(공백만 입력 차단)
--  · 공개 조회가 필요한 타인 프로필(친구/채팅 상대)은 owner 뷰(auth.uid() 필터 내장)로 최소 노출

-- ═══════════════════════════════ 0. 5축 legacy 폐기 ═══════════════════════════════
drop table if exists public.reactions;        -- 좋아요 피드백 → preference_update_history + wishlist로 대체
drop table if exists public.activities;       -- 5축 uuid PK → 7축 text PK('A001'…)로 재정의
drop table if exists public.taste_profiles;   -- 5축 벡터 → preference_scores(7축)로 대체
drop type if exists reaction_kind;
-- ※ main_type enum(구 6유형 네이밍)은 community_posts.main_type이 참조하므로 유지(legacy).
--    v6 유형 코드는 text 'T01'~'T06' (src/core/config.ts TYPE_PROFILES가 라벨 정본).

-- ═══════════════════════════════ 1. activities (7축 재정의) ═══════════════════════════════
-- 카드 점수는 고정값(정책 §4.1). 시드 70종 = docs/planning/activity_cards_seed_ko.csv 정본.
create table public.activities (
  id                 text primary key check (id ~ '^A[0-9]{3}$'),  -- 'A001'…'A070'
  name               text not null,     -- 활동명
  title              text not null,     -- 카드 제목
  summary            text not null,     -- 카드 1줄 설명
  type_label         text not null,     -- 유형 라벨(시드 표기 — 표시용, 판정은 7축)
  category           text not null check (category in
                       ('요리','수공예','미술','플라워','뷰티','액티비티','음악','라이프스타일','정규')),
  axis_physical      smallint not null check (axis_physical      between -25 and 25),
  axis_relation      smallint not null check (axis_relation      between -25 and 25),
  axis_experience    smallint not null check (axis_experience    between -25 and 25),
  axis_satisfaction  smallint not null check (axis_satisfaction  between -25 and 25),
  axis_value         smallint not null check (axis_value         between -25 and 25),
  axis_novelty       smallint not null check (axis_novelty       between -25 and 25),
  axis_depth         smallint not null check (axis_depth         between -25 and 25),
  physical_burden    smallint not null check (physical_burden between 1 and 5),  -- 성향 축 아님(필터)
  price              integer  check (price is null or price >= 0),               -- 원(시드 미정 → null)
  duration_min       integer  check (duration_min is null or duration_min > 0),
  difficulty         text     check (difficulty is null or difficulty in ('easy','normal','hard')),
  image_url          text,
  is_active          boolean not null default true
);
create index activities_category_idx on public.activities (category) where is_active;

alter table public.activities enable row level security;
alter table public.activities force row level security;
-- 활성 카탈로그 공개 읽기. 쓰기 정책 없음 → service_role(관리자/시드)만.
create policy "activities public read" on public.activities for select using (is_active);

insert into public.activities
  (id, name, title, summary, type_label, category,
   axis_physical, axis_relation, axis_experience, axis_satisfaction, axis_value, axis_novelty, axis_depth, physical_burden)
values
  ('A001', '천연 발효빵 만들기', '천연 발효빵 워크숍', '발효종부터 빵 굽기까지 천천히 경험하는 클래스', '만능 손재주형', '요리', -5, 0, 25, 25, 15, 5, 10, 2),
  ('A002', '쿠키 만들기', '쿠키 베이킹 클래스', '간단한 쿠키를 굽고 완성물을 가져가는 클래스', '만능 손재주형', '요리', -5, 5, 25, 25, 10, 0, -10, 2),
  ('A003', '마카롱 만들기', '마카롱 만들기 클래스', '섬세한 베이킹과 뚜렷한 완성물을 경험하는 활동', '만능 손재주형', '요리', -5, 0, 25, 25, 5, 10, 0, 2),
  ('A004', '떡 만들기', '전통 떡 만들기', '실생활에 활용하기 좋은 전통 떡을 직접 만드는 클래스', '만능 손재주형', '요리', -5, 5, 25, 25, 20, 0, 0, 2),
  ('A005', '앙금 플라워 케이크 만들기', '앙금 플라워 케이크', '꽃 모양 앙금으로 케이크를 장식하는 클래스', '만능 손재주형', '요리', -10, 5, 25, 25, 0, 10, -5, 2),
  ('A006', '나만의 블렌딩 티 만들기', '나만의 블렌딩 티', '기분과 취향에 맞춰 찻잎을 조합하는 활동', '감성 충만형', '요리', -15, 0, 10, 10, -25, 10, -10, 1),
  ('A007', '다도 클래스', '다도 클래스', '차를 우리고 천천히 즐기는 방법을 배우는 활동', '차분한 힐링형', '요리', -20, -5, -10, -20, -20, 5, 5, 1),
  ('A008', '핸드드립 클래스', '핸드드립 커피 기초', '일상에서 활용할 수 있는 커피 추출법을 배우는 클래스', '배움의 즐거움형', '요리', -10, 0, 20, 10, 20, 0, 10, 1),
  ('A009', '라떼 아트 만들기', '라떼 아트 체험', '우유 따르기와 간단한 패턴을 연습하는 활동', '만능 손재주형', '요리', -5, 5, 25, 20, 10, 10, 5, 1),
  ('A010', '비건 브런치 만들기', '비건 브런치 클래스', '건강한 식물성 브런치 메뉴를 만들어 보는 클래스', '배움의 즐거움형', '요리', 0, 5, 25, 20, 25, 10, 5, 2),
  ('A011', '전통 김치 만들기', '전통 김치 클래스', '익숙한 김치를 체계적으로 직접 만들어 보는 수업', '만능 손재주형', '요리', 0, 10, 25, 25, 25, -5, 5, 3),
  ('A012', '이탈리안 요리 기초', '이탈리안 홈쿠킹', '파스타와 리조또와 스테이크 등을 배우는 클래스', '만능 손재주형', '요리', 0, 10, 25, 20, 15, 10, 0, 2),
  ('A013', '도자기 체험', '도자기 손빚기', '흙을 손으로 빚고 완성물을 가져가는 활동', '만능 손재주형', '수공예', -10, -5, 25, 25, 0, 5, -5, 1),
  ('A014', '나무 식기류 만들기', '나무 식기 만들기', '작은 나무 접시나 수저를 만드는 클래스', '만능 손재주형', '수공예', -10, -5, 25, 25, 20, 10, -5, 2),
  ('A015', '자개공예', '자개공예 클래스', '전통적인 빛과 무늬로 작은 물건을 장식하는 활동', '감성 충만형', '수공예', -15, -5, 25, 25, -15, 15, -5, 1),
  ('A016', '레진 트레이 만들기', '레진 트레이 워크숍', '색감이 있는 레진 트레이를 만드는 활동', '만능 손재주형', '수공예', -15, 0, 25, 25, -10, 15, -10, 1),
  ('A017', '글라스 아트', '글라스 아트 클래스', '색과 빛을 활용한 장식품을 만드는 활동', '감성 충만형', '수공예', -10, -5, 25, 20, -20, 15, -5, 1),
  ('A018', '팔찌 만들기', '팔찌 만들기', '비즈나 원석으로 착용 가능한 팔찌를 만드는 활동', '만능 손재주형', '수공예', -15, 0, 25, 25, -5, 0, -10, 1),
  ('A019', '화분 페인팅', '화분 페인팅', '작은 화분에 그림을 그리고 가져가는 활동', '감성 충만형', '수공예', -15, 0, 25, 25, -15, 0, -10, 1),
  ('A020', '러그 만들기', '미니 러그 만들기', '반복적인 손작업으로 작은 러그를 만드는 활동', '만능 손재주형', '수공예', 0, -10, 25, 25, 0, 10, 5, 2),
  ('A021', '뜨개질 가방', '뜨개질 가방 클래스', '간단한 뜨개질 가방 프로젝트를 시작하는 수업', '만능 손재주형', '수공예', -15, -10, 25, 25, 10, 0, 20, 1),
  ('A022', '가죽공예', '가죽 소품 만들기', '카드지갑이나 키링 같은 작은 가죽 소품을 만드는 활동', '만능 손재주형', '수공예', -10, -5, 25, 25, 15, 10, -5, 2),
  ('A023', '가구 만들기', '작은 가구 만들기', '간단한 스툴이나 작은 선반을 만드는 클래스', '만능 손재주형', '수공예', 5, -5, 25, 25, 25, 15, 10, 4),
  ('A024', '아크릴화 드로잉', '아크릴화 드로잉', '초보자 안내와 함께 색감 있는 그림을 그리는 활동', '감성 충만형', '미술', -15, -5, 20, 15, -25, 5, -5, 1),
  ('A025', '오일 파스텔 드로잉', '오일 파스텔 드로잉', '부드럽고 따뜻한 색감의 그림을 그리는 활동', '감성 충만형', '미술', -15, -10, 20, 10, -25, 0, -5, 1),
  ('A026', '펜 드로잉', '펜 드로잉 클래스', '간단한 선으로 사물이나 장소를 그리는 활동', '감성 충만형', '미술', -20, -10, 20, 10, -20, 0, 5, 1),
  ('A027', '텍스쳐 나이프화', '텍스쳐 나이프 페인팅', '두꺼운 물감과 나이프로 입체감 있는 그림을 만드는 활동', '감성 충만형', '미술', -15, 0, 25, 20, -25, 15, -5, 1),
  ('A028', '수채화 드로잉', '수채화 드로잉', '부드러운 색과 차분한 과정을 즐기는 그림 활동', '감성 충만형', '미술', -20, -10, 20, 5, -25, 0, 5, 1),
  ('A029', '어반스케치', '어반스케치 산책', '익숙한 거리와 카페를 안내에 따라 그려보는 활동', '감성 충만형', '미술', 5, 5, 15, 5, -25, 10, 0, 2),
  ('A030', '민화', '민화 클래스', '상징적인 무늬가 있는 전통 그림을 그리는 활동', '감성 충만형', '미술', -20, -5, 20, 15, -25, 5, 10, 1),
  ('A031', '캘리그라피', '캘리그라피 기초', '의미 있는 문장을 아름다운 글씨로 표현하는 활동', '감성 충만형', '미술', -20, -10, 25, 15, -20, 0, 10, 1),
  ('A032', '도장 만들기', '나만의 도장 만들기', '작은 개인 도장을 디자인하거나 새기는 활동', '만능 손재주형', '미술', -15, -5, 25, 25, -10, 10, -5, 1),
  ('A033', '낙서 테라피', '낙서 테라피', '성과 부담 없이 자유롭게 그리며 쉬어가는 활동', '차분한 힐링형', '미술', -20, -10, 10, -25, -25, 10, -10, 1),
  ('A034', '테라리움', '테라리움 워크숍', '작은 유리 정원을 만들어 집에 두는 활동', '차분한 힐링형', '플라워', -10, 0, 25, 20, -15, 5, -5, 1),
  ('A035', '꽃다발', '계절 꽃다발 만들기', '계절 꽃으로 꽃다발을 구성하는 활동', '감성 충만형', '플라워', -5, 0, 25, 25, -25, 0, -10, 1),
  ('A036', '가드닝 클래스', '초보 가드닝', '식물을 심고 돌보는 방법을 배우는 활동', '차분한 힐링형', '플라워', 5, 0, 20, 5, 15, 0, 15, 2),
  ('A037', '센터피스', '테이블 센터피스', '집에 둘 수 있는 꽃 장식물을 만드는 활동', '감성 충만형', '플라워', -5, 0, 25, 25, -20, 0, -5, 1),
  ('A038', '퍼스널컬러', '퍼스널컬러 진단', '나에게 어울리는 색과 스타일을 찾아보는 활동', '감성 충만형', '뷰티', -25, 5, -5, 10, -20, 15, -10, 1),
  ('A039', '퍼스널 메이크업', '퍼스널 메이크업 클래스', '얼굴과 일상에 맞는 메이크업 방법을 배우는 활동', '배움의 즐거움형', '뷰티', -15, 5, 20, 15, 15, 10, 10, 1),
  ('A040', '헤어 스타일링', '헤어 스타일링 기초', '일상에서 쉽게 쓰는 헤어 스타일링 팁을 배우는 활동', '배움의 즐거움형', '뷰티', -10, 5, 20, 15, 20, 5, 5, 1),
  ('A041', '네일 아트', '네일 아트 체험', '색과 디자인을 활용해 간단한 네일 아트를 해보는 활동', '감성 충만형', '뷰티', -20, 0, 20, 20, -20, 10, -10, 1),
  ('A042', '스타일링 클래스', '퍼스널 스타일링 클래스', '체형과 취향에 맞는 옷차림을 배우는 활동', '배움의 즐거움형', '뷰티', -20, 5, 5, 10, 10, 10, 5, 1),
  ('A043', '피부 루틴 컨설팅', '스킨케어 루틴 점검', '현재 화장품과 관리 습관을 점검하는 활동', '배움의 즐거움형', '뷰티', -25, 0, -5, 5, 25, 0, 10, 1),
  ('A044', '천연 립밤 만들기', '천연 립밤 만들기', '천연 재료로 간단한 립밤을 만드는 활동', '만능 손재주형', '뷰티', -10, 0, 25, 25, 15, 5, -10, 1),
  ('A045', '블렌딩 오일 클래스', '블렌딩 오일 클래스', '기분과 관리 목적에 맞는 아로마 오일을 만드는 활동', '감성 충만형', '뷰티', -15, 0, 20, 15, -20, 10, -10, 1),
  ('A046', '향수 만들기', '향수 만들기', '향 노트를 조합해 개인 향수를 디자인하는 활동', '감성 충만형', '뷰티', -15, 0, 20, 20, -25, 15, -10, 1),
  ('A047', '파크골프', '파크골프 입문', '간단한 규칙으로 시작하는 야외 스포츠 체험', '활기찬 에너지형', '액티비티', 10, 20, 25, 5, 10, 0, 10, 3),
  ('A048', '요가', '부드러운 요가', '호흡과 가벼운 스트레칭을 천천히 하는 활동', '차분한 힐링형', '액티비티', 10, 0, 20, -20, 15, 0, 15, 2),
  ('A049', '필라테스', '초보 필라테스', '자세와 코어 움직임을 안내받으며 연습하는 활동', '배움의 즐거움형', '액티비티', 15, 0, 25, 10, 20, 0, 15, 3),
  ('A050', '정통 줌바', '줌바 댄스 입문', '음악에 맞춰 함께 움직이는 활기찬 그룹 활동', '활기찬 에너지형', '액티비티', 25, 25, 25, -10, -10, 10, 5, 4),
  ('A051', '카약', '카약 체험', '안내를 받으며 물 위에서 즐기는 활동', '활기찬 에너지형', '액티비티', 15, 15, 25, -5, -20, 25, -10, 4),
  ('A052', '스쿼시', '스쿼시 입문', '빠른 움직임이 있는 실내 라켓 스포츠 체험', '활기찬 에너지형', '액티비티', 25, 10, 25, 5, 5, 15, 5, 5),
  ('A053', '등산', '가벼운 등산 모임', '초보자 친화적인 코스를 함께 걷는 활동', '활기찬 에너지형', '액티비티', 15, 20, 20, -15, -15, 0, 5, 4),
  ('A054', '낚시', '초보 낚시', '기본 안내를 받으며 천천히 즐기는 야외 활동', '차분한 힐링형', '액티비티', -10, 5, 15, -20, -10, 5, 10, 2),
  ('A055', '보컬', '보컬 클래스', '좋아하는 노래를 더 편하게 부르는 방법을 배우는 활동', '배움의 즐거움형', '음악', -15, 5, 25, -5, -15, 10, 20, 2),
  ('A056', '드럼', '드럼 체험', '기본 드럼 연주로 리듬과 움직임을 경험하는 활동', '활기찬 에너지형', '음악', 5, 5, 25, 0, -10, 20, 10, 3),
  ('A057', '디제잉', '디제잉 입문', '기초 장비로 음악을 믹싱해보는 활동', '활기찬 에너지형', '음악', -10, 5, 25, 5, -20, 25, -5, 2),
  ('A058', '발성', '발성 트레이닝', '호흡과 목소리 내는 방법을 연습하는 활동', '배움의 즐거움형', '음악', -15, 0, 25, 5, 15, 5, 20, 2),
  ('A059', '우쿨렐레', '우쿨렐레 입문', '작고 친근한 악기로 음악을 시작하는 활동', '배움의 즐거움형', '음악', -15, 5, 25, -5, -10, 10, 20, 1),
  ('A060', '피아노', '피아노 입문', '익숙한 멜로디로 기초 피아노를 경험하는 활동', '배움의 즐거움형', '음악', -15, -10, 25, 0, -10, 0, 25, 1),
  ('A061', '기질 성격 검사', '기질 성격 검사 세션', '나의 성향과 대화 방식을 돌아보는 활동', '감성 충만형', '라이프스타일', -25, 0, -10, -20, -10, 10, -10, 1),
  ('A062', '스마트폰 사진 촬영과 보정법', '스마트폰 사진 클래스', '휴대폰으로 사진을 찍고 보정하는 방법을 배우는 활동', '배움의 즐거움형', '라이프스타일', 5, 5, 20, 10, 25, 5, 10, 2),
  ('A063', '취미 연기', '취미 연기 클래스', '표정과 목소리와 짧은 장면을 그룹에서 경험하는 활동', '활기찬 에너지형', '라이프스타일', 15, 20, 25, -10, -20, 20, 5, 3),
  ('A064', '필름카메라', '필름카메라 산책', '필름카메라 감성으로 천천히 사진을 찍는 활동', '감성 충만형', '라이프스타일', 5, 5, 10, -15, -25, 15, -5, 2),
  ('A065', '북아트', '북아트 워크숍', '작은 수제 책 오브제를 만드는 활동', '만능 손재주형', '라이프스타일', -15, -5, 25, 25, -15, 10, -5, 1),
  ('A066', '클래식 음악 감상', '클래식 음악 감상', '쉬운 해설과 함께 클래식 음악을 듣는 활동', '감성 충만형', '라이프스타일', -25, 0, -25, -25, -25, 0, 10, 1),
  ('A067', '업사이클링 봉제', '업사이클링 봉제', '낡은 천을 유용한 소품으로 바꾸는 활동', '만능 손재주형', '정규', -10, -5, 25, 25, 25, 10, 20, 2),
  ('A068', '와이어 아트', '와이어 아트 클래스', '와이어로 간단한 형태나 장식을 만드는 활동', '만능 손재주형', '정규', -15, -5, 25, 25, -10, 10, -5, 1),
  ('A069', '영어 스피킹', '영어 스피킹 모임', '여행이나 일상 영어를 그룹에서 연습하는 활동', '배움의 즐거움형', '정규', -20, 20, 10, 5, 25, 0, 25, 1),
  ('A070', '생활 목공 체험', '생활 목공 체험', '목공 도구의 안전한 사용법을 배우고 도마나 트레이 같은 생활소품 하나를 완성하는 원데이 클래스', '만능 손재주형', '수공예', -5, 0, 25, 25, 25, 10, 10, 3)
on conflict (id) do update set
  name = excluded.name, title = excluded.title, summary = excluded.summary,
  type_label = excluded.type_label, category = excluded.category,
  axis_physical = excluded.axis_physical, axis_relation = excluded.axis_relation,
  axis_experience = excluded.axis_experience, axis_satisfaction = excluded.axis_satisfaction,
  axis_value = excluded.axis_value, axis_novelty = excluded.axis_novelty,
  axis_depth = excluded.axis_depth, physical_burden = excluded.physical_burden;
-- ═══════════════════════════════ 2. profiles 확장 ═══════════════════════════════
-- display_name/avatar_url은 기존 존재 → nickname(직접 편집용)·성별·생일·소개만 추가.
alter table public.profiles
  add column if not exists nickname   text check (nickname is null or char_length(btrim(nickname)) between 1 and 20),
  add column if not exists gender     text check (gender is null or gender in ('male', 'female')),
  add column if not exists birth_date date check (birth_date is null or birth_date between date '1900-01-01' and current_date),
  add column if not exists bio        text check (bio is null or char_length(bio) <= 500);

-- 신규 가입 트리거: nickname도 소셜 이름으로 초기화(사용자가 이후 직접 수정)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nm   text;
begin
  nm := coalesce(
    nullif(btrim(meta ->> 'nickname'), ''),           -- kakao
    nullif(btrim(meta ->> 'full_name'), ''),          -- google / apple(name scope)
    nullif(btrim(meta ->> 'name'), ''),               -- google
    nullif(btrim(meta ->> 'preferred_username'), '')  -- oidc
  );
  insert into public.profiles (id, display_name, nickname, avatar_url, auth_provider)
  values (
    new.id,
    nm,
    left(nm, 20),
    coalesce(meta ->> 'avatar_url', meta ->> 'profile_image', meta ->> 'picture'),
    coalesce(new.raw_app_meta_data ->> 'provider', meta ->> 'provider')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise log 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- ═══════════════════════════════ 3. preference_scores (7축 선호, 정책 §4.5) ═══════════════════════════════
-- initial_* = 최초 테스트 결과(재검사 시에만 갱신), current_* = 피드백 학습률 보정 현재값.
-- real: 학습률 곱 결과가 소수(-3.0, -6.2 …). clamp -25..+25는 코어(engine)와 CHECK 이중 방어.
create table public.preference_scores (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  initial_physical     real not null default 0 check (initial_physical     between -25 and 25),
  initial_relation     real not null default 0 check (initial_relation     between -25 and 25),
  initial_experience   real not null default 0 check (initial_experience   between -25 and 25),
  initial_satisfaction real not null default 0 check (initial_satisfaction between -25 and 25),
  initial_value        real not null default 0 check (initial_value        between -25 and 25),
  initial_novelty      real not null default 0 check (initial_novelty      between -25 and 25),
  initial_depth        real not null default 0 check (initial_depth        between -25 and 25),
  current_physical     real not null default 0 check (current_physical     between -25 and 25),
  current_relation     real not null default 0 check (current_relation     between -25 and 25),
  current_experience   real not null default 0 check (current_experience   between -25 and 25),
  current_satisfaction real not null default 0 check (current_satisfaction between -25 and 25),
  current_value        real not null default 0 check (current_value        between -25 and 25),
  current_novelty      real not null default 0 check (current_novelty      between -25 and 25),
  current_depth        real not null default 0 check (current_depth        between -25 and 25),
  main_type            text check (main_type is null or main_type in ('T01','T02','T03','T04','T05','T06')),
  feedback_count       integer not null default 0 check (feedback_count >= 0),
  updated_at           timestamptz not null default now()
);
create trigger trg_preference_scores_updated before update on public.preference_scores
  for each row execute function public.set_updated_at();

-- 피드백 이력: 행동·대상 활동·축별 변화량(잘못된 피드백 되돌리기/성향 변화 추적용)
create table public.preference_update_history (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  activity_id text references public.activities(id) on delete set null,
  -- 정책 §4.3 행동 분류: view(상세보기) like(찜) unlike(찜해제) complete(체험만족) dismiss(관심없음) hate(매우싫어요)
  action      text not null check (action in ('view','like','unlike','complete','dismiss','hate')),
  -- { "learning_rate": 0.10, "deltas": { "physical": 2.0, ... }, "before": {...}, "after": {...} }
  axis_deltas jsonb not null default '{}' check (pg_column_size(axis_deltas) <= 2048),
  created_at  timestamptz not null default now()
);
create index pref_history_user_idx on public.preference_update_history (user_id, created_at desc);

alter table public.preference_scores         enable row level security;
alter table public.preference_update_history enable row level security;
alter table public.preference_scores         force row level security;
alter table public.preference_update_history force row level security;

-- MVP: 소유자 직접 upsert(자기 벡터 위조는 본인 추천에만 영향 — taste_profiles 때와 동일 판단)
create policy "pref self all"           on public.preference_scores for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pref history self insert" on public.preference_update_history for insert
  with check (auth.uid() = user_id);
create policy "pref history self select" on public.preference_update_history for select
  using (auth.uid() = user_id);
-- 이력은 append-only(UPDATE/DELETE 정책 없음)

-- 컬럼 그랜트: user_id/updated_at/id 위조 방지
revoke insert, update on public.preference_scores from anon, authenticated;
grant insert (user_id,
  initial_physical, initial_relation, initial_experience, initial_satisfaction,
  initial_value, initial_novelty, initial_depth,
  current_physical, current_relation, current_experience, current_satisfaction,
  current_value, current_novelty, current_depth,
  main_type, feedback_count) on public.preference_scores to authenticated;
grant update (
  initial_physical, initial_relation, initial_experience, initial_satisfaction,
  initial_value, initial_novelty, initial_depth,
  current_physical, current_relation, current_experience, current_satisfaction,
  current_value, current_novelty, current_depth,
  main_type, feedback_count) on public.preference_scores to authenticated;
revoke insert, update, delete on public.preference_update_history from anon, authenticated;
grant insert (user_id, activity_id, action, axis_deltas) on public.preference_update_history to authenticated;

-- ═══════════════════════════════ 4. wishlist(찜) · cart_items(장바구니) ═══════════════════════════════
create table public.wishlist (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  activity_id text not null references public.activities(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, activity_id)
);
create table public.cart_items (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  activity_id text not null references public.activities(id) on delete cascade,
  qty         smallint not null default 1 check (qty between 1 and 99),
  created_at  timestamptz not null default now(),
  primary key (user_id, activity_id)
);

alter table public.wishlist   enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist   force row level security;
alter table public.cart_items force row level security;

create policy "wishlist self insert" on public.wishlist for insert with check (auth.uid() = user_id);
create policy "wishlist self select" on public.wishlist for select using (auth.uid() = user_id);
create policy "wishlist self delete" on public.wishlist for delete using (auth.uid() = user_id);
create policy "cart self insert" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "cart self select" on public.cart_items for select using (auth.uid() = user_id);
create policy "cart self update" on public.cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart self delete" on public.cart_items for delete using (auth.uid() = user_id);

revoke insert on public.wishlist from anon, authenticated;
grant insert (user_id, activity_id) on public.wishlist to authenticated;
revoke insert, update on public.cart_items from anon, authenticated;
grant insert (user_id, activity_id, qty) on public.cart_items to authenticated;
grant update (qty) on public.cart_items to authenticated;

-- ═══════════════════════════════ 5. reviews (활동 후기) ═══════════════════════════════
-- 공개 읽기라서 작성자 이름/아바타는 커뮤니티와 동일하게 작성 시점 스냅샷(profiles self-select RLS 때문).
create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  activity_id       text not null references public.activities(id) on delete cascade,
  body              text not null check (char_length(btrim(body)) between 1 and 1000),
  rating            smallint not null check (rating between 1 and 5),
  difficulty        text check (difficulty is null or difficulty in ('easy','normal','hard')),
  author_name       text,          -- 작성 시점 스냅샷
  author_avatar_url text,          -- 작성 시점 스냅샷
  created_at        timestamptz not null default now(),
  unique (user_id, activity_id)    -- 활동당 후기 1개(재작성 = delete 후 insert)
);
create index reviews_activity_idx on public.reviews (activity_id, created_at desc);
create index reviews_user_idx     on public.reviews (user_id);

create or replace function public.enrich_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select coalesce(p.nickname, p.display_name), p.avatar_url
    into new.author_name, new.author_avatar_url
    from public.profiles p where p.id = new.user_id;
  return new;
end;
$$;
create trigger trg_enrich_review before insert on public.reviews
  for each row execute function public.enrich_review();

alter table public.reviews enable row level security;
alter table public.reviews force row level security;
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews self insert" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews self delete" on public.reviews for delete using (auth.uid() = user_id);
-- 수정은 MVP 미지원(스냅샷 위조 방지 겸) — update 정책·그랜트 없음
revoke insert, update on public.reviews from anon, authenticated;
grant insert (user_id, activity_id, body, rating, difficulty) on public.reviews to authenticated;

-- 활동별 평균 별점/후기 수 (reviews가 공개 읽기라 invoker 권한으로 충분)
create view public.activity_review_stats with (security_invoker = true) as
  select activity_id,
         count(*)::int                  as review_count,
         round(avg(rating)::numeric, 1) as avg_rating
  from public.reviews
  group by activity_id;
grant select on public.activity_review_stats to anon, authenticated;

-- ═══════════════════════════════ 6. community_posts 확장 ═══════════════════════════════
alter table public.community_posts
  add column if not exists tags text[] not null default '{}'
    check (coalesce(array_length(tags, 1), 0) <= 5),
  add column if not exists rating smallint
    check (rating is null or rating between 1 and 5),                -- 활동 만족도(선택)
  add column if not exists bg_color text
    check (bg_color is null or bg_color ~ '^[A-Za-z0-9#_-]{1,24}$'), -- 글 배경(토큰 키 권장, 표시 계층에서 매핑)
  add column if not exists main_type_code text
    check (main_type_code is null or main_type_code in ('T01','T02','T03','T04','T05','T06'));
create index community_posts_type_code_idx on public.community_posts (main_type_code, created_at desc)
  where deleted_at is null;

-- 작성 스냅샷 트리거 교체: taste_profiles(폐기) → preference_scores.main_type(T0x)로.
-- 구 enum(main_type) 컬럼은 legacy 보존, 신규 글은 main_type_code 사용. image_url 검증은 기존 유지.
create or replace function public.enrich_community_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.image_url is not null and new.image_url !~ (
    '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/post-images/'
    || new.user_id::text || '/[A-Za-z0-9._-]+$'
  ) then
    raise exception 'invalid image_url';
  end if;
  select coalesce(p.nickname, p.display_name), p.avatar_url
    into new.author_name, new.author_avatar_url
    from public.profiles p where p.id = new.user_id;
  select s.main_type into new.main_type_code
    from public.preference_scores s where s.user_id = new.user_id;
  return new;
end;
$$;

-- 신규 컬럼 insert 허용(컬럼 그랜트는 누적 — 기존 user_id/body/category/image_url 그랜트에 추가)
grant insert (tags, rating, bg_color) on public.community_posts to authenticated;

-- ═══════════════════════════════ 7. friends (친구) ═══════════════════════════════
-- user_id = 요청자, friend_id = 수신자. 수락 시 status='accepted' (수신자만 갱신 가능).
create table public.friends (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  friend_id  uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
-- 역방향 중복 요청 차단(A→B 있으면 B→A 금지)
create unique index friends_pair_uidx on public.friends
  (least(user_id, friend_id), greatest(user_id, friend_id));
create index friends_friend_idx on public.friends (friend_id) where status = 'pending';

alter table public.friends enable row level security;
alter table public.friends force row level security;
create policy "friends party select" on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friends request insert" on public.friends for insert
  with check (auth.uid() = user_id);
-- 수락: 수신자만, pending → accepted 전이만 허용
create policy "friends accept update" on public.friends for update
  using (auth.uid() = friend_id and status = 'pending')
  with check (auth.uid() = friend_id and status = 'accepted');
-- 삭제(거절/취소/친구 끊기): 양쪽 모두 가능
create policy "friends party delete" on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- status는 default 'pending'만(요청이 곧바로 accepted로 위조되는 것 방지), update는 status만
revoke insert, update on public.friends from anon, authenticated;
grant insert (user_id, friend_id) on public.friends to authenticated;
grant update (status) on public.friends to authenticated;

-- 수락된 친구 양방향 조회 + 최소 프로필 노출.
-- security_invoker 미지정 = owner(postgres, bypassrls) 권한 실행 → profiles self-select RLS를 의도적으로 우회.
-- 보안 경계는 뷰 내부의 auth.uid() 필터(security_barrier로 누수 함수 공격 차단).
create view public.my_friends with (security_barrier = true) as
  select case when f.user_id = auth.uid() then f.friend_id else f.user_id end as friend_id,
         coalesce(p.nickname, p.display_name) as friend_name,
         p.avatar_url                         as friend_avatar_url,
         f.created_at
  from public.friends f
  join public.profiles p
    on p.id = case when f.user_id = auth.uid() then f.friend_id else f.user_id end
  where f.status = 'accepted' and auth.uid() in (f.user_id, f.friend_id);
grant select on public.my_friends to authenticated;

-- 받은 친구 요청(요청자 이름/아바타 포함 — 수락 UI용)
create view public.friend_requests with (security_barrier = true) as
  select f.user_id as requester_id,
         coalesce(p.nickname, p.display_name) as requester_name,
         p.avatar_url                         as requester_avatar_url,
         f.created_at
  from public.friends f
  join public.profiles p on p.id = f.user_id
  where f.status = 'pending' and f.friend_id = auth.uid();
grant select on public.friend_requests to authenticated;

-- ═══════════════════════════════ 8. chat (1:1 / 그룹) ═══════════════════════════════
create table public.chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  is_group   boolean not null default false,
  name       text check (name is null or char_length(btrim(name)) between 1 and 100), -- 그룹방 이름(1:1은 null)
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.chat_members (
  room_id   uuid not null references public.chat_rooms(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index chat_members_user_idx on public.chat_members (user_id);
create table public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  image_url  text,
  created_at timestamptz not null default now()
);
create index chat_messages_room_idx on public.chat_messages (room_id, created_at desc);

-- 멤버십 판정 헬퍼: chat_members의 self-referential RLS 재귀를 끊는 SECURITY DEFINER
create or replace function public.is_room_member(p_room uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_members m
    where m.room_id = p_room and m.user_id = auth.uid()
  );
$$;
revoke execute on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

-- 메시지 image_url 검증(게시글과 동일 패턴 — chat-images/<보낸이 uid>/ 경로만)
create or replace function public.validate_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.image_url is not null and new.image_url !~ (
    '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/chat-images/'
    || new.sender_id::text || '/[A-Za-z0-9._-]+$'
  ) then
    raise exception 'invalid image_url';
  end if;
  return new;
end;
$$;
create trigger trg_validate_chat_message before insert on public.chat_messages
  for each row execute function public.validate_chat_message();

alter table public.chat_rooms    enable row level security;
alter table public.chat_members  enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_rooms    force row level security;
alter table public.chat_members  force row level security;
alter table public.chat_messages force row level security;

-- 방: 멤버만 조회(+ 방금 만든 방은 멤버 등록 전에도 생성자가 조회 가능해야 insert…returning이 안 깨짐)
create policy "rooms member select" on public.chat_rooms for select
  using (public.is_room_member(id) or created_by = auth.uid());
create policy "rooms self create" on public.chat_rooms for insert
  with check (created_by = auth.uid());

-- 멤버: 멤버만 목록 조회. 등록은 방 생성자만, 대상은 본인 또는 수락된 친구.
create policy "members member select" on public.chat_members for select
  using (public.is_room_member(room_id));
create policy "members creator insert" on public.chat_members for insert
  with check (
    exists (select 1 from public.chat_rooms r where r.id = room_id and r.created_by = auth.uid())
    and (
      user_id = auth.uid()
      -- ※ 서브쿼리 안에서는 반드시 chat_members.user_id로 한정(무한정 user_id는 f.user_id로 캡처됨)
      or exists (
        select 1 from public.friends f
        where f.status = 'accepted'
          and least(f.user_id, f.friend_id)    = least(auth.uid(), chat_members.user_id)
          and greatest(f.user_id, f.friend_id) = greatest(auth.uid(), chat_members.user_id)
      )
    )
  );
create policy "members self leave" on public.chat_members for delete
  using (auth.uid() = user_id);

-- 메시지: 멤버만 읽기, 본인 명의 + 멤버인 방에만 쓰기
create policy "messages member select" on public.chat_messages for select
  using (public.is_room_member(room_id));
create policy "messages member insert" on public.chat_messages for insert
  with check (auth.uid() = sender_id and public.is_room_member(room_id));
create policy "messages sender delete" on public.chat_messages for delete
  using (auth.uid() = sender_id);

revoke insert on public.chat_rooms from anon, authenticated;
grant insert (is_group, name, created_by) on public.chat_rooms to authenticated;
revoke insert on public.chat_members from anon, authenticated;
grant insert (room_id, user_id) on public.chat_members to authenticated;
revoke insert on public.chat_messages from anon, authenticated;
grant insert (room_id, sender_id, body, image_url) on public.chat_messages to authenticated;

-- 방 멤버의 표시 이름/아바타(채팅 UI용) — my_friends와 동일한 owner 뷰 패턴
create view public.chat_room_profiles with (security_barrier = true) as
  select m.room_id,
         m.user_id,
         coalesce(p.nickname, p.display_name) as member_name,
         p.avatar_url                         as member_avatar_url
  from public.chat_members m
  join public.profiles p on p.id = m.user_id
  where public.is_room_member(m.room_id);
grant select on public.chat_room_profiles to authenticated;

-- Realtime: 새 메시지 실시간 구독(supabase_realtime publication은 Supabase가 기본 제공).
-- 로컬 검증 환경에는 publication이 없을 수 있어 DO 블록으로 감싼다.
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when undefined_object then raise notice 'supabase_realtime publication 없음(로컬) — 건너뜀';
  when duplicate_object then null;
end $$;

-- 채팅 사진 Storage 버킷(공개 URL — 파일명은 uuid라 추측 불가. 서명 URL 전환은 Phase 2)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-images', 'chat-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "chat images public read" on storage.objects for select
  using (bucket_id = 'chat-images');
create policy "chat images self upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'chat-images' and (storage.foldername(o.name))[1] = auth.uid()::text
    ) < 200
  );
create policy "chat images self delete" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- 계정 삭제 시 채팅 사진도 정리(잊혀질 권리 — comments_storage.sql 함수 교체)
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from storage.objects
    where bucket_id in ('post-images', 'chat-images')
      and (storage.foldername(name))[1] = auth.uid()::text;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ═══════════════════════════════ 9. records (기록 탭 캘린더) ═══════════════════════════════
create table public.records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  activity_id  text references public.activities(id) on delete set null,  -- 연결 활동(선택)
  title        text not null check (char_length(btrim(title)) between 1 and 100),
  body         text not null check (char_length(btrim(body)) between 1 and 2000),
  record_date  date not null default current_date,
  satisfaction smallint check (satisfaction is null or satisfaction between 1 and 5),
  tags         text[] not null default '{}' check (coalesce(array_length(tags, 1), 0) <= 5),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index records_user_date_idx on public.records (user_id, record_date desc);
create trigger trg_records_updated before update on public.records
  for each row execute function public.set_updated_at();

alter table public.records enable row level security;
alter table public.records force row level security;
create policy "records self all" on public.records for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke insert, update on public.records from anon, authenticated;
grant insert (user_id, activity_id, title, body, record_date, satisfaction, tags) on public.records to authenticated;
grant update (activity_id, title, body, record_date, satisfaction, tags) on public.records to authenticated;

-- ═══════════════════════════════ 10. notices (공지) ═══════════════════════════════
create table public.notices (
  id           bigint generated always as identity primary key,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  body         text not null check (char_length(btrim(body)) between 1 and 5000),
  badge        text check (badge is null or badge in ('공지','이벤트','안내','점검')),
  published_at timestamptz not null default now()
);
create index notices_published_idx on public.notices (published_at desc);

alter table public.notices enable row level security;
alter table public.notices force row level security;
-- 게재 시각 지난 공지만 공개 읽기(예약 게재). 쓰기 정책 없음 → service_role만.
create policy "notices public read" on public.notices for select using (published_at <= now());

insert into public.notices (title, body, badge, published_at) values
  ('필로그 서비스 오픈 안내', '필로그가 문을 열었습니다. 성향 진단을 받고 나에게 맞는 취미를 찾아보세요.', '공지', now() - interval '3 days'),
  ('7월 원데이 클래스 이벤트', '이번 달 신규 가입 회원께 원데이 클래스 체험 혜택을 드립니다. 자세한 내용은 이벤트 페이지를 확인해 주세요.', '이벤트', now() - interval '1 day'),
  ('개인정보 처리방침 안내', '필로그는 최소한의 정보만 수집하며, 설정에서 언제든 계정을 삭제할 수 있습니다.', '안내', now());
