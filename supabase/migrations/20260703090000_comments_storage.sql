-- Feellog 커뮤니티 2단계: 댓글(post_comments) + 게시글 사진 Storage 버킷.
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행(최초 1회).
-- ※ 20260702090000_community.sql(글/좋아요) 이후에 실행해야 한다.
--
-- 설계 메모:
--  · 작성자 이름/아바타는 글과 동일하게 작성 시점 스냅샷(비정규화) — profiles self-select RLS 때문.
--  · comment_count는 post_likes 패턴과 동일한 SECURITY DEFINER 트리거로 동기화.
--  · 댓글은 수정 없음(MVP), 삭제는 하드 삭제(글과 달리 피드 참조가 없어 소프트 삭제 불필요).

-- ─────────────────────────────── post_comments ───────────────────────────────
create table public.post_comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.community_posts(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  -- btrim: 공백만으로 이뤄진 댓글을 DB 차원에서 차단(클라이언트 trim 우회 대비)
  body              text not null check (char_length(btrim(body)) between 1 and 500),
  author_name       text,          -- 작성 시점 스냅샷(표시명)
  author_avatar_url text,          -- 작성 시점 스냅샷(프로필 이미지)
  created_at        timestamptz not null default now()
);

create index post_comments_post_idx on public.post_comments (post_id, created_at);
create index post_comments_user_idx on public.post_comments (user_id);

-- ─────────────────── 작성 시 author 스냅샷 + 삭제된 글 차단 ───────────────────
create or replace function public.enrich_post_comment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- 소프트 삭제된 글에는 댓글 금지(피드에서 사라진 글에 유령 댓글 방지).
  -- for share: 동시 소프트 삭제와의 경합(TOCTOU) 방지 — 커밋된 최신 행 기준으로 재평가.
  perform 1 from public.community_posts p
    where p.id = new.post_id and p.deleted_at is null
    for share of p;
  if not found then
    raise exception 'post not found or deleted';
  end if;
  select p.display_name, p.avatar_url
    into new.author_name, new.author_avatar_url
    from public.profiles p where p.id = new.user_id;
  return new;
end;
$$;
create trigger trg_enrich_post_comment
  before insert on public.post_comments
  for each row execute function public.enrich_post_comment();

-- ─────────────────────────────── 댓글 수 동기화 ───────────────────────────────
create or replace function public.sync_post_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;
create trigger trg_post_comment_ins after insert on public.post_comments
  for each row execute function public.sync_post_comment_count();
create trigger trg_post_comment_del after delete on public.post_comments
  for each row execute function public.sync_post_comment_count();

-- ─────────────────────────────── RLS ───────────────────────────────
alter table public.post_comments enable row level security;

-- 읽기: 부모 글이 보이는 경우에만(삭제 안 됐거나 내 글) — 글 정책과 정합
create policy "comments readable with post" on public.post_comments for select
  using (exists (
    select 1 from public.community_posts p
    where p.id = post_id and (p.deleted_at is null or p.user_id = auth.uid())
  ));
create policy "comments self insert" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "comments self delete" on public.post_comments for delete using (auth.uid() = user_id);

-- 댓글 수정은 MVP 미지원 — 컬럼 권한 차원에서 차단(스냅샷 위조 방지 겸)
revoke update on public.post_comments from anon, authenticated;
-- insert도 컬럼 제한: created_at/id/스냅샷 컬럼 위조 방지(트리거·default만 채움)
revoke insert on public.post_comments from anon, authenticated;
grant insert (post_id, user_id, body) on public.post_comments to authenticated;

alter table public.post_comments force row level security;

-- 글 insert에도 같은 패턴 적용(스냅샷·카운터·created_at 위조 방지 — community.sql 보강)
revoke insert on public.community_posts from anon, authenticated;
grant insert (user_id, body, category, image_url) on public.community_posts to authenticated;

-- ─────────────── 글 image_url 서버 검증(작성 트리거 확장 — community.sql의 함수 교체) ───────────────
-- 임의 외부 URL이 전체 피드에 렌더링되는 것을 차단: 우리 Supabase 스토리지의
-- post-images/<작성자 uid>/ 경로만 허용(형식 검증 — SECURITY DEFINER, BEFORE INSERT).
create or replace function public.enrich_community_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.image_url is not null and new.image_url !~ (
    '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/post-images/'
    || new.user_id::text || '/[A-Za-z0-9._-]+$'
  ) then
    raise exception 'invalid image_url';
  end if;
  select p.display_name, p.avatar_url
    into new.author_name, new.author_avatar_url
    from public.profiles p where p.id = new.user_id;
  select t.main_type
    into new.main_type
    from public.taste_profiles t where t.user_id = new.user_id;
  return new;
end;
$$;

-- ─────────────────────────── 게시글 사진 Storage 버킷 ───────────────────────────
-- 공개 읽기 / 본인 폴더(<uid>/...)에만 업로드·삭제. 5MB, 이미지 MIME만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "post images public read" on storage.objects for select
  using (bucket_id = 'post-images');
-- 본인 폴더에만 업로드 + 1인당 100개 상한(무료 티어 용량 고갈 방지)
create policy "post images self upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'post-images' and (storage.foldername(o.name))[1] = auth.uid()::text
    ) < 100
  );
create policy "post images self delete" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────── 계정 삭제 시 업로드 사진도 정리(잊혀질 권리 — init.sql 함수 교체) ───────────────
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- 공개 버킷에 남으면 계정 삭제 후에도 사진이 접근 가능하므로 먼저 지운다
  delete from storage.objects
    where bucket_id = 'post-images'
      and (storage.foldername(name))[1] = auth.uid()::text;
  delete from auth.users where id = auth.uid();
end;
$$;
