-- ICARE Pilates: reservation, inquiry, and role-based administrator access.
create type public.app_role as enum ('owner', 'manager', 'editor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'editor',
  created_at timestamptz not null default now()
);

create table public.reservations (
  id bigint generated always as identity primary key,
  client_name text not null,
  phone text not null,
  program text not null,
  requested_at timestamptz,
  note text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  program text,
  message text not null,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.board_posts (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.inquiries enable row level security;
alter table public.board_posts enable row level security;

create function public.has_role(allowed_roles public.app_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select coalesce((select role = any(allowed_roles) from public.profiles where id = auth.uid()), false) $$;

create policy "public can create reservations" on public.reservations for insert to anon with check (true);
create policy "public can create inquiries" on public.inquiries for insert to anon with check (true);
create policy "public can read public posts" on public.board_posts for select to anon using (is_public);
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.has_role(array['owner','manager','editor']::public.app_role[]));
create policy "admins manage reservations" on public.reservations for all to authenticated using (public.has_role(array['owner','manager']::public.app_role[]));
create policy "admins manage inquiries" on public.inquiries for all to authenticated using (public.has_role(array['owner','manager','editor']::public.app_role[]));
create policy "admins manage posts" on public.board_posts for all to authenticated using (public.has_role(array['owner','manager','editor']::public.app_role[]));
