-- Revoke the prototype API without dropping any existing records.
drop policy "admins manage profiles" on public.profiles;
drop policy "public can create reservations" on public.reservations;
drop policy "admins manage reservations" on public.reservations;
drop policy "public can create inquiries" on public.inquiries;
drop policy "admins manage inquiries" on public.inquiries;
drop policy "public can read public posts" on public.board_posts;
drop policy "admins manage posts" on public.board_posts;
drop function public.has_role(public.app_role[]);

revoke all on public.profiles, public.reservations, public.inquiries, public.board_posts
  from public, anon, authenticated;
grant select (id, full_name, role) on public.profiles to authenticated;
create policy "read own staff profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create table public.icare_content (
  key text primary key check (key in ('video1', 'video2', 'kakao')),
  value text not null default '' check (char_length(value) <= 2048 and
    (value = '' or (key = 'kakao' and value ~ '^https://open[.]kakao[.]com/o/') or
      (key in ('video1', 'video2') and value like 'https://%')))
);
insert into public.icare_content (key) values ('video1'), ('video2'), ('kakao');

create table public.icare_reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  lesson text not null check (char_length(btrim(lesson)) between 1 and 80),
  text text not null check (char_length(btrim(text)) between 1 and 1500),
  created_at timestamptz not null default now()
);

create table public.icare_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(btrim(question)) between 1 and 120),
  answer text not null check (char_length(btrim(answer)) between 1 and 900),
  created_at timestamptz not null default now()
);
insert into public.icare_faq (question, answer, created_at) values
  ('어린이 필라테스는 몇 살부터 가능한가요?', '키즈 필라테스는 7–18세를 대상으로 합니다. 성장 단계와 수업 참여도를 고려해 상담 후 레슨을 안내합니다.', '2026-01-01 00:00:01+09'),
  ('체험수업은 어떻게 예약하나요?', '상담 페이지에서 이메일이나 카카오톡으로 희망 요일과 시간을 알려주세요. 일정을 확인한 뒤 안내합니다.', '2026-01-01 00:00:02+09'),
  ('주차는 어떻게 하나요?', '벨포레스퀘어 건물에 1시간 주차할 수 있습니다. 4층까지 엘리베이터를 이용하세요.', '2026-01-01 00:00:03+09');

alter table public.icare_content enable row level security;
alter table public.icare_reviews enable row level security;
alter table public.icare_faq enable row level security;
revoke all on public.icare_content, public.icare_reviews, public.icare_faq from public, anon, authenticated;
grant select on public.icare_content, public.icare_reviews, public.icare_faq to anon, authenticated;
grant update (value) on public.icare_content to authenticated;
grant insert (name, lesson, text), delete on public.icare_reviews to authenticated;
grant insert (question, answer), update (question, answer), delete on public.icare_faq to authenticated;

create policy "published settings" on public.icare_content for select to anon, authenticated using (true);
create policy "published reviews" on public.icare_reviews for select to anon, authenticated using (true);
create policy "published faq" on public.icare_faq for select to anon, authenticated using (true);
create policy "staff may edit faq" on public.icare_faq for all to authenticated
  using ((select role from public.profiles where id = (select auth.uid())) in ('owner', 'manager', 'editor'))
  with check ((select role from public.profiles where id = (select auth.uid())) in ('owner', 'manager', 'editor'));
create policy "content staff may update settings" on public.icare_content for update to authenticated
  using ((select role from public.profiles where id = (select auth.uid())) in ('owner', 'editor'))
  with check ((select role from public.profiles where id = (select auth.uid())) in ('owner', 'editor'));
create policy "content staff may publish reviews" on public.icare_reviews for insert to authenticated
  with check ((select role from public.profiles where id = (select auth.uid())) in ('owner', 'editor'));
create policy "content staff may remove reviews" on public.icare_reviews for delete to authenticated
  using ((select role from public.profiles where id = (select auth.uid())) in ('owner', 'editor'));

-- Bucket serves published assets by URL. Browsing, uploads and deletion are staff-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('icare-opening', 'icare-opening', true, 52428800, array['video/mp4', 'video/webm']);
create policy "content staff manage opening files" on storage.objects for all to authenticated
  using (bucket_id = 'icare-opening'
    and (select role from public.profiles where id = (select auth.uid())) in ('owner', 'editor'))
  with check (bucket_id = 'icare-opening' and name ~ '^video[12]/[0-9a-f-]{36}[.](mp4|webm)$'
    and (select role from public.profiles where id = (select auth.uid())) in ('owner', 'editor'));
