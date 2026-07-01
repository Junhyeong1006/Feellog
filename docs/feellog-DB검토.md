# 필로그(Feellog) DB 개선 종합 보고서 — 데이터 아키텍트 총괄

> 대상 파일: `/Users/doz/3학년 1학기/SYNC/feellog/supabase/migrations/20260701090000_init.sql` (단일 init, 아직 DB 미적용)
> 전제: **소셜 로그인 전용**(카카오/애플/구글), 이메일·비밀번호 가입 없음. 타깃 5060 시니어.

## 1) 한 줄 결론

현재 스키마는 5축 취향모델·RLS·keepalive까지 뼈대는 견고하나 **"이메일/비밀번호 가입"을 암묵 전제로 짜여 있어 소셜 전용에서 곧바로 깨진다** — 가장 중요한 단일 변경은 `handle_new_user` 트리거를 **`new.email` 의존 제거 + provider별 이름 키 폴백**으로 재작성하는 것이고(카카오 이메일 미동의 시 다수 사용자 이름이 NULL/쓰레기값), 여기에 **동의 저장소(user_consents)와 계정삭제 RPC**를 더하면 앱스토어 심사·개인정보보호법 최소요건까지 충족된다.

---

## 2) 🔴 MVP-필수 변경 (CONFIRMED·MVP-필수만, 소셜/개인정보 우선)

