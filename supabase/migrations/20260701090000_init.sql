-- Feellog Phase 1 초기 스키마 (DB 검토 반영본, 소셜 로그인 전용)
-- 5축: rhythm(활동리듬) relation(관계) experience(경험) participation(참여) reward(기대보상), 각 -100..100
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행(최초 1회). 또는 supabase CLI로 push.
--
-- 검토 반영 요약:
--  · 소셜 전용: handle_new_user가 new.email 미사용, provider별 이름 폴백, 예외 격리(가입 단일장애점 방지)
--  · 개인정보: user_consents 동의 저장소 + 계정삭제 RPC + PII 최소수집(email/생년 미저장) + RLS FORCE
--  · 무결성: 5축 -100..100 / 보조성향 0..100 / price·duration CHECK, updated_at 자동 트리거
--  · 보류(Phase 2+): taste 서버권위화(Edge submit_test)·소프트삭제 파기배치·tag_weights·recommendations 테이블
--    → 지금은 죽은 코드가 되므로 제외. reactions 로그가 남아 소급 재계산 가능.

create extension if not exists pgcrypto;

-- ─────────────────────────────── enums ───────────────────────────────
-- 6 메인 유형 (개발계획서 4장 정본 네이밍)
create type main_type as enum (
  'active_explorer',    -- 활력 탐험형
  'calm_immersion',     -- 고요 몰입형
  'handcraft_achiever', -- 손끝 성취형
  'warm_social',        -- 따뜻한 교류형
  'life_upgrade',       -- 생활 업그레이드형
  'culture_enjoyer'     -- 문화 향유형
);
-- 보조성향(트렌드 발견/회복 충전) — 코어 코드/계획서와 이 라벨을 단일 정본으로 통일할 것
create type sub_trait as enum ('trend_seeker', 'recovery_charger');
-- 카드 반응: 'select'(선택/상세보기)는 analytics_events로 분리 → 여기선 like/dislike만
create type reaction_kind as enum ('like', 'dislike');
-- 동의 종류 (age_over_14는 5060 전용 서비스라 제외)
create type consent_kind as enum (
  'terms_of_service', 'privacy_policy', 'marketing', 'third_party_provision', 'overseas_transfer'
);

-- ─────────────────────────────── profiles ───────────────────────────────
-- 이메일/생년은 저장하지 않는다(최소수집). 원천은 auth.users, CS는 service_role로 참조.
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,              -- 소셜 닉네임 or 온보딩 입력. 못 찾으면 NULL → 앱은 '회원님' 폴백
  avatar_url     text,              -- 소셜 프로필 이미지(구글 picture/카카오 profile_image). 만료가능 → Phase2 스토리지 이관
  auth_provider  text,              -- 가입 시점 첫 provider(kakao/apple/google). stale 가능 → 계정병합 판단엔 auth.identities 사용
  region_sido    text,              -- 사용자 지역(온보딩 수집). 활동 지역 필터용
  region_sigungu text,
  font_scale     real not null default 1.0,   -- 접근성: 글자 크기 배율
  onboarded      boolean not null default false, -- 성향테스트 완료(홈 분기)
  consented_at   timestamptz,       -- 필수 동의 완료 시각(홈 진입 게이트)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────── taste_profiles ───────────────────────────────
-- base_* = 테스트로 정한 기준 벡터(고정), cur_* = 카드 피드백으로 보정되는 현재 벡터
-- (MVP: 소유자가 직접 upsert. 서버권위화(Edge submit_test)는 추천 Edge Function 구축 시로 보류 — 자기 벡터 위조는 본인에게만 영향)
create table public.taste_profiles (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  base_rhythm        smallint not null default 0 check (base_rhythm between -100 and 100),
  base_relation      smallint not null default 0 check (base_relation between -100 and 100),
  base_experience    smallint not null default 0 check (base_experience between -100 and 100),
  base_participation smallint not null default 0 check (base_participation between -100 and 100),
  base_reward        smallint not null default 0 check (base_reward between -100 and 100),
  cur_rhythm         smallint not null default 0 check (cur_rhythm between -100 and 100),
  cur_relation       smallint not null default 0 check (cur_relation between -100 and 100),
  cur_experience     smallint not null default 0 check (cur_experience between -100 and 100),
  cur_participation  smallint not null default 0 check (cur_participation between -100 and 100),
  cur_reward         smallint not null default 0 check (cur_reward between -100 and 100),
  main_type          main_type,
  sub_trait          sub_trait,      -- null 가능(0~1개 표시)
  -- ※ 보조성향 강도는 0~100 (5축의 -100~100과 범위가 다름 — 배지 임계 >=60 로직 주의)
  trend_score        smallint not null default 0 check (trend_score between 0 and 100),
  recovery_score     smallint not null default 0 check (recovery_score between 0 and 100),
  feedback_count     integer  not null default 0,
  updated_at         timestamptz not null default now()
);

