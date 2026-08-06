-- Support ticket submissions from the /support page contact form.
-- Safe to re-run.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  topic text not null default 'General',
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_created_at_idx
  on public.support_tickets (created_at desc);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status);

create index if not exists support_tickets_email_idx
  on public.support_tickets (email);

alter table public.support_tickets enable row level security;

-- Anyone can insert a ticket (public form, no auth required)
drop policy if exists "Anyone can insert support tickets" on public.support_tickets;
create policy "Anyone can insert support tickets"
  on public.support_tickets for insert
  with check (true);

-- Users can read their own tickets (by email match)
drop policy if exists "Users can read own support tickets" on public.support_tickets;
create policy "Users can read own support tickets"
  on public.support_tickets for select
  using (
    auth.uid() = user_id
    or email = (
      select email from auth.users where id = auth.uid()
    )
  );

-- Service role can read/update all tickets (admin access via service key)
drop policy if exists "Service role manages support tickets" on public.support_tickets;
create policy "Service role manages support tickets"
  on public.support_tickets for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');