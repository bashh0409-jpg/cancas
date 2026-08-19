-- Set the default canvas creation charge for existing databases.
create or replace function public.create_user_canvas_with_credit_once(
  p_user_id uuid,
  p_name text default 'Untitled',
  p_credit_amount numeric(12, 2) default 2.25,
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