-- ─────────────────────────────── test_responses ───────────────────────────────
-- 성향테스트 원응답 스냅샷 + 계산 결과(분석/재튜닝용). taste_profiles가 현재값 SSOT.
create table public.test_responses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  answers    jsonb not null,   -- [{ "q": 1, "value": -2 }, ...]
  computed   jsonb not null,   -- { "rhythm": .., "main_type": "..", ... }
  created_at timestamptz not null default now()
);

-- ─────────────────────────────── activities ───────────────────────────────
-- 활동(클래스) 카탈로그 + 5축 태그(-100..100). 지역은 시도/시군구 2단 정규화.
create table public.activities (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  summary            text,                         -- 1줄 설명
  keywords           text[] not null default '{}', -- 칩(만들기, 차분한 몰입 ...) — 입력 시 trim/정제
  category           text,
  region_sido        text check (region_sido is null or region_sido in
                       ('서울','부산','대구','인천','광주','대전','울산','세종',
                        '경기','강원','충북','충남','전북','전남','경북','경남','제주')),
  region_sigungu     text,
  price              integer check (price is null or price >= 0),       -- 원
  duration_min       integer check (duration_min is null or duration_min > 0),
  intensity          smallint check (intensity between 1 and 5),        -- 신체강도 1~5
  image_url          text,
  booking_url        text,                          -- 예약 외부 링크(MVP)
  partner_name       text,
  axis_rhythm        smallint not null default 0 check (axis_rhythm between -100 and 100),
  axis_relation      smallint not null default 0 check (axis_relation between -100 and 100),
  axis_experience    smallint not null default 0 check (axis_experience between -100 and 100),
  axis_participation smallint not null default 0 check (axis_participation between -100 and 100),
  axis_reward        smallint not null default 0 check (axis_reward between -100 and 100),
  is_active          boolean not null default true,
  deleted_at         timestamptz,                   -- 물리삭제 금지(반응 이력 보존) → 마킹만
  created_at         timestamptz not null default now()
);

-- ─────────────────────────────── reactions ───────────────────────────────
-- 카드 좋아요/관심없어요 (추천 피드백 입력). 활동당 최종 1개(변경 시 upsert).
create table public.reactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  kind        reaction_kind not null,
  created_at  timestamptz not null default now(),
  unique (user_id, activity_id)
);

-- ─────────────────────────────── analytics_events ───────────────────────────────
-- 자체 퍼널 분석(외부 SDK 없이). 익명('둘러보기') 삽입 허용하되 행 크기 제한으로 남용 완화.
create table public.analytics_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,  -- 계정삭제 시 익명화 보존
  name       text  not null check (char_length(name) <= 64),
  props      jsonb not null default '{}' check (pg_column_size(props) <= 4096),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────── user_consents ───────────────────────────────
-- 동의 이력(개인정보보호법 입증). 철회는 granted=false 신규 행 append(UPDATE/DELETE 정책 없음=이력 무결성).
create table public.user_consents (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        consent_kind not null,
  granted     boolean not null,
  doc_version text not null,                         -- 예: 'privacy-2026-07-01'
  method      text not null default 'signup_gate',   -- signup_gate | settings
  acted_at    timestamptz not null default now()
  -- ip/user_agent는 파기배치 없는 신규 PII 수집이라 MVP 제외(최소수집)
);

