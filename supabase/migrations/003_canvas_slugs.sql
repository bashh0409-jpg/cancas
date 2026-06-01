-- Add user-friendly canvas URLs like /canvas/my-canvas.
-- Safe to re-run.

alter table public.canvases
  add column if not exists slug text;

with generated as (
  select
    id,
    coalesce(
      nullif(
        trim(
          both '-'
          from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
        ),
        ''
      ),
      'untitled'
    ) as base_slug,
    row_number() over (
      partition by
        user_id,
        coalesce(
          nullif(
            trim(
              both '-'
              from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
            ),
            ''
          ),
          'untitled'
        )
      order by created_at, id
    ) as duplicate_index
  from public.canvases
  where slug is null or slug = ''
)
update public.canvases
set slug = case
  when generated.duplicate_index = 1 then generated.base_slug
  else generated.base_slug || '-' || generated.duplicate_index::text
end
from generated
where public.canvases.id = generated.id;

alter table public.canvases
  alter column slug set not null;

create unique index if not exists canvases_user_slug_key
  on public.canvases (user_id, slug);

create index if not exists canvases_user_slug_idx
  on public.canvases (user_id, slug);
