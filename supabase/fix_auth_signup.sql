-- =============================================================================
-- FIX: Supabase Auth 500 "unexpected_failure" on Google/OAuth sign-in
-- =============================================================================
-- Cause: auth.users INSERT triggers reference tables that may not exist
-- (especially public.user_credits).
--
-- Run in: Supabase Dashboard → SQL → New query → Run
-- =============================================================================

-- profiles (required by on_auth_user_created trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- user_credits (required by on_auth_user_created_credits trigger)
create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

drop policy if exists "Users can read their own credits" on public.user_credits;
create policy "Users can read their own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own credits" on public.user_credits;
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

-- user_subscriptions (required by on_auth_user_created_subscription trigger)
create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'local',
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null default 'free',
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

alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can read their own subscription" on public.user_subscriptions;
create policy "Users can read their own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own subscription" on public.user_subscriptions;
create policy "Users can insert their own subscription"
  on public.user_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subscription" on public.user_subscriptions;
create policy "Users can update their own subscription"
  on public.user_subscriptions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own subscription" on public.user_subscriptions;
create policy "Users can delete their own subscription"
  on public.user_subscriptions for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_subscriptions (user_id, provider, plan, status, billing_cycle)
  values (new.id, 'local', 'free', 'active', 'monthly')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_user_subscription();

-- Backfill rows for users created while triggers were failing
insert into public.profiles (id, nickname)
select u.id, null
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_credits (user_id, balance, lifetime_earned)
select u.id, 100, 100
from auth.users u
where not exists (select 1 from public.user_credits c where c.user_id = u.id);

insert into public.user_subscriptions (user_id, provider, plan, status, billing_cycle)
select u.id, 'local', 'free', 'active', 'monthly'
from auth.users u
where not exists (select 1 from public.user_subscriptions s where s.user_id = u.id);