| 항목 | 문제 | 구체적 DDL 변경 | 이유 |
|---|---|---|---|
| **① handle_new_user 재작성** (AUTH-1·PRIV-2·RLS-2 통합) | 117행 `coalesce(...->>'name', split_part(new.email,'@',1))`. 카카오는 이메일 미동의가 흔해 `new.email=NULL`→`split_part(NULL)=NULL`. 이름 키도 provider마다 다름(카카오 `nickname`, 구글 `full_name`/`name`, Apple 재로그인 시 부재). 합성 이메일(`kakao_{id}@feellog.local`)이 들어오면 로컬파트가 그대로 이름이 됨. | 아래 3-①의 함수로 통째 교체. **핵심: `new.email`을 폴백에서 완전 제거**, `nickname→full_name→name→preferred_username` 순 폴백, `nullif(btrim(),'')`로 빈값→NULL 정규화, 이름 못 찾으면 NULL(온보딩에서 입력). **주의: 검증에서 걸린 원안 결함 반영 — 존재하지 않는 `avatar_url`/`auth_provider` 컬럼에 insert 금지(적용 시 전 가입 실패), 매칭 안 되는 `->'user_metadata'->>'name'` 중첩 경로 제거.** | 카카오는 5060 주 진입 채널이라 사실상 전 사용자 영향. 이름 미표시/쓰레기값 노출은 시니어 신뢰·UX 직격. |
| **② profiles.email 미추가(현행 유지 결정 확정)** (AUTH-4) | 소셜 전용에서 email은 카카오 미제공·Apple Private Relay(익명)·합성 플레이스홀더가 섞여 데이터 품질이 오염되고, `auth.users.email`에 이미 존재. `public.profiles`는 RLS로 클라 노출되므로 PII 중복은 노출면만 확대. | **profiles에 email 컬럼 추가하지 않음.** ①에서 `new.email`을 폴백에서까지 제거하면 email은 profiles로 일절 유입되지 않음. CS 필요 시 service_role로 `auth.users.email` 참조. | 개인정보 최소수집. ※이 항목은 no-op 결정이며 **①과 결합해야 실효 완성**(단독으론 코드 변화 없음). |
| **③ user_consents 동의 저장소 신설** (PRIV-1) | 동의 저장소가 전무. 개인정보보호법 §15/§22(필수·선택 분리, 개별 동의)·정보통신망법 §50(마케팅 옵트인) 입증 불가. 소셜 전용은 콜백 직후 **서버**가 동의 게이트를 판정·기록해야 함(가입 폼 없음). | 3-②의 `consent_kind` enum + `user_consents` 테이블 + `profiles.consented_at` + RLS(본인 select/insert만, UPDATE/DELETE 정책 부재=이력 무결성). **검증 반영: `ip`/`user_agent`는 그 자체가 신규 PII 수집이고 파기배치가 없어 최소수집과 충돌 → MVP에선 컬럼 제외.** `age_over_14`는 5060 전용 서비스라 게이트에서 제외, 필수 게이트는 `terms/privacy` 2종. `marketing/third_party/overseas`는 `granted=false` 기본. | 법정 필수동의 입증 불가 시 앱스토어 심사 반려·과태료 리스크(최대 3천만원). 다크패턴(전체동의 강제) 방지 서버검증도 이 테이블 없이는 불가. |
| **④ 계정 자기삭제 RPC** (RLS-1) | `auth.users`는 RLS 밖이라 authenticated 클라가 자기 계정을 지울 경로가 없음. 앱의 '회원탈퇴'(S23) 버튼을 뒷받침할 백엔드가 스키마/함수에 전무. Apple/Google 모두 앱 내 계정삭제 필수. | 3-③의 `delete_my_account()` security definer RPC. `auth.users` 삭제→cascade로 profiles/taste/test/reactions 연쇄삭제, analytics_events는 `set null`로 익명화 보존. `grant execute ... to authenticated`, `revoke ... from anon`. | 개인정보보호법 파기·철회권 이행 + 스토어 심사 통과. **소프트삭제(deleted_at)는 Phase1에 결제/커뮤니티가 없어 과설계 → 하드 cascade가 정답**(PRIV-3/AUTH-6 REJECT 반영). |
| **⑤ 5축 컬럼 -100..100 CHECK** (MODEL-1) | `base_*`/`cur_*`(10개)+`activities.axis_*`(5개)가 `smallint`뿐이라 ±32767 무검증 저장. 도메인 계약은 -100..100(scoring clampAxis). `cur_*`는 클라가 `taste self all`로 직접 upsert 가능해 DB가 마지막 방어선. | 각 축 컬럼에 `check (... between -100 and 100)`. 같은 파일 74행 `intensity`가 이미 CHECK를 쓰므로 축에만 빠진 건 누락. | 오염 벡터가 가중 유클리드 거리를 왜곡해 추천 순위를 조용히 뒤집음. 값 쌓인 뒤 붙이면 위반행 정리 필요=고비용. |
| **⑥ trend/recovery_score 0..100 CHECK** (MODEL-2) | 두 컬럼은 0~100(보조성향 강도)인데 CHECK 없음. 5축(-100..100)과 **범위가 다름**. 배지 임계 `>=60` 로직이 음수/초과값에 오동작. | `check (trend_score between 0 and 100)`, `check (recovery_score between 0 and 100)`. **주석으로 "축과 범위 다름" 명시**(일괄 -100..100 오적용 방지). | 무결성 보험. ⑤와 혼동해 -100 기준으로 잘못 걸면 정상값 절반이 막힘. |
| **⑦ updated_at 자동 갱신 트리거** (MODEL-3) | `profiles.updated_at`·`taste_profiles.updated_at`이 `default now()`라 INSERT 때만 채워지고 UPDATE 시 자동 갱신 안 됨. EMA로 `feedback_count`는 오르는데 `updated_at`은 옛날값으로 고정. | 3-④의 공통 `set_updated_at()` BEFORE UPDATE 트리거를 profiles·taste_profiles에 부착. **검증 반영: reactions는 스코프 제외(별건), 함수는 `security definer set search_path=public`로 하드닝.** | 수동 `now()` 누락 버그 산발 방지. ※'휴면 판단' 용도는 과장 — 로그인 활동엔 안 움직임(휴면은 `auth.users.last_sign_in_at`). |
| **⑧ test_responses.user_id 인덱스** (PERF-2) | `user_id`가 profiles FK인데 인덱스 0개(유사 테이블 reactions는 이미 보유). 결과화면·재추천은 `user_id=? order by created_at desc limit 1` 반복 조회 → 전건 스캔+정렬. | `create index test_responses_user_created_idx on public.test_responses (user_id, created_at desc);` | FK 커버(cascade 삭제 시 자식 전건스캔 제거) + 최신 1건 조회를 정렬 없이 인덱스 top으로. Phase1 핵심(결과) 경로. |

---

## 3) 🟡 권장 (가능하면 지금)

