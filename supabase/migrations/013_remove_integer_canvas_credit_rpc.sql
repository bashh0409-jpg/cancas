-- Remove the legacy integer overload so PostgREST can resolve the numeric RPC.
drop function if exists public.create_user_canvas_with_credit_once(uuid, text, integer, text);
