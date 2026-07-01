-- Feellog Phase 1 초기 스키마
-- 5축: rhythm(활동리듬) relation(관계) experience(경험) participation(참여) reward(기대보상), 각 -100..100
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행(최초 1회). 또는 supabase CLI로 push.

create extension if not exists pgcrypto;

-- ─────────────────────────────── enum ───────────────────────────────
-- 6 메인 유형 (개발계획서 4장 정본 네이밍)
create type main_type as enum (
  'active_explorer',    -- 활력 탐험형
  'calm_immersion',     -- 고요 몰입형
  'handcraft_achiever', -- 손끝 성취형
  'warm_social',        -- 따뜻한 교류형
  'life_upgrade',       -- 생활 업그레이드형
  'culture_enjoyer'     -- 문화 향유형
);
create type sub_trait as enum ('trend_seeker', 'recovery_charger'); -- 보조성향(트렌드 발견/회복 충전)
create type reaction_kind as enum ('like', 'dislike', 'select');

-- ─────────────────────────────── profiles ───────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_year   smallint,                        -- 시니어 연령대 맥락
  font_scale   real not null default 1.0,        -- 접근성: 글자 크기 배율
  onboarded    boolean not null default false,   -- 성향테스트 완료 여부(홈 화면 분기)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────── taste_profiles ───────────────────────────────
-- base_* = 테스트로 정한 기준 벡터(고정), cur_* = 카드 피드백으로 보정되는 현재 벡터
create table public.taste_profiles (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  base_rhythm        smallint not null default 0,
  base_relation      smallint not null default 0,
  base_experience    smallint not null default 0,
  base_participation smallint not null default 0,
  base_reward        smallint not null default 0,
  cur_rhythm         smallint not null default 0,
  cur_relation       smallint not null default 0,
  cur_experience     smallint not null default 0,
  cur_participation  smallint not null default 0,
  cur_reward         smallint not null default 0,
  main_type          main_type,
  sub_trait          sub_trait,                  -- null 가능(0~1개 표시)
  trend_score        smallint not null default 0,
  recovery_score     smallint not null default 0,
  feedback_count     integer  not null default 0,
  updated_at         timestamptz not null default now()
);

-- ─────────────────────────────── test_responses ───────────────────────────────
-- 성향테스트 원응답 스냅샷 + 계산 결과(분석/재튜닝용)
create table public.test_responses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  answers    jsonb not null,   -- [{ "q": 1, "value": -2 }, ...]
  computed   jsonb not null,   -- { "rhythm": .., "main_type": "..", ... }
  created_at timestamptz not null default now()
);

-- ─────────────────────────────── activities ───────────────────────────────
-- 활동(클래스) 카탈로그 + 5축 태그(-100..100)
create table public.activities (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  summary            text,                         -- 1줄 설명
  keywords           text[] not null default '{}', -- 칩(만들기, 차분한 몰입 ...)
  category           text,
  region             text,                         -- 지역(하드필터)
  price              integer,                       -- 원
  duration_min       integer,                       -- 소요(분)
  intensity          smallint check (intensity between 1 and 5), -- 신체강도 1~5
  image_url          text,
  booking_url        text,                         -- 예약 외부 링크(MVP)
  partner_name       text,
  axis_rhythm        smallint not null default 0,
  axis_relation      smallint not null default 0,
  axis_experience    smallint not null default 0,
  axis_participation smallint not null default 0,
  axis_reward        smallint not null default 0,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);
create index activities_active_idx on public.activities (is_active) where is_active;
create index activities_region_idx on public.activities (region);

-- ─────────────────────────────── reactions ───────────────────────────────
-- 카드 좋아요/관심없어요/선택 (추천 피드백 입력)
create table public.reactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  kind        reaction_kind not null,
  created_at  timestamptz not null default now(),
  unique (user_id, activity_id)
);
create index reactions_user_idx on public.reactions (user_id);

-- ─────────────────────────────── analytics_events ───────────────────────────────
-- 자체 퍼널 분석(외부 SDK 없이). signup→test_complete→first_reco→card_reaction→...
create table public.analytics_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  name       text not null,
  props      jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index analytics_events_name_idx on public.analytics_events (name, created_at);

-- ─────────────────────────────── 신규 가입 시 profiles 자동 생성 ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────── keepalive ping ───────────────────────────────
-- 무료 티어 7일 자동 일시정지 방지용. 외부 크론(Cloudflare Worker)이 주기적으로 호출한다.
create or replace function public.ping()
returns timestamptz language sql security definer set search_path = public as $$
  select now();
$$;
grant execute on function public.ping() to anon, authenticated;

-- ─────────────────────────────── RLS ───────────────────────────────
alter table public.profiles         enable row level security;
alter table public.taste_profiles   enable row level security;
alter table public.test_responses   enable row level security;
alter table public.activities       enable row level security;
alter table public.reactions        enable row level security;
alter table public.analytics_events enable row level security;

-- profiles: 본인 것만
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- taste_profiles: 본인 것만
create policy "taste self all" on public.taste_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- test_responses: 본인 것만
create policy "test self insert" on public.test_responses for insert with check (auth.uid() = user_id);
create policy "test self select" on public.test_responses for select using (auth.uid() = user_id);

-- activities: 누구나 읽기(카탈로그). 쓰기 정책 없음 → service_role(관리자)만 등록/수정.
create policy "activities public read" on public.activities for select using (true);

-- reactions: 본인 것만
create policy "reactions self all" on public.reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- analytics_events: 삽입만 허용(로그인 유저는 본인, 익명은 user_id null). 조회는 service_role만.
create policy "analytics insert" on public.analytics_events for insert with check (user_id is null or auth.uid() = user_id);