-- ─────────────────────────────── indexes ───────────────────────────────
create index activities_active_idx      on public.activities (is_active) where is_active;
create index activities_region_idx      on public.activities (region_sido, region_sigungu);
create index reactions_user_idx         on public.reactions (user_id);
create index reactions_activity_idx     on public.reactions (activity_id);
create index test_responses_user_idx    on public.test_responses (user_id, created_at desc);
create index analytics_events_name_idx  on public.analytics_events (name, created_at);
create index user_consents_user_idx     on public.user_consents (user_id, kind, acted_at desc);

-- ─────────────────────────────── 신규 소셜 가입 시 profiles 자동 생성 ───────────────────────────────
-- new.email 미사용(카카오 이메일 미동의/Apple relay/합성 이메일이 이름으로 새는 것 차단).
-- provider별 이름 키 폴백 → 못 찾으면 NULL(온보딩 닉네임 입력으로 보완). 예외는 삼켜 가입 실패 방지.
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
  insert into public.profiles (id, display_name, avatar_url, auth_provider)
  values (
    new.id,
    nm,
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────── updated_at 자동 갱신 ───────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_profiles_updated       before update on public.profiles       for each row execute function public.set_updated_at();
create trigger trg_taste_profiles_updated before update on public.taste_profiles for each row execute function public.set_updated_at();

-- ─────────────────────────────── keepalive ping ───────────────────────────────
-- 무료 티어 7일 자동 일시정지 방지용. 외부 크론(Cloudflare Worker)이 주기적으로 호출.
create or replace function public.ping()
returns timestamptz language sql security definer set search_path = public as $$
  select now();
$$;
grant execute on function public.ping() to anon, authenticated;

-- ─────────────────────────────── 계정 자기삭제(잊혀질 권리) ───────────────────────────────
-- auth.users는 RLS 밖 → RPC로만 자기삭제 가능. cascade로 profiles/taste/test/reactions/consents 삭제, analytics는 set null.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
revoke execute on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

-- ─────────────────────────────── RLS ───────────────────────────────
alter table public.profiles         enable row level security;
alter table public.taste_profiles   enable row level security;
alter table public.test_responses   enable row level security;
alter table public.activities       enable row level security;
alter table public.reactions        enable row level security;
alter table public.analytics_events enable row level security;
alter table public.user_consents    enable row level security;

-- profiles: 본인 것만 (DELETE는 delete_my_account RPC로만)
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- taste_profiles: 본인 것만 (MVP는 소유자 쓰기 허용, 서버권위화는 Phase 2)
create policy "taste self all" on public.taste_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- test_responses: 본인 것만
create policy "test self insert" on public.test_responses for insert with check (auth.uid() = user_id);
create policy "test self select" on public.test_responses for select using (auth.uid() = user_id);

-- activities: 활성 카탈로그만 공개 읽기. 쓰기 정책 없음 → service_role(관리자)만.
create policy "activities public read" on public.activities for select using (is_active = true and deleted_at is null);

-- reactions: 본인 것만 (insert/select/delete, update 없음 → 변경은 delete 후 재insert 또는 upsert)
create policy "reactions self insert" on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions self select" on public.reactions for select using (auth.uid() = user_id);
create policy "reactions self delete" on public.reactions for delete using (auth.uid() = user_id);

-- analytics_events: 삽입만(로그인=본인, 익명=user_id null). 조회는 service_role만.
create policy "analytics insert" on public.analytics_events for insert with check (user_id is null or auth.uid() = user_id);

-- user_consents: 본인 select/insert만 (UPDATE/DELETE 정책 없음 = 이력 무결성)
create policy "consents self select" on public.user_consents for select using (auth.uid() = user_id);
create policy "consents self insert" on public.user_consents for insert with check (auth.uid() = user_id);

-- RLS FORCE (심층방어). profiles는 handle_new_user(SECURITY DEFINER) 트리거 insert가 막힐 수 있어 제외.
alter table public.taste_profiles   force row level security;
alter table public.test_responses   force row level security;
alter table public.reactions        force row level security;
alter table public.analytics_events force row level security;
alter table public.user_consents    force row level security;
