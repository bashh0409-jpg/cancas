-- =============================================================================
-- Add a flexible user subscription table for local and third-party billing providers.
-- Supports PayFast (SA), Stripe (US/UK), 2Checkout (Global), and custom providers.
-- Safe to re-run.
-- =============================================================================

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

-- Indexes for efficient queries
create index if not exists user_subscriptions_provider_idx on public.user_subscriptions(provider);
create index if not exists user_subscriptions_status_idx on public.user_subscriptions(status);
create index if not exists user_subscriptions_plan_idx on public.user_subscriptions(plan);
create index if not exists user_subscriptions_current_period_end_idx on public.user_subscriptions(current_period_end);

-- Enable Row Level Security
alter table public.user_subscriptions enable row level security;

-- Row Level Security Policies
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

-- Function: Auto-create free subscription for new users
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

-- Trigger: Create subscription row on new auth user
drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_user_subscription();
