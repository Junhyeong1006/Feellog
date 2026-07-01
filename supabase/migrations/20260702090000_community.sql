-- Feellog 커뮤니티 스키마 (글 + 좋아요). 댓글/이미지 업로드는 후속 단계.
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행(최초 1회).
--
-- 설계 메모:
--  · profiles가 self-select RLS라 다른 사용자 이름/아바타를 조인으로 못 읽음
--    → 작성 시점에 author_name/avatar/main_type를 트리거로 스냅샷 저장(비정규화).
--  · like_count는 post_likes 트리거로 동기화(비정규화 카운터). 남의 글 카운터 갱신을 위해
--    트리거 함수는 SECURITY DEFINER(소유자=postgres, BYPASSRLS)로 RLS를 우회한다.

-- ─────────────────────────────── community_posts ───────────────────────────────
create table public.community_posts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  body              text not null check (char_length(body) between 1 and 2000),
  category          text,
  image_url         text,
  author_name       text,          -- 작성 시점 스냅샷(표시명)
  author_avatar_url text,          -- 작성 시점 스냅샷(프로필 이미지)
  main_type         main_type,     -- 작성 시점 스냅샷('우리 유형' 필터용)
  like_count        integer not null default 0 check (like_count >= 0),
  comment_count     integer not null default 0 check (comment_count >= 0),
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index community_posts_feed_idx on public.community_posts (created_at desc) where deleted_at is null;
create index community_posts_type_idx on public.community_posts (main_type, created_at desc) where deleted_at is null;
create index community_posts_user_idx on public.community_posts (user_id);

-- ─────────────────────────────── post_likes ───────────────────────────────
create table public.post_likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index post_likes_post_idx on public.post_likes (post_id);

-- ─────────────────────────────── 작성 시 author 스냅샷 ───────────────────────────────
create or replace function public.enrich_community_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select p.display_name, p.avatar_url
    into new.author_name, new.author_avatar_url
    from public.profiles p where p.id = new.user_id;
  select t.main_type
    into new.main_type
    from public.taste_profiles t where t.user_id = new.user_id;
  return new;
end;
$$;
create trigger trg_enrich_community_post
  before insert on public.community_posts
  for each row execute function public.enrich_community_post();

-- ─────────────────────────────── 좋아요 수 동기화 ───────────────────────────────
create or replace function public.sync_post_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;
create trigger trg_post_like_ins after insert on public.post_likes
  for each row execute function public.sync_post_like_count();
create trigger trg_post_like_del after delete on public.post_likes
  for each row execute function public.sync_post_like_count();

-- ─────────────────────────────── RLS ───────────────────────────────
alter table public.community_posts enable row level security;
alter table public.post_likes      enable row level security;

-- 글: 삭제 안 된 글은 공개 읽기(게스트 anon 포함) + 본인은 자기 글(삭제분 포함)도 읽기 허용.
-- (본인 읽기 허용이 없으면 soft-delete UPDATE ... RETURNING이 SELECT 정책에 걸린다. 피드는 앱에서 deleted_at 필터)
create policy "posts public read"  on public.community_posts for select using (deleted_at is null or auth.uid() = user_id);
create policy "posts self insert"  on public.community_posts for insert with check (auth.uid() = user_id);
create policy "posts self update"  on public.community_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts self delete"  on public.community_posts for delete using (auth.uid() = user_id);

-- 좋아요: 본인 것만 insert/select/delete (변경=insert/delete)
create policy "likes self insert"  on public.post_likes for insert with check (auth.uid() = user_id);
create policy "likes self select"  on public.post_likes for select using (auth.uid() = user_id);
create policy "likes self delete"  on public.post_likes for delete using (auth.uid() = user_id);

-- 글 UPDATE는 soft-delete(deleted_at)만 허용(컬럼 권한). 작성자도 author_name/main_type/like_count 등
-- 스냅샷·카운터 컬럼을 위조하지 못하게 한다. like_count는 트리거(SECURITY DEFINER=postgres)만 갱신.
revoke update on public.community_posts from anon, authenticated;
grant  update (deleted_at) on public.community_posts to authenticated;

-- FORCE RLS(심층방어). 트리거 함수는 SECURITY DEFINER라 카운터/스냅샷 갱신에 영향 없음.
alter table public.community_posts force row level security;
alter table public.post_likes      force row level security;
