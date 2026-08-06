-- =============================================================================
-- REFLOW — RESET DATABASE FROM SCRATCH
-- =============================================================================
-- WARNING: Permanently deletes ALL canvas projects (database rows).
--
-- BEFORE running this SQL (required by Supabase — cannot delete files via SQL):
--   Dashboard → Storage → canvas-files → ⋮ → Empty bucket
--   (or delete the whole bucket; this script recreates it if missing)
--
-- AFTER running: open /work?resetLocal=1 in each browser (clears canvasai: local drafts)
--
-- Run in: Supabase Dashboard → SQL → New query → Run
-- =============================================================================

-- 1) Remove Realtime
do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'canvases'
  ) then
    alter publication supabase_realtime drop table public.canvases;
  end if;
exception
  when others then
  null;
end $$;

-- 2) Drop storage policies (files must be cleared in Dashboard — see header)
drop policy if exists "Users upload own canvas files" on storage.objects;
drop policy if exists "Users update own canvas files" on storage.objects;
drop policy if exists "Users delete own canvas files" on storage.objects;
drop policy if exists "Public read canvas files" on storage.objects;

-- 3) Drop canvases table (removes its RLS policies)
drop table if exists public.canvases cascade;

-- =============================================================================
-- FRESH SETUP
-- =============================================================================

create table public.canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index canvases_user_updated_idx
  on public.canvases (user_id, updated_at desc);

alter table public.canvases enable row level security;

create policy "Users read own canvases"
  on public.canvases for select
  using (auth.uid() = user_id);

create policy "Users insert own canvases"
  on public.canvases for insert
  with check (auth.uid() = user_id);

create policy "Users update own canvases"
  on public.canvases for update
  using (auth.uid() = user_id);

create policy "Users delete own canvases"
  on public.canvases for delete
  using (auth.uid() = user_id);

-- Storage bucket (public read for image URLs on the canvas)
insert into storage.buckets (id, name, public)
values ('canvas-files', 'canvas-files', true)
on conflict (id) do update
set public = true;

create policy "Users upload own canvas files"
  on storage.objects for insert
  with check (
    bucket_id = 'canvas-files'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users update own canvas files"
  on storage.objects for update
  using (
    bucket_id = 'canvas-files'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users delete own canvas files"
  on storage.objects for delete
  using (
    bucket_id = 'canvas-files'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Public read canvas files"
  on storage.objects for select
  using (bucket_id = 'canvas-files');

-- Live sync across browsers / tabs
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'canvases'
  ) then
    alter publication supabase_realtime add table public.canvases;
  end if;
end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'local',
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null,
  status text not null default 'active' check (status in ('active','trialing','canceled','past_due','unpaid','expired','paused')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','annual','one_time','custom')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_provider_idx on public.user_subscriptions(provider);
create index if not exists user_subscriptions_status_idx on public.user_subscriptions(status);

alter table public.user_subscriptions enable row level security;

create policy "Users can read their own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscription"
  on public.user_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscription"
  on public.user_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subscription"
  on public.user_subscriptions for delete
  using (auth.uid() = user_id);

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

create policy "Users can read their own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

create policy "Users can update their own credits"
  on public.user_credits for update
  using (auth.uid() = user_id);

create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, balance, lifetime_earned)
  values (new.id, 100, 100)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_credits on auth.users;

create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute procedure public.handle_new_user_credits();
