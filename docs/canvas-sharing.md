# Canvas sharing

## Goal

Allow a canvas owner to invite signed-in users to a canvas with a `viewer` or
`editor` role. Start with invite-only sharing; do not expose a permanent public
link in v1.

## Security requirements

- Keep `canvases` and canvas assets private by default.
- Enforce access with Supabase Row Level Security (RLS), not only client-side
  checks.
- Authorize every share, revoke, read, update, and asset-download request on
  the server.
- Never expose the Supabase service-role key to the browser.
- Serve private assets through short-lived signed URLs after access is checked.

> The current `canvas-files` bucket is public. Make it private before enabling
> sharing, otherwise anyone with an asset URL can access that file.

## Data model

```sql
create table public.canvas_members (
  canvas_id uuid not null references public.canvases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (canvas_id, user_id)
);
```

Owners can read, update, delete, and manage members. Members can read; only
members with the `editor` role can update. RLS policies must encode those rules
for both `canvases` and `storage.objects`.

## API and UI

- Pass `canvasId` and `canvasName` to `TaskView`.
- The Share button opens a modal to invite by email and choose `Viewer` or
  `Editor`.
- `POST /api/canvases/:id/members` verifies that the caller owns the canvas,
  validates the email and role, then upserts the member.
- `GET /api/canvases/:id/members` lists members for the owner.
- `DELETE /api/canvases/:id/members/:userId` revokes access.
- Rate-limit mutations and verify the request origin for cookie-authenticated
  writes.

Canvas queries must load canvases the user owns **or** is a member of. Do not
rely on the canvas slug as authorization.

## Future: link sharing

If public links are added later, make them read-only and use a cryptographically
random, expiring, revocable token. Store only a hash of that token. Never use a
predictable canvas ID or slug as the secret.