| 항목 | 문제 | 구체적 DDL 변경 | 이유 |
|---|---|---|---|
| **profiles.avatar_url 추가 + 트리거 아바타 매핑** (AUTH-2) | 아바타 컬럼 없고 트리거도 아바타 무시. provider가 주는 사진(구글 `picture`, 카카오 `avatar_url`/`profile_image`, Apple 미제공)을 버림. | `alter table profiles add column avatar_url text;` + ① 트리거 insert에 `coalesce(...->>'avatar_url', ...->>'profile_image', ...->>'picture')` 매핑. **검증 반영: 카카오 `profile_image` 키 반드시 포함(누락 시 조용히 유실).** Apple 미제공 대비 UI는 이니셜 아바타 폴백. | 시니어가 직접 업로드해야 하는 부담 제거. ※외부 CDN URL은 만료 가능 → 정본의 `avatar_path`(스토리지) 전환은 Phase2. |
| **auth_provider 컬럼 + 트리거 기록** (AUTH-3) | 어떤 소셜로 가입했는지 기록 없음. CS(로그인 문의 시 provider 판별)에 유용. | `alter table profiles add column auth_provider text;` + ① 트리거에 `coalesce(new.raw_app_meta_data->>'provider', new.raw_user_meta_data->>'provider')`(app_meta 우선=변조 불가). CHECK 생략. **주석: "가입 시점 첫 provider만, 이후 갱신 안 됨(stale)".** | 비용 ≈0. ※'계정 병합/재로그인 판단' 용도는 과장 — 그건 다중행 `auth.identities` 소관. |
| **트리거 예외 격리** (AUTH-5) | AFTER 트리거 예외가 `auth.users` insert 트랜잭션을 롤백 → 소셜 로그인 자체 실패(유일 가입 경로=단일 장애점). | ① 트리거 본문을 `begin ... exception when others then raise log ...; return new; end;`로 감쌈. | 드문 메타데이터 케이스에서 로그인 전체 실패 방지. **단, 예외 삼킴 시 profiles 미생성→하위 FK 전부 실패 위험 → 앱 S03 콜백의 `profiles upsert(on conflict do nothing)` 병행을 '필수'로 규정.** |
| **RLS FORCE 추가** (PRIV-6) | 계획서는 'RLS ENABLE+FORCE' 표준인데 init은 ENABLE만. 소유자/definer 경로 우회 여지. | 개인정보 포함 테이블에 `force row level security` (profiles/taste_profiles/test_responses/reactions/analytics_events + user_consents). **`user_consents` FORCE 라인은 반드시 ③ 이후에.** activities는 공개 카탈로그라 FORCE 불필요. | 기본거부·심층방어. 클라 경로엔 변화 없고(이미 anon/authenticated는 RLS 대상) 비용 0. |
| **analytics_events insert 하드닝** (RLS-3, 하향) | 정책 `with check (user_id is null or auth.uid()=user_id)`가 anon에 무제한 insert 개방. 공개 anon key로 임의 대용량 JSON 스팸→무료 500MB 고갈 가능. | `add constraint analytics_name_len check (char_length(name)<=64)`, `add constraint analytics_props_len check (pg_column_size(props)<=4096)`, **허용 이벤트명 화이트리스트 `check (name in ('signup','test_complete',...))`.** | **검증 반영: authenticated 전용化는 REJECT** — '둘러보기(가입 전 체험)' 익명 퍼널이 시니어 진입장벽 완화책이라 KPI 파괴. anon insert 유지하되 크기·이름만 제한. |
| **taste_profiles 쓰기 서버권위화** (RLS-4·RLS-7) | `taste self all`이 클라의 `base_*`/`main_type`/`feedback_count` 직접 위조 허용. `auth.uid()`는 '누구'만 보증, '서버계산 결과'인지 보증 못함. | `taste self all` 삭제 → `create policy "taste self select" for select using (auth.uid()=user_id);` (insert/update는 진단 RPC/service_role만). **전제(필수): 진단 결과를 기록할 `submit_test` security definer RPC를 같은 init에 동봉**해야 온보딩→결과 흐름이 안 깨짐. | 추천 벡터/카운트 위조 차단. RPC 미동봉 시 첫 진단 upsert 주체가 사라지므로 조건 필수. |
| **reactions insert/select/delete 분리 + select 값 정리** (RLS-4·MODEL-4) | `reactions self all`(update 포함). `select`가 `like`를 덮어 EMA 선호신호 소실. | `for all` → `insert`+`select`+`delete` 3정책 분리(update 금지). **enum을 `('like','dislike')`로 축소**(select는 append 로그/analytics로 이관). ALTER로 값 제거 불가하니 미적용 지금 `create type`에서 바로 정정=비용0. | 선호/전환 신호 분리로 EMA 입력 오염 방지. ※신규 `activity_selections` 테이블은 과설계 → `analytics_events(name='card_select')` 이관. |
| **reactions.activity_id 인덱스** (PERF-1, 하향) | 미인덱스 FK(cascade 삭제 시 전건스캔). | `create index reactions_activity_idx on public.reactions (activity_id);` **단일 컬럼만**(kind 복합은 집계쿼리 확정 후). | not-null uuid 단일 btree라 비용≈0, 미인덱스 FK 보험가치. ※MVP-필수 아님(하드 DELETE 드묾, 인기집계는 Phase2). |
| **activities 공개읽기 활성행 한정** (RLS-5) | `using (true)`가 비활성/초안 카드·파트너 필드까지 anon 전량 노출. | `activities public read` → `using (is_active = true)`. `activities_active_idx`가 이미 있어 성능 OK. | 노출면 최소화. **authenticated 전용化는 반대**(anon 딥링크/미리보기 여지 유지). 원가·수수료 민감컬럼은 애초 이 테이블에 두지 말 것. |
| **price/duration 무결성 CHECK + activities soft delete** (MODEL-6) | `price`/`duration_min` 음수·0 무방비. 활동 물리삭제 시 reactions cascade로 피드백 이력 파괴. | `price integer check (price is null or price>=0)`, `duration_min integer check (duration_min is null or duration_min>0)`. `alter add column deleted_at timestamptz` + 카탈로그 조회를 `deleted_at is null and is_active`로. **검증 반영: reactions FK는 cascade 유지(set null/restrict는 unique·조인 깨짐 → REJECT), 대신 '활동은 물리삭제 금지, deleted_at 마킹만' 운영규칙으로.** | 필터 오작동 방지 + 이력 보존. |
| **main_type/sub_trait 라벨 정본 통일** (MODEL-8, 안B) | `sub_trait` 라벨이 3갈래(init=`trend_seeker/recovery_charger`, 계획서본문=`trend/recovery`, 부록=`trend_discovery/recovery_charge`). classify 코드가 어느 것으로 insert하면 실패. | enum 유지하되 **코어 리터럴·enum 라벨·계획서를 단일 정본 문자열로 통일**(코드 작성 전 지금). text+CHECK 전환(안A)은 실익 낮아 보류. | 코어-DB 라벨 불일치로 insert 실패/오분류 예방. 코드 작성 전이라 무료. |
| **region 2단 분리 + 사용자 지역 컬럼** (MODEL-5) | `activities.region` 자유텍스트라 '서울'/'서울시'/'서울특별시' 표기흔들림이 하드필터 0건을 유발. | **검증 반영: 숫자 행정코드(안1)는 과설계** → `region_sido text` + `region_sigungu text` 2컬럼, `sido`만 17개 시도 CHECK 화이트리스트(시군구는 CHECK 부적절). `profiles`에 동형 사용자 지역 컬럼 추가하되 **온보딩 수집 흐름과 함께 정의**(안 그러면 nullable 장식). 인덱스 `(region_sido, region_sigungu)`. | 지역 필터 조용한 0건 방지. ※매칭 RPC 미구현이라 '광역 vs 시군구' 필터 로직은 구현 시 재검토. |

