# Supabase setup

## Fresh start (delete everything and recreate)

1. **Empty storage (Dashboard only — SQL cannot delete files):**  
   **Storage** → `canvas-files` → ⋮ menu → **Empty bucket** (or delete the bucket).
2. Open [Supabase Dashboard](https://supabase.com/dashboard) → **SQL** → **New query**.
3. Paste and run the full contents of **`reset_from_scratch.sql`**.
4. Confirm **Database → Replication** lists `canvases` under Realtime.
5. Confirm **Storage** has a public bucket named `canvas-files`.

This removes all canvas projects from the database and recreates tables, policies, and Realtime.

**Clear local cache in each browser** (pick one):

- Visit **`/work?resetLocal=1`** while logged in (easiest — no console).
- Or DevTools → **Application** → **Local Storage** → your site URL → select keys starting with `canvasai:` → Delete (or right‑click → Clear).

---

## Normal setup (first time, no reset)

1. Run `migrations/001_canvases.sql`
2. Run `migrations/002_realtime_canvases.sql`

Both are safe to re-run if something already exists.

---

## After setup

- **New File** on `/work` creates a project.
- Open the same canvas in two browsers to test live sync (delete, undo, moves).
