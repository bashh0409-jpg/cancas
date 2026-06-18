-- Add user integration token storage for external storage providers.
-- Safe to re-run.

create table if not exists public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.integration_tokens enable row level security;

create policy "Users can read their own integration tokens"
  on public.integration_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integration tokens"
  on public.integration_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integration tokens"
  on public.integration_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integration tokens"
  on public.integration_tokens for delete
  using (auth.uid() = user_id);