---

## 4) ⚪ 나중 (Phase 2+) — 지금 안 하는 이유

- **tag_weights jsonb 저장소** (RECO-1): 비용검토 SCOPE-2가 "온라인 EMA 영속은 Phase2, MVP는 세션 내 클라 보정 + reactions 서버 로그만"으로 이미 확정. 지금 넣으면 writer/reader 없는 죽은 컬럼. 반응 로그가 남아 소급 재계산 가능(데이터 손실 아님).
- **recommendations 임프레션 테이블** (RECO-2): 임프레션은 이미 `analytics_events`의 `card_impression`으로 적재됨(중복). ε-탐색 자체가 Phase4/백로그(계획서 C-1). 재랭킹×25장 전용테이블 적재는 무료 400MB 캡 위협.
- **reactions append-only 이력화** (RECO-3): 순서 로그는 `analytics_events.card_reaction`이 이미 시각·순서 보존. 정본이 '활동당 최종 반응 1개(upsert)'를 숙고 선택. 하이퍼파라미터 재튜닝은 Phase2 운영 관심사. (단 `select`=EMA 비대상, `like=+1/dislike=-1` 매핑 **문서화만** 지금 무해.)
- **type_centroids + reco_config 튜닝 테이블** (RECO-5): 첫 출시엔 값 고정이라 코드 상수로 동작. 튜닝 이득은 A/B 시작 후 발생. (**단 코드 작성 전 유형 코드 네이밍 드리프트 정리는 MODEL-8에서 지금 처리.**)
- **소프트삭제 deleted_at + pg_cron 파기배치** (PRIV-3·AUTH-6): Phase1에 결제/커뮤니티 없어 법정보존(5년) 대상 데이터가 0 → 소비자 없는 죽은 인프라. 하드 cascade(④)로 삭제권 충족.
- **analytics TTL 파기배치** (PRIV-4): 12개월 TTL은 MVP 기간 내 발화 안 함. **pg_cron은 무료티어 7일 일시정지 시 자기를 못 깨움**(비용검토 BE-3) → 도입 시 기존 외부 크론(CF Worker)/Edge에 태울 것. (단 계정삭제 Edge에서 잔여 이벤트 물리삭제는 ④와 함께 처리.)
- **birth_year → age_band ENUM** (PRIV-5): 버킷 경계 미확정 제품결정을 스키마에 못박으면 재정의 때마다 마이그레이션 강제. birth_year는 현재 어떤 코드도 write 안 함 → 온보딩이 실제 수집할 때 결정.
- **국외이전/위탁 문서 카탈로그 legal_documents** (PRIV-7): '[가정] 법무 검토 후 확정' 미확정 사안. `user_consents.doc_version(text)`만으로 재현 충분. 하드 FK는 seed 누락 시 가입 차단 footgun.
- **test_responses jsonb CHECK / is_current** (MODEL-7): 소비처 없는 그린필드. `jsonb_array_length=12` 하드 CHECK는 부분응답에 insert 거부. `is_current`는 `taste_profiles`(단일행 SSOT)와 이중진실 드리프트. → SSOT 문서화만.
- **인덱스/성능 항목**: 하드필터 복합인덱스(MODEL-6/RECO-6/PERF-3 — 카탈로그 수천행 초과 시, 컬럼순도 재검토), keywords/jsonb GIN(PERF-5 — 조회경로 없음), region partial 통합(PERF-8), pgvector(RECO-7 — 주석 마커만), analytics BRIN/파티셔닝(PERF-7 — 'name_idx 대체' 아닌 '추가').
- **다중 이미지 activity_images** (MODEL-10): 대표 1장으로 충분. 승격 시 `alt_text NOT NULL`(접근성) 필수 규칙만 백로그 기록.
- **keywords 정규화 태그 테이블** (MODEL-9): M:N은 과설계. **단 입력 파이프라인 trim/소문자 정제는 지금 권장**(표기흔들림 원천 차단). 승격 시 이름은 `activity_keywords`(계획서 `activity_tags`가 이미 다른 의미로 선점).

