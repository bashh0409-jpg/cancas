-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists canvases_user_updated_idx
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

-- Storage bucket for canvas image assets (Dashboard → Storage → New bucket: canvas-files, public)
insert into storage.buckets (id, name, public)
values ('canvas-files', 'canvas-files', true)
on conflict (id) do nothing;

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

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

create policy "Users read own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

create policy "Users update own credits"
  on public.user_credits for update
  using (auth.uid() = user_id);

-- Service role only for inserts — credits should be granted server-side, not by the client
create policy "Service role insert credits"
  on public.user_credits for insert
  with check (auth.role() = 'service_role');