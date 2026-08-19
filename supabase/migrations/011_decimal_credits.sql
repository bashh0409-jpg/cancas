-- Canvas creation costs 3.25 credits, so balances and their supporting RPCs
-- need decimal precision. Existing integer balances are preserved as .00.

alter table public.user_credits
  alter column balance type numeric(12, 2) using balance::numeric(12, 2),
  alter column lifetime_earned type numeric(12, 2) using lifetime_earned::numeric(12, 2);

drop function if exists public.consume_user_credits_once(uuid, integer, text, text);
create function public.consume_user_credits_once(
  p_user_id uuid,
  p_amount numeric(12, 2),
  p_idempotency_key text default null,
  p_scope text default 'credits.consume'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_response jsonb;
  next_balance numeric(12, 2);
  operation_response jsonb;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', true, 'consumed', 0);
  end if;

  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtextextended(p_scope || ':' || p_idempotency_key, 0));

    select response into existing_response
    from public.idempotency_keys
    where scope = p_scope and key = p_idempotency_key;

    if existing_response is not null then
      return existing_response;
    end if;
  end if;

  update public.user_credits
    set balance = balance - p_amount,
        updated_at = now()
    where user_id = p_user_id
      and balance >= p_amount
    returning balance into next_balance;

  operation_response := case
    when next_balance is null then jsonb_build_object('success', false, 'error', 'Insufficient credits')
    else jsonb_build_object('success', true, 'consumed', p_amount, 'balance', next_balance)
  end;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    insert into public.idempotency_keys (scope, key, user_id, response)
    values (p_scope, p_idempotency_key, p_user_id, operation_response)
    on conflict (scope, key) do update set response = excluded.response;
  end if;

  return operation_response;
end;
$$;

drop function if exists public.grant_user_credits_once(uuid, integer, text, text);
create function public.grant_user_credits_once(
  p_user_id uuid,
  p_amount numeric(12, 2),
  p_idempotency_key text,
  p_scope text default 'credits.grant'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_response jsonb;
  operation_response jsonb;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', true, 'granted', 0, 'duplicate', false);
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'Idempotency key is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_scope || ':' || p_idempotency_key, 0));

  select response into existing_response
  from public.idempotency_keys
  where scope = p_scope and key = p_idempotency_key;

  if existing_response is not null then
    return existing_response || jsonb_build_object('duplicate', true);
  end if;

  insert into public.user_credits (user_id, balance, lifetime_earned)
  values (p_user_id, p_amount, p_amount)
  on conflict (user_id) do update
    set balance = public.user_credits.balance + excluded.balance,
        lifetime_earned = public.user_credits.lifetime_earned + excluded.lifetime_earned,
        updated_at = now();

  operation_response := jsonb_build_object('success', true, 'granted', p_amount, 'duplicate', false);

  insert into public.idempotency_keys (scope, key, user_id, response)
  values (p_scope, p_idempotency_key, p_user_id, operation_response);

  return operation_response;
end;
$$;

drop function if exists public.create_user_canvas_with_credit_once(uuid, text, integer, text);
create function public.create_user_canvas_with_credit_once(
  p_user_id uuid,
  p_name text default 'Untitled',
  p_credit_amount numeric(12, 2) default 3.25,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  operation_scope text := 'canvas.create';
  existing_response jsonb;
  operation_response jsonb;
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
  created_slug text;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtextextended(operation_scope || ':' || p_idempotency_key, 0));

    select response into existing_response
    from public.idempotency_keys
    where scope = operation_scope and key = p_idempotency_key;

    if existing_response is not null then
      return existing_response;
    end if;
  end if;

  if p_credit_amount > 0 then
    update public.user_credits
      set balance = balance - p_credit_amount,
          updated_at = now()
      where user_id = p_user_id
        and balance >= p_credit_amount;

    if not found then
      operation_response := jsonb_build_object('success', false, 'error', 'Insufficient credits');

      if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
        insert into public.idempotency_keys (scope, key, user_id, response)
        values (operation_scope, p_idempotency_key, p_user_id, operation_response)
        on conflict (scope, key) do update set response = excluded.response;
      end if;

      return operation_response;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('canvas-slug:' || p_user_id::text, 0));

  base_slug := coalesce(
    nullif(trim(both '-' from regexp_replace(lower(coalesce(p_name, 'Untitled')), '[^a-z0-9]+', '-', 'g')), ''),
    'untitled'
  );

  loop
    candidate_slug := case when suffix = 1 then base_slug else base_slug || '-' || suffix::text end;

    if not exists (select 1 from public.canvases where user_id = p_user_id and slug = candidate_slug) then
      insert into public.canvases (user_id, name, slug)
      values (p_user_id, coalesce(nullif(trim(p_name), ''), 'Untitled'), candidate_slug)
      returning slug into created_slug;
      exit;
    end if;

    suffix := suffix + 1;
  end loop;

  operation_response := jsonb_build_object('success', true, 'slug', created_slug);

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    insert into public.idempotency_keys (scope, key, user_id, response)
    values (operation_scope, p_idempotency_key, p_user_id, operation_response)
    on conflict (scope, key) do update set response = excluded.response;
  end if;

  return operation_response;
end;
$$;