---

## 5) ❌ 폐기/과설계 (REJECT된 것과 이유)

- **트리거 원안 SQL의 `avatar_url`/`auth_provider` 직접 insert** (AUTH-1 원안): 현 profiles에 두 컬럼이 없어 적용 시 **매 가입마다 트리거 실패=전 사용자 가입 차단**. → 컬럼 추가를 선행하거나 display_name만 고칠 것.
- **트리거 폴백의 `->'user_metadata'->>'name'` 중첩 경로** (RLS-2 원안): GoTrue가 클레임을 평탄화하므로 **절대 매칭 안 됨**(무해하나 cargo-cult) → 제거.
- **소프트삭제(deleted_at) Phase1 도입** (PRIV-3·AUTH-6-B): 법정보존 대상 데이터 부재 → 소비자 없는 죽은 컬럼. 하드 cascade가 정답.
- **analytics_events를 authenticated 전용으로 좁히기** (RLS-3 원안): '둘러보기' 익명 퍼널 KPI를 통째로 파괴 → 크기·이름 CHECK로만 완화.
- **reactions FK를 `on delete set null`/`restrict`로 변경** (MODEL-6 원안): `set null`은 `unique(user_id,activity_id)`·조인 의미 붕괴+고아행, `restrict`는 소프트삭제와 조합 시 무의미. → cascade 유지+운영규칙.
- **activity_selections / reaction_events 별도 테이블 신설** (MODEL-4·RECO-3): `analytics_events`와 중복 → 이중 진실원. 폐기.
- **legal_documents 문서 카탈로그 + 하드 FK** (PRIV-7): `doc_version` text로 재현 충분, FK는 가입차단 footgun.
- **is_current 플래그, jsonb 12문항 하드 CHECK** (MODEL-7): SSOT 이중화·부분응답 차단.
- **age_band ENUM 즉시 도입** (PRIV-5): 미확정 버킷 경계 조기 커밋.
- **하드필터 4컬럼 복합인덱스 `(region,price,duration_min,intensity)`** (RECO-6·PERF-3 원안): B-tree 범위술어 특성상 `(region,price)`까지만 유효, 뒤 2컬럼은 dead. + 현 규모(수십~수백행)에선 플래너가 seq scan 선택 → 지금 불필요.
- **`ip`/`user_agent` 동의 입증 컬럼** (PRIV-1 원안): 파기배치 없는 신규 접속기록 PII 수집 → 최소수집 위반 소지. MVP 제외.
- **cur 벡터 갱신용 reactions 트리거** (RECO-8): 클라 프리뷰(core `applyFeedback`)와 로직 이원화·드리프트 → Edge/RPC 단일 트랜잭션으로. + 단일행 명시 락은 조기최적화.
- **RECO-9 reason 문구 이름 폴백**: 정본 추천 카피는 이름 없는 '당신께'이고 `reason`은 구조화 JSONB(이름 미포함) → 잘못된 계층 오조준. 자연어 사유는 Phase3(LLM).
- **타입 변경** (PERF-6): 현 타입 전부 적정, 진짜 공백은 인덱스(⑧·PERF-1).

