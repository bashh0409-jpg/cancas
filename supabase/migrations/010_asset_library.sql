-- Asset Library table for storing user-imported assets that persist across canvases.
-- Users can import assets once into their library and reuse them on any canvas.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS

create table if not exists public.asset_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  file_type text not null default 'image' check (file_type in ('image', 'document', 'spreadsheet', 'text', 'unknown')),
  storage_path text not null,
  public_url text not null,
  thumbnail_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_library_user_created_idx
  on public.asset_library (user_id, created_at desc);

alter table public.asset_library enable row level security;

drop policy if exists "Users read own library assets" on public.asset_library;
create policy "Users read own library assets"
  on public.asset_library for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own library assets" on public.asset_library;
create policy "Users insert own library assets"
  on public.asset_library for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own library assets" on public.asset_library;
create policy "Users update own library assets"
  on public.asset_library for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own library assets" on public.asset_library;
create policy "Users delete own library assets"
  on public.asset_library for delete
  using (auth.uid() = user_id);

-- Storage bucket policy for library assets (stored under /library/ prefix in the canvas-files bucket)
-- The existing canvas-files bucket is used; library assets are stored at: library/{userId}/{assetId}/{file}
drop policy if exists "Users upload own library files" on storage.objects;
create policy "Users upload own library files"
  on storage.objects for insert
  with check (
    bucket_id = 'canvas-files'
    and auth.uid()::text = split_part(name, '/', 2)
    and split_part(name, '/', 1) = 'library'
  );

drop policy if exists "Users update own library files" on storage.objects;
create policy "Users update own library files"
  on storage.objects for update
  using (
    bucket_id = 'canvas-files'
    and auth.uid()::text = split_part(name, '/', 2)
    and split_part(name, '/', 1) = 'library'
  );

drop policy if exists "Users delete own library files" on storage.objects;
create policy "Users delete own library files"
  on storage.objects for delete
  using (
    bucket_id = 'canvas-files'
    and auth.uid()::text = split_part(name, '/', 2)
    and split_part(name, '/', 1) = 'library'
  );

-- Public read for library assets (they're in the public bucket)
-- Already covered by the existing "Public read canvas files" policy on the bucket