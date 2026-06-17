-- Credits balance per user. Required by handle_new_user_credits() auth trigger.
-- Safe to re-run.

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

-- Ensure trigger function exists and targets the table above
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

-- Backfill credits for users created while the table was missing
insert into public.user_credits (user_id, balance, lifetime_earned)
select u.id, 100, 100
from auth.users u
where not exists (
  select 1 from public.user_credits c where c.user_id = u.id
);