---

## 6) 소셜 로그인 전용에 따른 변경 요지

**handle_new_user 재작성 방향** (아래 3-① 함수가 최종형):
- `new.email`을 **모든 폴백에서 완전 제거** — 카카오 이메일 미동의(NULL)·Apple relay·합성 이메일(`kakao_{id}@feellog.local`)이 이름으로 새는 것을 원천 차단.
- 이름 폴백 체인: `nickname`(카카오) → `full_name`(구글/애플 name scope) → `name`(구글) → `preferred_username`. 전부 `nullif(btrim(),'')`로 정규화, 못 찾으면 **NULL 유지**(빈문자/쓰레기값 금지) → 온보딩 닉네임 입력으로 보완. **DB 단독으로는 미완, 앱 온보딩 닉네임 스텝이 전제.**
- 아바타(권장): `coalesce(avatar_url, profile_image, picture)`, 컬럼 추가 시에만.
- provider(권장): `raw_app_meta_data->>'provider'` 우선(변조 불가).
- 예외 격리 + `on conflict (id) do nothing` + `security definer set search_path=public` 유지.

**email 처리 결론**: `profiles`에 email 컬럼 **두지 않음**. 원천은 `auth.users.email`, CS는 service_role 참조. 명시동의 기반 `email_for_notice`는 Phase2.

**consent 처리 결론**: 소셜은 가입 폼이 없어 **콜백 직후 서버(user_consents)가 동의 게이트를 기록**해야 법적 입증 성립. 필수 게이트는 `terms/privacy` 2종(`age_over_14`는 5060 전용이라 제외), 나머지 `granted=false` 기본. 앱은 `profiles.consented_at`으로 홈 진입 차단.

**provider 처리 결론**: `auth_provider`는 CS 판별용 편의 비정규화(권장). 가입 시점 첫 provider만 담기는 **stale 값**이므로 계정병합 판단엔 쓰지 말 것(그건 `auth.identities`).

**계정삭제 결론**: RLS로 `auth.users`를 못 지우므로 **service_role `delete_my_account()` RPC 필수**. 하드 cascade로 즉시완전삭제(소프트삭제 불필요).

---

## 7) 최종 마이그레이션에 반영할 변경 체크리스트

메인이 SQL을 직접 수정할 수 있도록 항목별로 정확히 기재.

