/**
 * pgval — Supabase 마이그레이션 PGlite 검증 하네스.
 * 기존 3개 + 신규 1개(v6_pivot)를 순차 실행하고 스모크(INSERT/SELECT/RLS/컬럼그랜트) 테스트.
 * Supabase 환경 스텁: auth 스키마(users, uid()), storage 스키마(buckets/objects/foldername),
 * anon/authenticated/service_role 롤 + 기본 privileges, supabase_realtime publication.
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MIG_DIR = process.argv[2] ?? 'supabase/migrations';
const pg = await PGlite.create({ extensions: { pgcrypto } });

let pass = 0, fail = 0;
const ok = (name) => { pass++; console.log(`  ok  ${name}`); };
const bad = (name, e) => { fail++; console.error(`  FAIL ${name}: ${e?.message ?? e}`); };

async function expectOk(name, fn) {
  try { const r = await fn(); ok(name); return r; } catch (e) { bad(name, e); }
}
async function expectErr(name, re, fn) {
  try { await fn(); bad(name, 'error 미발생'); }
  catch (e) { re.test(String(e.message)) ? ok(name) : bad(name, `다른 에러: ${e.message}`); }
}

// ─────────────────────────── Supabase 환경 스텁 ───────────────────────────
await pg.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;

  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb,
    raw_app_meta_data jsonb,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as
    'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to public;

  create schema storage;
  create table storage.buckets (
    id text primary key, name text not null, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text, owner uuid, created_at timestamptz default now()
  );
  create function storage.foldername(name text) returns text[] language sql immutable as
    'select (string_to_array(name, ''/''))[1 : array_length(string_to_array(name, ''/''), 1) - 1]';
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  grant select on storage.buckets to anon, authenticated;

  -- Supabase 기본: public 스키마 객체는 anon/authenticated에 전체 그랜트(마이그레이션이 선별 revoke)
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
try { await pg.exec(`create publication supabase_realtime;`); console.log('stub: supabase_realtime publication 생성됨'); }
catch (e) { console.log(`stub: publication 미지원(${e.message}) — 마이그레이션 DO 블록이 처리`); }

// ─────────────────────────── 마이그레이션 순차 실행 ───────────────────────────
const files = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  try {
    await pg.exec(readFileSync(join(MIG_DIR, f), 'utf8'));
    console.log(`migration ok: ${f}`);
  } catch (e) {
    console.error(`migration FAIL: ${f}\n  ${e.message}`);
    process.exit(1);
  }
}

// ─────────────────────────── 헬퍼: 사용자 전환 ───────────────────────────
const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const C = '00000000-0000-4000-8000-00000000000c';
async function as(uid) {
  await pg.exec(`reset role;`);
  await pg.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await pg.exec(`set role ${uid ? 'authenticated' : 'anon'};`);
}
async function admin() { await pg.exec(`reset role;`); await pg.query(`select set_config('request.jwt.claim.sub', '', false)`); }

console.log('\n── 스모크 테스트 ──');

// 가입 트리거 → profiles 자동 생성(nickname 포함)
await expectOk('handle_new_user: 소셜 가입 3명 → profiles 생성', async () => {
  await pg.query(
    `insert into auth.users (id, raw_user_meta_data, raw_app_meta_data) values
     ($1, '{"nickname":"금손여사"}', '{"provider":"kakao"}'),
     ($2, '{"name":"김철수"}', '{"provider":"google"}'),
     ($3, '{}', '{"provider":"apple"}')`, [A, B, C]);
  const r = await pg.query(`select id, nickname from public.profiles order by id`);
  if (r.rows.length !== 3) throw new Error(`profiles ${r.rows.length}명`);
  if (r.rows[0].nickname !== '금손여사') throw new Error('nickname 스냅샷 실패');
});

// activities 시드
await as(A);
await expectOk('activities: 공개 읽기 70종 + A001 7축 값', async () => {
  const r = await pg.query(`select count(*)::int as n from public.activities`);
  if (r.rows[0].n !== 70) throw new Error(`${r.rows[0].n}종`);
  const a = await pg.query(`select * from public.activities where id = 'A001'`);
  const row = a.rows[0];
  if (row.axis_physical !== -5 || row.axis_experience !== 25 || row.physical_burden !== 2)
    throw new Error('A001 축 값 불일치');
});
await expectErr('activities: authenticated 직접 insert 차단', /denied|policy/i, () =>
  pg.query(`insert into public.activities (id, name, title, summary, type_label, category,
    axis_physical, axis_relation, axis_experience, axis_satisfaction, axis_value, axis_novelty, axis_depth, physical_burden)
    values ('A999','x','x','x','x','요리',0,0,0,0,0,0,0,1)`));

// profiles 확장 컬럼
await expectOk('profiles: gender/birth_date/bio 갱신', () =>
  pg.query(`update public.profiles set gender = 'female', birth_date = '1965-03-01', bio = '취미 찾는 중' where id = auth.uid()`));
await expectErr('profiles: gender 잘못된 값 차단', /check/i, () =>
  pg.query(`update public.profiles set gender = 'robot' where id = auth.uid()`));

// preference_scores (§4.5)
await expectOk('preference_scores: 본인 upsert(7축 initial/current)', () =>
  pg.query(`insert into public.preference_scores (user_id,
      initial_physical, initial_relation, initial_experience, initial_satisfaction, initial_value, initial_novelty, initial_depth,
      current_physical, current_relation, current_experience, current_satisfaction, current_value, current_novelty, current_depth,
      main_type)
    values (auth.uid(), -5, 10, 20, 15, 5, 0, 10, -5, 10, 20, 15, 5, 0, 10, 'T03')`));
await expectOk('preference_scores: 피드백 보정(current만, -3.0 소수)', () =>
  pg.query(`update public.preference_scores set current_physical = -3.0, feedback_count = 1 where user_id = auth.uid()`));
await expectErr('preference_scores: 범위 초과(+26) 차단', /check/i, () =>
  pg.query(`update public.preference_scores set current_depth = 26 where user_id = auth.uid()`));
await expectErr('preference_scores: 타인 명의 insert 차단', /policy|denied/i, () =>
  pg.query(`insert into public.preference_scores (user_id) values ($1)`, [B]));
await expectErr('preference_scores: updated_at 위조 차단(컬럼 그랜트)', /denied/i, () =>
  pg.query(`update public.preference_scores set updated_at = now() - interval '1 year' where user_id = auth.uid()`));
await expectOk('preference_update_history: like 이력 append', () =>
  pg.query(`insert into public.preference_update_history (user_id, activity_id, action, axis_deltas)
    values (auth.uid(), 'A001', 'like', '{"learning_rate":0.10,"deltas":{"physical":2.0}}')`));
await expectErr('preference_update_history: 미정의 action 차단', /check/i, () =>
  pg.query(`insert into public.preference_update_history (user_id, activity_id, action) values (auth.uid(), 'A001', 'teleport')`));
await expectErr('preference_update_history: UPDATE 차단(append-only)', /denied|policy/i, () =>
  pg.query(`update public.preference_update_history set action = 'hate' where user_id = auth.uid()`));

// wishlist / cart
await expectOk('wishlist: 찜 추가/조회', async () => {
  await pg.query(`insert into public.wishlist (user_id, activity_id) values (auth.uid(), 'A001'), (auth.uid(), 'A002')`);
  const r = await pg.query(`select count(*)::int as n from public.wishlist`);
  if (r.rows[0].n !== 2) throw new Error(`${r.rows[0].n}개`);
});
await expectErr('wishlist: 중복 찜 차단(PK)', /duplicate|unique/i, () =>
  pg.query(`insert into public.wishlist (user_id, activity_id) values (auth.uid(), 'A001')`));
await expectOk('cart: 담기 + 수량 변경', async () => {
  await pg.query(`insert into public.cart_items (user_id, activity_id) values (auth.uid(), 'A003')`);
  await pg.query(`update public.cart_items set qty = 2 where user_id = auth.uid() and activity_id = 'A003'`);
  const r = await pg.query(`select qty from public.cart_items where activity_id = 'A003'`);
  if (r.rows[0].qty !== 2) throw new Error('qty 반영 안 됨');
});
await expectErr('cart: qty 0 차단', /check/i, () =>
  pg.query(`update public.cart_items set qty = 0 where activity_id = 'A003'`));

// reviews + 통계 뷰
await expectOk('reviews: 작성 → author 스냅샷 + 통계 뷰', async () => {
  await pg.query(`insert into public.reviews (user_id, activity_id, body, rating, difficulty)
    values (auth.uid(), 'A001', '빵이 정말 잘 나왔어요. 선생님도 친절하셨습니다.', 5, 'easy')`);
  const r = await pg.query(`select author_name from public.reviews where activity_id = 'A001'`);
  if (r.rows[0].author_name !== '금손여사') throw new Error('스냅샷 없음');
});
await expectErr('reviews: 공백만 본문 차단(btrim)', /check/i, () =>
  pg.query(`insert into public.reviews (user_id, activity_id, body, rating) values (auth.uid(), 'A002', '   ', 3)`));
await expectErr('reviews: 같은 활동 중복 후기 차단', /duplicate|unique/i, () =>
  pg.query(`insert into public.reviews (user_id, activity_id, body, rating) values (auth.uid(), 'A001', '두 번째', 1)`));
await expectErr('reviews: author_name 위조 차단(컬럼 그랜트)', /denied/i, () =>
  pg.query(`insert into public.reviews (user_id, activity_id, body, rating, author_name) values (auth.uid(), 'A004', 'x', 1, '사칭')`));

// community_posts 확장
await expectOk('community_posts: tags/rating/bg_color + main_type_code 스냅샷', async () => {
  await pg.query(`insert into public.community_posts (user_id, body, category, tags, rating, bg_color)
    values (auth.uid(), '오늘 발효빵 클래스 다녀왔어요', '요리', array['빵','원데이'], 5, 'peach')`);
  const r = await pg.query(`select main_type_code, tags from public.community_posts limit 1`);
  if (r.rows[0].main_type_code !== 'T03') throw new Error(`스냅샷 ${r.rows[0].main_type_code}`);
});
await expectErr('community_posts: 태그 6개 차단', /check/i, () =>
  pg.query(`insert into public.community_posts (user_id, body, tags) values (auth.uid(), 'x', array['1','2','3','4','5','6'])`));

// friends
await expectOk('friends: A→B 요청', () =>
  pg.query(`insert into public.friends (user_id, friend_id) values (auth.uid(), $1)`, [B]));
await expectErr('friends: 자기 자신 요청 차단', /check/i, () =>
  pg.query(`insert into public.friends (user_id, friend_id) values (auth.uid(), auth.uid())`));
await expectErr('friends: status 위조 insert 차단(컬럼 그랜트)', /denied/i, () =>
  pg.query(`insert into public.friends (user_id, friend_id, status) values (auth.uid(), $1, 'accepted')`, [C]));
await as(B);
await expectErr('friends: 역방향 중복 요청 차단(pair unique)', /duplicate|unique/i, () =>
  pg.query(`insert into public.friends (user_id, friend_id) values (auth.uid(), $1)`, [A]));
await expectOk('friends: B가 수락 → my_friends 양방향 + 이름 노출', async () => {
  const u = await pg.query(`update public.friends set status = 'accepted' where friend_id = auth.uid() and user_id = $1`, [A]);
  if (u.affectedRows !== 1) throw new Error('수락 update 0행');
  const r = await pg.query(`select friend_id, friend_name from public.my_friends`);
  if (r.rows.length !== 1 || r.rows[0].friend_id !== A || r.rows[0].friend_name !== '금손여사')
    throw new Error(JSON.stringify(r.rows));
});
await as(C);
await expectOk('friends: 제3자에겐 남의 관계 안 보임', async () => {
  const r = await pg.query(`select count(*)::int as n from public.friends`);
  if (r.rows[0].n !== 0) throw new Error(`${r.rows[0].n}행 노출`);
});

// chat
await as(A);
let roomId;
await expectOk('chat: A가 방 생성(+returning) → 본인/친구 B 멤버 등록', async () => {
  const r = await pg.query(`insert into public.chat_rooms (is_group, created_by) values (false, auth.uid()) returning id`);
  roomId = r.rows[0].id;
  await pg.query(`insert into public.chat_members (room_id, user_id) values ($1, auth.uid()), ($1, $2)`, [roomId, B]);
});
await expectErr('chat: 친구 아닌 C 멤버 등록 차단', /policy|denied/i, () =>
  pg.query(`insert into public.chat_members (room_id, user_id) values ($1, $2)`, [roomId, C]));
await expectOk('chat: A 메시지 전송', () =>
  pg.query(`insert into public.chat_messages (room_id, sender_id, body) values ($1, auth.uid(), '안녕하세요, 이번 주 클래스 같이 가실래요?')`, [roomId]));
await expectErr('chat: 외부 image_url 차단(트리거)', /invalid image_url/i, () =>
  pg.query(`insert into public.chat_messages (room_id, sender_id, body, image_url) values ($1, auth.uid(), 'x', 'https://evil.example/x.png')`, [roomId]));
await as(B);
await expectOk('chat: 멤버 B는 메시지/멤버 프로필 조회', async () => {
  const m = await pg.query(`select body from public.chat_messages where room_id = $1`, [roomId]);
  if (m.rows.length !== 1) throw new Error('메시지 안 보임');
  const p = await pg.query(`select member_name from public.chat_room_profiles where room_id = $1 order by member_name`, [roomId]);
  if (p.rows.length !== 2) throw new Error(`프로필 ${p.rows.length}명`);
});
await as(C);
await expectOk('chat: 비멤버 C에겐 방/메시지 안 보임', async () => {
  const r = await pg.query(`select count(*)::int as n from public.chat_messages`);
  const rr = await pg.query(`select count(*)::int as n from public.chat_rooms`);
  if (r.rows[0].n !== 0 || rr.rows[0].n !== 0) throw new Error('노출됨');
});
await expectErr('chat: 비멤버 C 메시지 전송 차단', /policy|denied/i, () =>
  pg.query(`insert into public.chat_messages (room_id, sender_id, body) values ($1, auth.uid(), '침입')`, [roomId]));

// records
await as(A);
await expectOk('records: 기록 작성/캘린더 조회', async () => {
  await pg.query(`insert into public.records (user_id, activity_id, title, body, record_date, satisfaction, tags)
    values (auth.uid(), 'A001', '첫 발효빵', '반죽부터 굽기까지 3시간. 뿌듯했다.', '2026-07-18', 5, array['빵','클래스'])`);
  const r = await pg.query(`select count(*)::int as n from public.records where record_date between '2026-07-01' and '2026-07-31'`);
  if (r.rows[0].n !== 1) throw new Error('조회 실패');
});
await as(B);
await expectOk('records: 타인 기록 안 보임', async () => {
  const r = await pg.query(`select count(*)::int as n from public.records`);
  if (r.rows[0].n !== 0) throw new Error('노출됨');
});

// notices (anon)
await as(null);
await expectOk('notices: 비로그인 공개 읽기 3건', async () => {
  const r = await pg.query(`select count(*)::int as n from public.notices`);
  if (r.rows[0].n !== 3) throw new Error(`${r.rows[0].n}건`);
});
await expectOk('activity_review_stats: anon 조회(A001 평균 5.0)', async () => {
  const r = await pg.query(`select avg_rating, review_count from public.activity_review_stats where activity_id = 'A001'`);
  if (Number(r.rows[0].avg_rating) !== 5 || r.rows[0].review_count !== 1) throw new Error(JSON.stringify(r.rows));
});
await expectErr('notices: anon insert 차단', /denied|policy/i, () =>
  pg.query(`insert into public.notices (title, body) values ('스팸', '스팸')`));

// 계정 삭제 cascade
await admin();
await expectOk('계정 삭제: auth.users 삭제 → 소유 데이터 cascade', async () => {
  await pg.query(`delete from auth.users where id = $1`, [A]);
  for (const t of ['preference_scores','wishlist','cart_items','reviews','records','friends','chat_members','chat_messages']) {
    const r = await pg.query(`select count(*)::int as n from public.${t} where ${t === 'chat_messages' ? 'sender_id' : 'user_id'} = $1`, [A]);
    if (r.rows[0].n !== 0) throw new Error(`${t}에 잔존`);
  }
});

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail === 0 ? 0 : 1);