### 3-① handle_new_user 재작성 (MVP-필수, 예외격리·아바타·provider 포함)
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nm   text;
begin
  nm := coalesce(
    nullif(btrim(meta->>'nickname'), ''),           -- kakao
    nullif(btrim(meta->>'full_name'), ''),          -- google / apple(name scope)
    nullif(btrim(meta->>'name'), ''),               -- google
    nullif(btrim(meta->>'preferred_username'), '')  -- oidc
  );  -- 못 찾으면 NULL → 온보딩에서 닉네임 입력
  insert into public.profiles (id, display_name, avatar_url, auth_provider)
  values (
    new.id,
    nm,
    coalesce(meta->>'avatar_url', meta->>'profile_image', meta->>'picture'),  -- avatar_url 컬럼 추가 시
    coalesce(new.raw_app_meta_data->>'provider', meta->>'provider')           -- auth_provider 컬럼 추가 시
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise log 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;
```
> **주의: `avatar_url`/`auth_provider`를 insert에 넣으려면 아래 컬럼 추가(권장)를 반드시 선행.** avatar/provider를 이번에 안 넣으면 insert를 `(id, display_name)` / `values (new.id, nm)`로 축소할 것. `new.email`은 어디에도 넣지 않는다.

### 추가 컬럼 (ALTER 또는 create table 정의에 삽입)
- `profiles`: `avatar_url text`(권장), `auth_provider text`(권장), `consented_at timestamptz`(③), `region_sido text`, `region_sigungu text`(MODEL-5, 온보딩 수집 정의 병행)
- `activities`: `region` → `region_sido text` + `region_sigungu text check (region_sido is null or region_sido in ('서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'))`; `deleted_at timestamptz`

### 신규 테이블/타입 (③ user_consents)
```sql
create type consent_kind as enum
  ('terms_of_service','privacy_policy','marketing','third_party_provision','overseas_transfer');
-- age_over_14는 5060 전용이라 제외

create table public.user_consents (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       consent_kind not null,
  granted    boolean not null,            -- 철회 시 granted=false 신규 행 append(이력 보존)
  doc_version text not null,              -- 예: 'privacy-2026-07-01'
  acted_at   timestamptz not null default now(),
  method     text not null default 'signup_gate'  -- signup_gate | settings
  -- ip/user_agent 컬럼은 파기배치 없이 최소수집 위반 소지 → MVP 제외
);
create index user_consents_user_kind_idx on public.user_consents (user_id, kind, acted_at desc);
```
> 필수 게이트: `terms_of_service`, `privacy_policy`. 나머지 `granted=false` 기본. 온보딩 진입 전 `profiles.consented_at` 확인.

### CHECK 제약 (⑤⑥ + MODEL-6)
- `taste_profiles`: `base_rhythm/base_relation/base_experience/base_participation/base_reward` + `cur_*` 10개 전부 `check (... between -100 and 100)`
- `activities`: `axis_rhythm/axis_relation/axis_experience/axis_participation/axis_reward` 5개 `check (... between -100 and 100)`
- `taste_profiles`: `check (trend_score between 0 and 100)`, `check (recovery_score between 0 and 100)` — **주석 "축 -100..100과 범위 다름"**
- `activities`: `check (price is null or price >= 0)`, `check (duration_min is null or duration_min > 0)`
- `analytics_events`: `check (char_length(name) <= 64)`, `check (pg_column_size(props) <= 4096)`, `check (name in (...허용 이벤트명...))`

### enum 정정 (MODEL-4·MODEL-8)
- `reaction_kind`: `('like','dislike','select')` → **`('like','dislike')`** (select는 analytics로)
- `sub_trait` 라벨: init `trend_seeker/recovery_charger`를 **코어 코드·계획서와 단일 정본으로 통일**(문자열 3갈래 제거)

### 트리거 (⑦ set_updated_at)
```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_profiles_updated       before update on public.profiles       for each row execute function public.set_updated_at();
create trigger trg_taste_profiles_updated before update on public.taste_profiles for each row execute function public.set_updated_at();
```

### RPC (④ 계정삭제 + taste 서버권위 전제 submit_test)
```sql
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = auth.uid();  -- cascade로 profiles/taste/test/reactions 삭제, analytics는 set null
end;
$$;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.delete_my_account() from anon;
```
> **taste_profiles를 select-only로 잠글 경우(RLS-4) `submit_test` security definer RPC를 반드시 동봉**해야 온보딩→결과 흐름이 안 깨짐(첫 진단 upsert 주체 확보).

### 인덱스 (⑧ + PERF-1)
```sql
create index test_responses_user_created_idx on public.test_responses (user_id, created_at desc);
create index reactions_activity_idx          on public.reactions (activity_id);
create index activities_region_idx           on public.activities (region_sido, region_sigungu);  -- 기존 region 단일 인덱스 대체
```

### 정책 (RLS)
```sql
-- taste_profiles: for all → select만 (쓰기는 RPC/service_role)
drop policy "taste self all" on public.taste_profiles;
create policy "taste self select" on public.taste_profiles for select using (auth.uid() = user_id);

-- reactions: for all → insert/select/delete 분리 (update 금지)
drop policy "reactions self all" on public.reactions;
create policy "reactions self insert" on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions self select" on public.reactions for select using (auth.uid() = user_id);
create policy "reactions self delete" on public.reactions for delete using (auth.uid() = user_id);

-- activities: 활성행만 공개
drop policy "activities public read" on public.activities;
create policy "activities public read" on public.activities for select using (is_active = true and deleted_at is null);

-- user_consents RLS (INSERT/SELECT만, UPDATE/DELETE 정책 부재=이력 무결성)
alter table public.user_consents enable row level security;
create policy "consents self select" on public.user_consents for select using (auth.uid() = user_id);
create policy "consents self insert" on public.user_consents for insert with check (auth.uid() = user_id);

-- FORCE (PRIV-6) — user_consents는 ③ 생성 이후에
alter table public.profiles         force row level security;
alter table public.taste_profiles   force row level security;
alter table public.test_responses   force row level security;
alter table public.reactions        force row level security;
alter table public.analytics_events force row level security;
alter table public.user_consents    force row level security;
```

### 순서 주의
1. enum(`consent_kind` 등) → 2. 테이블(컬럼 포함) → 3. `user_consents` → 4. 인덱스 → 5. 함수/트리거 → 6. RLS enable → 7. 정책 → 8. FORCE(**user_consents FORCE는 반드시 테이블 생성 뒤**).

---

## 8) 사용자(팀 SYNC)가 해야 할 일

**A. Supabase 대시보드 — 소셜 provider 설정 (Authentication > Providers)**
- **카카오**: 카카오 개발자 콘솔에서 앱 생성 → REST API 키/Client Secret 발급, Redirect URI 등록. **동의항목에서 닉네임(profile_nickname)·프로필 이미지는 받되, 이메일은 선택(미동의 가정)으로 설계** — 재작성한 트리거가 이 전제에 맞음. 생년/연령대는 **자동 수집하지 않도록 동의항목에 넣지 말 것**(최소수집).
- **애플(Apple)**: Apple Developer에서 App ID + Sign in with Apple 활성화, Service ID/Key(.p8)·Team ID·Key ID 발급, Return URL 등록. **Apple은 이름을 최초 1회만 제공**하고 Private Relay 이메일이 올 수 있음을 인지(트리거가 이미 대응).
- **구글(Google)**: GCP OAuth 클라이언트(Web) 생성 → Client ID/Secret 발급, Redirect URI 등록, OAuth 동의화면 구성.
- 세 provider 모두 Supabase Redirect URL(`https://<project>.supabase.co/auth/v1/callback`)을 각 콘솔에 정확히 등록.

**B. 앱 구현 규약 (개발계획서 S03/S23 연동)**
- **온보딩 닉네임 입력 스텝 구현**: 트리거가 이름을 못 찾으면 `display_name=NULL`로 두므로, 온보딩에서 반드시 닉네임을 받아 채운다(이 스텝 없이는 이름 빈 UI 잔존).
- **동의 게이트 화면**: 콜백 직후 필수(약관/개인정보) + 선택(마케팅/제3자/국외이전, 기본 해제) 분리 체크 → `user_consents`에 서버 기록, `profiles.consented_at` 세팅 후 홈 진입. **전체동의 강제(다크패턴) 금지.**
- **S03 콜백**: `getSession` 성공 후에만 `profiles upsert(on conflict (id) do nothing)`. **`do update` 금지**(트리거가 만든 이름 덮어쓰기 방지).
- **S23 회원탈퇴 버튼** → `delete_my_account()` RPC 호출 후 클라이언트 `signOut()` 병행.
- 홈 인사말 등 이름 호명 UI는 공용 표시 유틸에서 `display_name ?? '회원님'` null-safe 폴백.

**C. 운영/문서**
- **개인정보 처리방침 공개 URL** 준비(앱스토어·구글 심사 필수, 국외이전/위탁 고지 포함). `doc_version` 문자열 규약(`privacy-2026-07-01` 등) 확정.
- 파트너 활동 등록 시 **region을 시도/시군구로 정규화**해 입력(화이트리스트 준수), price/duration 음수·0 금지.
- **국외이전(Supabase·카카오·구글) 및 위탁 고지 문구**는 법무 검토([가정]) 후 확정.
- `analytics_events` 허용 이벤트명 화이트리스트 목록을 팀이 확정(트리거 CHECK와 동기화).